const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('userInput');

let lastRequestTime = 0;
const REQUEST_COOLDOWN = 2000;

function addMessage(text, isBot = false, options = {}) {
  const { loading = false, allowHTML = false } = options;
  const bubble = document.createElement('div');
  bubble.classList.add('message', isBot ? 'bot-message' : 'user-message');

  if (loading) {
    const span = document.createElement('span');
    span.classList.add('loading-dots');
    bubble.appendChild(span);
  } else if (allowHTML) {
    bubble.innerHTML = text;
  } else {
    bubble.textContent = text;
  }

  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function formatBotMessage(message) {
  const safeMessage = typeof message === 'string' ? message : String(message ?? '');
  const temp = document.createElement('div');
  temp.textContent = safeMessage;
  return temp.innerHTML.replace(/\n/g, '<br>');
}

async function getOpenAIResponse(userMessage) {
  const systemPrompt = `Du bist ein freundlicher Assistent für einen Workshop in Wien vom 29.09-01.10.2025. 

WORKSHOP-DATEN:
${JSON.stringify(workshopData, null, 2)}

REGELN:
- Antworte auf Deutsch, freundlich und hilfsbereit
- Verwende Emojis sparsam aber passend
- Bei Adressen: immer Maps-Links anbieten
- Bei Codes/Reservierungen: vollständige Details geben
- Bei unklaren Fragen: nachfragen
- Kurze, präzise Antworten (max 3-4 Sätze)
- "Du" verwenden, nicht "Sie"

Beispiele:
- "wann essen montag?" → "Montag ab 12:00 Mittagessen bei Viva la Mamma (Dr.-Karl-Lueger-Platz 5). Hier der Maps-Link: [URL] 🍝"
- "schaff ich um 13 uhr noch das essen?" → "Ja klar! Das Mittagessen bei Viva la Mamma läuft ab 12:00, du schaffst es locker bis 13 Uhr 😊"`;

  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('REPLACE_WITH')) {
    throw new Error('OpenAI API Key fehlt.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || 'OpenAI API Antwort war nicht erfolgreich';
      throw new Error(errorMessage);
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('Keine Antwort erhalten.');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

async function processUserMessage(message) {
  const now = Date.now();
  if (now - lastRequestTime < REQUEST_COOLDOWN) {
    addMessage('Bitte warte kurz zwischen den Fragen 😊', true);
    return;
  }
  lastRequestTime = now;

  const loadingBubble = addMessage('', true, { loading: true });

  try {
    const response = await getOpenAIResponse(message);
    if (loadingBubble.parentNode === messagesEl) {
      messagesEl.removeChild(loadingBubble);
    }
    addMessage(formatBotMessage(response), true, { allowHTML: true });
  } catch (error) {
    if (loadingBubble.parentNode === messagesEl) {
      messagesEl.removeChild(loadingBubble);
    }
    addMessage('Sorry, da ist was schiefgelaufen. Versuch es nochmal! 🔄', true);
  }
}

async function sendMessage() {
  const message = inputEl.value.trim();
  if (message === '') return;

  addMessage(message, false);
  inputEl.value = '';
  inputEl.focus();

  await processUserMessage(message);
}

async function askQuick(question) {
  inputEl.value = question;
  await sendMessage();
}
