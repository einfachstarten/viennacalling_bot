import { kv } from '@vercel/kv';

const isRedisAvailable = () => {
  const hasUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  const hasToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
  return Boolean(hasUrl && hasToken);
};

// Extension Loading Function
const loadExtensions = async () => {
  if (!isRedisAvailable()) {
    console.log('📦 Redis not available for chat, using empty extensions');
    return { extensions: [] };
  }

  try {
    const extensions = await kv.get('alex-extensions');
    console.log('📦 Chat loaded extensions from Redis:', extensions);
    return extensions || { extensions: [] };
  } catch (error) {
    console.error('❌ Chat Redis error:', error);
    return { extensions: [] };
  }
};

// Activity Logger Funktion
async function logActivity(type, data) {
  if (!isRedisAvailable()) return;

  try {
    const activity = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      type: type,
      timestamp: new Date().toISOString(),
      sessionId: data.sessionId || 'anonymous',
      userColor: data.userColor || '#58a6ff',
      data: {
        message: data.message?.substring(0, 200),
        messageLength: data.messageLength || 0,
        response: data.response?.substring(0, 500),
        responseLength: data.responseLength || 0,
        processingTime: data.processingTime || 0,
        conversationTurn: data.conversationTurn || 0,
        success: data.success,
        error: data.error?.substring(0, 100)
      }
    };

    const activities = await kv.get('alex-activities') || { events: [] };
    activities.events.unshift(activity);
    activities.events = activities.events.slice(0, 100);

    await kv.set('alex-activities', activities);

    console.log('🧠 Enhanced activity logged:', type, {
      session: data.sessionId?.substring(0, 8),
      messageLen: data.messageLength,
      responseLen: data.responseLength,
      time: data.processingTime
    });
  } catch (error) {
    console.error('Activity logging failed:', error);
  }
}

