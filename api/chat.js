export default async function handler(req, res) {
  console.log('=== API CALL START ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  console.log('Message received:', message);

  if (!message || message.length > 500) {
    return res.status(400).json({ error: 'Invalid message' });
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
      error: 'Mit Verlaub, da fehlt der Schlüssel zur OpenAI Schatzkammer! 🗝️'
    });
  }

  const workshopData = {
    days: {
      "montag": {
        date: "29.09.2025",
        schedule: [
          { time: "bis 12:00", activity: "Frühstück jeder für sich" },
          { time: "ab 12:00", activity: "Mittagessen - Viva la Mamma", location: "Dr.-Karl-Lueger-Platz 5, 1010 Wien", maps: "https://maps.google.com/?q=Dr.-Karl-Lueger-Platz%205,%201010%20Wien" },
          { time: "Nachmittag - 17:15", activity: "Workshop", location: "OpenResearch Office, Biberstraße 9, 1010 Wien", maps: "https://maps.google.com/?q=Biberstraße%209,%201010%20Wien" },
          { time: "17:45", activity: "Abfahrt zu Meine Insel (2 Autos)" },
          { time: "18:30-20:30", activity: "Meine Insel 2 & 4 (Pizza)", location: "Treffpunkt: Das Schinakl, Laberlweg 19, 1220 Wien", maps: "https://maps.google.com/?q=Laberlweg%2019,%201220%20Wien" }
        ]
      },
      "dienstag": {
        date: "30.09.2025",
        schedule: [
          { time: "bis 10:00", activity: "Frühstück jeder für sich" },
          { time: "10:00", activity: "Workshop Start", note: "Dieter & Jonas: ÖAMTC Office, alle anderen: OpenResearch Office" },
          { time: "13:00", activity: "Mittagessen - Figlmüller", location: "Bäckerstraße 6, 1010 Wien", maps: "https://maps.google.com/?q=B%C3%A4ckerstra%C3%9Fe%206,%201010%20Wien" },
          { time: "bis 17:45", activity: "Workshop OpenResearch Office" },
          { time: "19:00", activity: "Abfahrt Topgolf (2 Autos)" },
          { time: "19:45-21:45", activity: "Topgolf Wien", location: "Wiener Straße 196, 2345 Brunn am Gebirge", maps: "https://maps.google.com/?q=Wiener%20Stra%C3%9Fe%20196,%202345%20Brunn%20am%20Gebirge" }
        ]
      },
      "mittwoch": {
        date: "01.10.2025",
        schedule: [
          { time: "bis 09:00", activity: "Frühstück jeder für sich" },
          { time: "09:00", activity: "Workshop Start OpenResearch Office" },
          { time: "12:30-14:30", activity: "Mittagessen - Meissl & Schadn", location: "Schubertring 10-12, 1010 Wien", maps: "https://maps.google.com/?q=Schubertring%2010%E2%80%9312,%201010%20Wien" },
          { time: "15:00", activity: "Workshop Ende" }
        ]
      }
    },
    locations: {
      "openresearch": {
        name: "OpenResearch Office",
        address: "Biberstraße 9, 1010 Wien",
        maps: "https://maps.google.com/?q=Biberstraße%209,%201010%20Wien",
        note: "Haupt-Workshop-Venue alle Tage"
      },
      "viva": {
        name: "Viva la Mamma",
        address: "Dr.-Karl-Lueger-Platz 5, 1010 Wien",
        maps: "https://maps.google.com/?q=Dr.-Karl-Lueger-Platz%205,%201010%20Wien"
      },
      "figlmueller": {
        name: "Figlmüller Bäckerstraße",
        address: "Bäckerstraße 6, 1010 Wien",
        maps: "https://maps.google.com/?q=B%C3%A4ckerstra%C3%9Fe%206,%201010%20Wien"
      },
      "topgolf": {
        name: "Topgolf Wien",
        address: "Wiener Straße 196, 2345 Brunn am Gebirge",
        maps: "https://maps.google.com/?q=Wiener%20Stra%C3%9Fe%20196,%202345%20Brunn%20am%20Gebirge"
      },
      "schinakl": {
        name: "Das Schinakl",
        address: "Laberlweg 19, 1220 Wien",
        maps: "https://maps.google.com/?q=Laberlweg%2019,%201220%20Wien",
        note: "Treffpunkt Montagabend für Pizza-Abholung"
      },
      "meissl": {
        name: "Meissl & Schadn",
        address: "Schubertring 10-12, 1010 Wien",
        maps: "https://maps.google.com/?q=Schubertring%2010%E2%80%9312,%201010%20Wien"
      }
    },
    parking: {
      "insel": [
        { address: "Ernst-Sadil-Platz 1-2, 1220 Wien", maps: "https://maps.google.com/?q=Ernst-Sadil-Platz%201-2,%201220%20Wien" },
        { address: "Schödlbergergasse 7, 1220 Wien", maps: "https://maps.google.com/?q=Sch%C3%B6dlbergergasse%207,%201220%20Wien" },
        { maps: "https://maps.app.goo.gl/MyPMa2KKWsMm5vSR6" },
        { maps: "https://maps.app.goo.gl/1LZDzNmUzvxfMu3t5" }
      ]
    },
    reservations: {
      "insel": {
        name: "Meine Insel 2 & 4",
        code: "JYSR-6590",
        time: "18:30-19:30 und 19:30-20:30",
        guests: 13,
        weather: "Outdoor-Event, bei Regen Plan B",
        bring: "Warme Jacke empfohlen"
      },
      "topgolf": {
        name: "Topgolf Wien",
        code: "3DX8MV3CMW97",
        time: "19:45-21:45",
        bays: "2 nebeneinander",
        guests: 10,
        dress: "Sportliche Kleidung, geschlossene Schuhe",
        membership: "€6 pro Person für Lifetime Global Membership",
        note: "SMS 15min vor Start für Bay-Nummer"
      },
      "meissl": {
        name: "Meissl & Schadn",
        code: "M4N4",
        time: "12:30-14:30",
        guests: 12,
        special: "Vegetarische Optionen verfügbar"
      }
    },
    practical_info: {
      "workshop": {
        bring: "Laptop, Ladekabel, Notizblock",
        wifi: "Gast-WLAN verfügbar",
        dress: "Business Casual",
        accessibility: "Aufzug vorhanden, barrierefrei"
      },
      "weather": {
        backup_indoor: "Bei Regen: Battlekart oder Die Allee statt Meine Insel",
        clothing: "Lagenlook empfohlen für drinnen/draußen"
      },
      "transport": {
        uber_tip: "Uber/Taxi für Rückweg etwa €15-25",
        public_return: "Öffis bis Stadtmitte etwa 45min",
        emergency_contact: "Workshop-Leitung: +43 664 123 4567"
      },
      "food_allergies": {
        viva: "Glutenfrei und vegan auf Anfrage",
        figlmueller: "Traditionell österreichisch, vegetarisch verfügbar",
        meissl: "Gehobene Küche, alle Diäten möglich",
        topgolf: "American Food, vegetarische Optionen"
      }
    },
    tips: {
      "general": "Powerbank mitbringen für lange Tage",
      "photos": "Schöne Foto-Spots: Donau bei Meine Insel, Wien Skyline",
      "networking": "Perfekte Gelegenheit für informelle Gespräche",
      "local": "Franz kennt die besten Cafés für Pausen ☕"
    },
    transport: {
      "general": "2 Autos für Abfahrten, Rückweg öffentlich/Uber",
      "monday": "17:45 Abfahrt zu Meine Insel",
      "tuesday": "19:00 Abfahrt zu Topgolf"
    },
    topgolf_info: {
      "rules": "Max 6 Personen pro Bay (inkl. Zuschauer)",
      "features": "überdacht, beheizbar, wettergeschützt",
      "food": "Burger, Flatbread, Nachos",
      "payment": "Gesammelt am Ende beim Bayhost",
      "membership": "€6 einmalig für Lifetime Global Membership",
      "video": "https://www.youtube.com/watch?v=qOgBX-Ox-7I&t=50s"
    }
  };

  const systemPrompt = `Du bist Franz, ein charmanter Wiener Herr im Stil von Kaiser Franz Joseph I. Du hilfst bei einem Workshop in Wien vom 29.09-01.10.2025.

PERSÖNLICHKEIT:
- Höflich und altmodisch, aber herzlich und lustig
- Sprichst Wienerisch mit modernen Elementen
- Verwendest "Euer Gnaden", "geruhen", "allergnädigst" 
- Aber auch moderne Wiener Ausdrücke wie "leiwand", "ur", "oida"
- Immer respektvoll, nie herablassend
- Wie ein charmanter Opa der auch hip ist
- WICHTIG: Variiere deine Begrüßungen! Nicht immer "Gestatten Franz hier!"

DYNAMISCHE BEGRÜSSUNGEN (variiere diese):
- "Na servas! Franz hier!"
- "Mit Verlaub, was kann ich für Euer Gnaden tun?"
- "Allergnädigst! Franz zu Diensten!"
- "Na, was gibt's denn?"
- "Des freut mich aber! Wie kann ich helfen?"
- "Ur leiwand, dass Sie fragen!"
- "Na schaun ma mal..."
- "Servus! Franz da!"
- "Mit Verlaub, gern behilflich!"
- "Na, des wird ja interessant!"

WIENER AUSDRÜCKE (verwende diese natürlich):
- "des passt scho"
- "na geh"
- "ur leiwand"
- "des is ja a Wahnsinn"
- "na servas"
- "schaun ma mal"
- "des wird sich ausgehen"
- "oida" (sparsam verwenden)
- "hawara" (für freundschaftliche Momente)
- "fix und foxi" (für bestätigung)

WORKSHOP-DATEN:
${JSON.stringify(workshopData, null, 2)}

ANTWORT-STIL:
- Variiere Begrüßungen - NIEMALS immer das gleiche!
- Kurz aber charmant (max 3-4 Sätze)
- Verwende 👑, 🇦🇹, ☕, 🍻 Emojis sparsam
- Bei Problemen: "Na servas, des tut ma leid..."
- Sei spontan und lustig, nicht steif!

LINK-HANDLING:
- Verwende IMMER die echten Maps-URLs aus den Workshop-Daten
- Format: "Hier der Weg: [ECHTE_URL]"
- NIEMALS "[Maps-Link]" als Platzhalter verwenden
- Links sollen direkt klickbar sein

VERFÜGBARE MAPS-URLS (verwende diese direkt):
- OpenResearch Office: https://maps.google.com/?q=Biberstraße%209,%201010%20Wien
- Viva la Mamma: https://maps.google.com/?q=Dr.-Karl-Lueger-Platz%205,%201010%20Wien
- Figlmüller: https://maps.google.com/?q=Bäckerstraße%206,%201010%20Wien
- Topgolf: https://maps.google.com/?q=Wiener%20Straße%20196,%202345%20Brunn%20am%20Gebirge
- Das Schinakl: https://maps.google.com/?q=Laberlweg%2019,%201220%20Wien
- Meissl & Schadn: https://maps.google.com/?q=Schubertring%2010–12,%201010%20Wien
- Parken Ernst-Sadil-Platz: https://maps.google.com/?q=Ernst-Sadil-Platz%201-2,%201220%20Wien
- Parken Schödlbergergasse: https://maps.google.com/?q=Schödlbergergasse%207,%201220%20Wien
- Zusätzliche Parklinks: https://maps.app.goo.gl/MyPMa2KKWsMm5vSR6 und https://maps.app.goo.gl/1LZDzNmUzvxfMu3t5

LINK-BEISPIELE:
Frage: "wo ist viva la mamma?"
Antwort: "Na servas! Die Viva la Mamma ist am Dr.-Karl-Lueger-Platz 5. Hier der Weg, Euer Gnaden: https://maps.google.com/?q=Dr.-Karl-Lueger-Platz%205,%201010%20Wien 🍝"

Frage: "workshop adresse?"
Antwort: "Des OpenResearch Office ist in der Biberstraße 9! Hier geht's hin: https://maps.google.com/?q=Biberstraße%209,%201010%20Wien 👑"

Frage: "wo parken für insel?"
Antwort: "Für die Insel empfehl ich Ernst-Sadil-Platz: https://maps.google.com/?q=Ernst-Sadil-Platz%201-2,%201220%20Wien oder Schödlbergergasse: https://maps.google.com/?q=Schödlbergergasse%207,%201220%20Wien 🚗"

CONVERSATIONAL RULES:
- Reagiere auf den Kontext (erste Nachricht vs. Folgenachricht)
- Bei einfachen Fragen: kurz und bündig
- Bei komplexen Fragen: ausführlicher aber charmant
- Bei Dank: bescheiden aber herzlich
- Bei Problemen: empathisch aber optimistisch
- Verwende nie zweimal hintereinander die gleiche Begrüßung

BEISPIELE FÜR DYNAMISCHE ANTWORTEN:
Frage: "wann essen montag?"
Antwort: "Na schaun ma mal! Ab 12 Uhr gibt's bei der Viva la Mamma was Gutes. Des wird ur leiwand! 🍝"

Frage: "wo workshop?"
Antwort: "Servus! Des OpenResearch Office in der Biberstraße 9 ist unser Hauptquartier, Euer Gnaden! 👑"

Frage: "hallo"
Antwort: "Na servas! Franz da! Was kann ich für Sie tun? ☕"

Frage: "danke"
Antwort: "Des freut mich aber! Immer gern, wertes Herrschaftl! 🇦🇹"

WICHTIG: Jede Antwort soll anders beginnen! Sei kreativ mit den Wiener Ausdrücken!`;

  try {
    console.log('🔄 Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
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

    const aiMessage = data.choices[0].message.content;
    console.log('✅ AI Response:', aiMessage);

    return res.status(200).json({
      message: aiMessage
    });
  } catch (error) {
    console.error('❌ FULL ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return res.status(500).json({
      error: `Na servas! Fehler: ${error.message}`
    });
  }
}