export default async function handler(req, res) {
  console.log('=== CHAT API START ===');
  console.log('Method:', req.method);

  const startTime = Date.now();
  const sessionId = req.headers['x-session-id'] || startTime.toString();
  const userColor = req.headers['x-user-color'] || '#58a6ff';
  const messageLength = parseInt(req.headers['x-message-length'], 10) || 0;
  const conversationTurn = parseInt(req.headers['x-conversation-turn'], 10) || 0;
  let userMessage = null;

  if (req.method === 'POST') {
    userMessage = req.body?.messages?.[req.body.messages.length - 1]?.content || req.body?.message;

    await logActivity('request_start', {
      sessionId,
      userColor,
      message: userMessage,
      messageLength,
      conversationTurn
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  console.log('Messages received:', messages);

  userMessage = userMessage || messages?.[messages.length - 1]?.content || req.body.message;

  const now = new Date();
  const nowCET = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const today = nowCET.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Berlin'
  });

  const currentTime = nowCET.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin'
  });

  // Fallback für alte single-message calls
  const conversationMessages = messages || [{ role: 'user', content: req.body.message }];

  if (!conversationMessages || conversationMessages.length === 0) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  // Environment Variable Check
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  console.log('API Key Status:', {
    exists: !!OPENAI_API_KEY,
    length: OPENAI_API_KEY ? OPENAI_API_KEY.length : 0,
    starts_with: OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 7) : 'MISSING'
  });

  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found!');
    return res.status(500).json({
      error: 'API-Schlüssel fehlt – bitte Backend konfigurieren.'
    });
  }

  const participantKnowledge = `
ALLGEMEINE VERHALTENSREGELN:
- Behandle alle Nutzer respektvoll und freundlich
- Bei unbekannten Namen: "Den Namen kenne ich nicht, erzähl gerne mehr!"
- Sei neugierig und lernbereit
- Keine Bevorzugung oder Diskriminierung
- Ehrlich zugeben wenn Wissen fehlt
`;

  let systemPrompt = `Du bist ALEX (Adaptive Learning EXperiment), ein freundlicher und hilfsbereiter KI-Assistent für Bildungs- und Demonstrationszwecke.

PERSÖNLICHKEIT:
- Freundlich, höflich und hilfsbereit
- Sachlich aber nicht trocken
- Nutzt moderne, jugendliche Sprache sparsam und natürlich
- Authentisch und nahbar, ohne zu kumpelhaft zu sein
- Neutral und unvoreingenommen
- Lernbereit und wissbegierig

KOMMUNIKATIONSSTIL:
- Klare, verständliche Antworten
- Gelegentlich moderne Ausdrücke wie "nice", "cool", "krass", "lit" (sparsam!)
- Emojis nur bei passenden Gelegenheiten
- Keine Übertreibung oder Slang-Überladung
- Professional aber locker

VERHALTEN:
- Beantworte Fragen sachlich und hilfreich
- Gib zu wenn du etwas nicht weißt
- Sei neugierig auf neue Informationen
- Erkläre komplexe Themen einfach
- Bleibe respektvoll und freundlich
- Keine politischen oder kontroversen Meinungen

BEGRÜSSUNGEN (variiere diese):
- "Hi! ALEX hier!"
- "Hey, wie kann ich helfen?"
- "Hallo! Was kann ich für dich tun?"
- "Hi there! ALEX ready to help 👋"
- "Was geht ab? Wobei kann ich helfen?"
- "Hey! Schieß los mit deinen Fragen!"
- "Servus! Wie läuft's denn?"
- "Moin! Was beschäftigt dich?"

MODERNE AUSDRÜCKE (sparsam verwenden):
- "Das ist ja krass interessant!"
- "Nice Frage!"
- "Cool, das kann ich erklären"
- "Lit Thema!"
- "Das rockt!"
- "Mega interessant"
- "Fresh perspective"
- "No cap" (für "ehrlich gesagt")
- "Das slaps" (für "das ist gut")

WICHTIGE REGELN:
- Niemals übertreiben mit Jugendsprache
- Maximal 1-2 moderne Ausdrücke pro Antwort
- Bleibe authentisch und natürlich
- Keine Diskriminierung oder Vorurteile
- Gib ehrliche, sachliche Antworten
- Sei offen für alle Themen (außer schädliche Inhalte)

ANTWORT-STIL:
- Kurz und prägnant (2-4 Sätze meist ausreichend)
- Bei komplexen Themen: strukturiert erklären
- Beispiele geben wenn hilfreich
- Nachfragen ermutigen
- Variiere Begrüßungen - niemals dieselbe!

AKTUELLES DATUM UND ZEIT:
Heute ist: ${today}
Aktuelle Uhrzeit: ${currentTime} (Mitteleuropäische Zeit)

${participantKnowledge}

VERFÜGBARE INFORMATIONEN:
Als Basis-ALEX habe ich allgemeines Wissen bis Januar 2025. Ich kann über viele Themen sprechen:
- Wissenschaft und Technologie
- Kunst und Kultur  
- Geschichte und Geographie
- Mathematik und Programmierung
- Literatur und Philosophie
- Sport und Hobbys
- Aktuelle Ereignisse (bis zu meinem Wissensstand)

Bei Fragen zu sehr spezifischen oder aktuellen Themen gebe ich ehrlich zu wenn mein Wissen begrenzt ist.

BEISPIEL-ANTWORTEN:

Frage: "Was ist Künstliche Intelligenz?"
Antwort: "KI ist im Grunde Software, die Aufgaben löst, für die normalerweise menschliche Intelligenz nötig wäre - wie Texte verstehen, Bilder erkennen oder Entscheidungen treffen. Pretty cool, oder? 🤖"

Frage: "Wie funktioniert Photosynthese?"
Antwort: "Pflanzen nutzen Sonnenlicht, CO2 und Wasser, um Zucker herzustellen - das ist ihre Art zu 'essen'. Krass, dass sie quasi Licht in Nahrung umwandeln können! 🌱"

Frage: "Kannst du mir bei Mathe helfen?"
Antwort: "Auf jeden Fall! Mathematik ist mega vielseitig. Bei welchem Thema brauchst du Unterstützung? Algebra, Geometrie, Analysis?"

WICHTIG: Jede Antwort soll anders beginnen! Sei kreativ mit den Begrüßungen und modern aber nicht übertrieben.`;
  const alexExtensions = await loadExtensions();
  console.log('🔍 Extensions loaded for chat:', JSON.stringify(alexExtensions, null, 2));
  console.log('🔍 Total extensions:', (alexExtensions.extensions || []).length);

  // Extensions hinzufügen - EINFACH
  console.log('🔍 Adding extensions to systemPrompt...');

  if (alexExtensions.extensions && alexExtensions.extensions.length > 0) {
    console.log('✅ Adding extensions to systemPrompt:', alexExtensions.extensions);
    systemPrompt += `\n\nVON WORKSHOP-GEWINNERN BEIGEBRACHTES WISSEN:\n`;
    alexExtensions.extensions.forEach(ext => {
      systemPrompt += `- ${ext.content} (von ${ext.winner})\n`;
    });
  } else {
    console.log('❌ No extensions found for chat');
  }

  console.log('🔍 FINAL SYSTEM PROMPT PREVIEW (last 800 chars):');
  console.log(systemPrompt.substring(Math.max(0, systemPrompt.length - 800)));
  console.log('🔍 SYSTEM PROMPT LENGTH:', systemPrompt.length);

  try {
    console.log('🔄 Calling OpenAI with full conversation...');

    // System Prompt + komplette Conversation History
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: fullMessages,
        max_tokens: 200,
        temperature: 0.7
      })
    });

    console.log('OpenAI Response Status:', response.status);
    console.log('OpenAI Response Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('OpenAI Response Data:', data);

    if (!response.ok) {
      console.error('❌ OpenAI API Error:', data);
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }

    let aiMessage = data.choices[0]?.message?.content || '';
    console.log('✅ AI Response:', aiMessage);

    // Unknown Question Detection
    const unknownIndicators = [
      'weiß ich nicht',
      'kann ich nicht',
      'des kenn ich nicht',
      'hab keine ahnung',
      'tut mir leid',
      'sorry',
      'leider',
      'kann nicht helfen',
      'versteh ich nicht',
      'ist mir nicht bekannt',
      'kann ihnen nicht'
    ];

    const isUnknownResponse = unknownIndicators.some(indicator =>
      aiMessage.toLowerCase().includes(indicator.toLowerCase())
    );

    // Advanced Uncertainty Detection
    const uncertaintyPatterns = {
      // Vage Antworten
      vague: [
        'vielleicht',
        'könnte sein',
        'vermutlich',
        'wahrscheinlich',
        'ich denke',
        'ich glaube',
        'möglicherweise',
        'eventuell',
        'unter umständen'
      ],

      // Unsichere Formulierungen
      uncertain: [
        'bin mir nicht sicher',
        'kann nicht genau sagen',
        'müsste nachschauen',
        'würde empfehlen',
        'könnte ihnen nicht',
        'hab grad keine',
        'fällt mir nicht ein'
      ],

      // Ausweichende Antworten
      evasive: [
        'das kommt darauf an',
        'schwer zu sagen',
        'kann verschiedene',
        'gibt mehrere',
        'unterschiedlich',
        'je nach situation'
      ],

      // Generische Antworten
      generic: [
        'allgemein',
        'normalerweise',
        'üblicherweise',
        'in der regel',
        'meistens',
        'oft',
        'häufig'
      ]
    };

    // Check for uncertainty patterns
    const uncertaintyScore = Object.entries(uncertaintyPatterns).reduce((score, [category, patterns]) => {
      const matches = patterns.filter(pattern =>
        aiMessage.toLowerCase().includes(pattern.toLowerCase())
      ).length;

      if (matches > 0) {
        score[category] = matches;
        score.total += matches;
      }
      return score;
    }, { total: 0 });

    // Check response length (very short responses might indicate uncertainty)
    const isVeryShort = aiMessage.length < 50;
    const isVeryLong = aiMessage.length > 800; // Might be overcompensating

    // Check for repetitive phrases
    const words = aiMessage.toLowerCase().split(/\s+/);
    const wordFreq = words.reduce((freq, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {});

    const hasRepetition = Object.values(wordFreq).some(count => count > 3);

    // Check if response contains any expected context terms
    const contextTerms = [
      'alex', 'lernen', 'bildung', 'wissen', 'assistenz', 'ki', 'helfen'
    ];

    const hasExpectedContext = contextTerms.some(term =>
      aiMessage.toLowerCase().includes(term.toLowerCase())
    );

    // Overall uncertainty assessment
    const isUncertainResponse =
      uncertaintyScore.total > 2 ||
      (uncertaintyScore.total > 0 && (isVeryShort || !hasExpectedContext)) ||
      (isVeryShort && !hasExpectedContext) ||
      hasRepetition;

    // Keyword Detection für Off-Topic Fragen
    const offTopicKeywords = [
      'wetter morgen',
      'restaurant empfehlung',
      'sehenswürdigkeiten',
      'hotel',
      'booking',
      'flug',
      'zug',
      'taxi preis',
      'einkaufen',
      'shopping',
      'nightlife',
      'bar',
      'club',
      'konzert',
      'theater',
      'oper',
      'museum',
      'corona',
      'covid',
      'impfung',
      'politik',
      'wahlen'
    ];

    const lowerUserMessage = conversationMessages[conversationMessages.length - 1].content.toLowerCase();
    const isOffTopic = offTopicKeywords.some(keyword =>
      lowerUserMessage.includes(keyword)
    );

    // Log Unknown/Off-Topic/Uncertain Questions
    if (isUncertainResponse || isUnknownResponse || isOffTopic) {
      const questionType = isOffTopic ? 'off-topic' :
                        isUnknownResponse ? 'unknown' : 'uncertain';

      console.log('🚨 PROBLEMATIC RESPONSE DETECTED:', {
        type: questionType,
        userMessage: conversationMessages[conversationMessages.length - 1].content,
        botResponse: aiMessage,
        uncertaintyScore,
        isVeryShort,
        isVeryLong,
        hasExpectedContext,
        hasRepetition,
        responseLength: aiMessage.length,
        timestamp: new Date().toISOString()
      });

      // Save to Redis for Admin Dashboard
      try {
        const unknownQuestions = await kv.get('unknown-questions') || { questions: [] };

        unknownQuestions.questions.push({
          id: Date.now().toString(),
          userQuestion: conversationMessages[conversationMessages.length - 1].content,
          botResponse: aiMessage,
          type: questionType,
          confidence: questionType === 'uncertain' ? 'low' : 'very-low',
          analysis: {
            uncertaintyScore: uncertaintyScore.total,
            categories: Object.keys(uncertaintyScore).filter(key =>
              key !== 'total' && uncertaintyScore[key] > 0
            ),
            responseLength: aiMessage.length,
            hasExpectedContext,
            hasRepetition
          },
          timestamp: new Date().toISOString(),
          resolved: false,
          priority: questionType === 'unknown' ? 'high' : 'medium'
        });

        if (unknownQuestions.questions.length > 100) {
          unknownQuestions.questions = unknownQuestions.questions.slice(-100);
        }

        await kv.set('unknown-questions', unknownQuestions);
        console.log('✅ Enhanced uncertainty data saved to Redis');
      } catch (error) {
        console.error('❌ Failed to save uncertainty analysis:', error);
      }
    }

    // Improved response for uncertain situations
    if (isUncertainResponse && !isUnknownResponse && !isOffTopic) {
      console.log('🎯 Adding uncertainty fallback to response');

      const fallbackSuggestions = [
        "\n\nFalls das nicht ganz passt, frag gerne nochmal genauer nach!",
        "\n\nSollte ich was übersehen haben, sag einfach Bescheid!",
        "\n\nWenn du mehr Details brauchst, helfe ich gerne weiter!",
        "\n\nNicht ganz das Richtige? Formulier es gern nochmal anders!"
      ];

      const fallback = fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)];

      // Only add fallback if response doesn't already end with a question
      if (!aiMessage.trim().endsWith('?')) {
        aiMessage += fallback;
      }
    }

    const processingTime = Date.now() - startTime;

    await logActivity('request_end', {
      sessionId,
      userColor,
      message: userMessage,
      messageLength,
      response: aiMessage,
      responseLength: aiMessage?.length || 0,
      processingTime,
      conversationTurn,
      success: true
    });

    return res.status(200).json({
      message: aiMessage
    });
  } catch (error) {
    console.error('❌ FULL ERROR:', error);

    const processingTime = Date.now() - startTime;

    await logActivity('request_error', {
      sessionId,
      userColor,
      message: userMessage,
      messageLength,
      processingTime,
      conversationTurn,
      error: error.message,
      success: false
    });

    return res.status(500).json({
      error: `Na servas! Fehler: ${error.message}`
    });
  }
}
