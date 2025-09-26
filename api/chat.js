import fs from 'fs';

const STORAGE_FILE = '/tmp/franz-extensions.json';

function loadExtensions() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.extensions)) {
        return { extensions: parsed.extensions };
      }
      if (Array.isArray(parsed)) {
        return { extensions: parsed };
      }
      return { extensions: [] };
    }
  } catch (error) {
    console.error('Error loading extensions:', error);
  }

  console.log('No extensions found, using empty state');
  return { extensions: [] };
}

export default async function handler(req, res) {
  console.log('=== CHAT API START ===');
  console.log('Method:', req.method);


  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  console.log('Messages received:', messages);

  const now = new Date();
  const nowVienna = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Vienna' }));
  const today = nowVienna.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Vienna'
  });

  const currentTime = nowVienna.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Vienna'
  });

  const workshopDates = {
    '29.09.2025': 'montag',
    '30.09.2025': 'dienstag',
    '01.10.2025': 'mittwoch'
  };

  const todayShort = nowVienna.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Vienna'
  });

  const workshopDay = workshopDates[todayShort] || null;

  let workshopStatus = '';
  if (workshopDay) {
    workshopStatus = `HEUTE IST WORKSHOP-TAG: ${workshopDay.toUpperCase()}`;
  } else {
    const workshopStart = new Date('2025-09-29T00:00:00+02:00');
    const workshopEnd = new Date('2025-10-01T23:59:59+02:00');
    if (nowVienna < workshopStart) {
      workshopStatus = 'WORKSHOP IST NOCH NICHT GESTARTET (beginnt am 29.09.2025)';
    } else if (nowVienna > workshopEnd) {
      workshopStatus = 'WORKSHOP IST BEREITS BEENDET (war vom 29.09-01.10.2025)';
    } else {
      workshopStatus = 'ZWISCHEN WORKSHOP-TAGEN';
    }
  }

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
        emergency_contact: "Workshop-Leitung: +43 660 6913321"
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
    },

    contact: {
      "workshop_lead": {
        name: "Marcus",
        phone: "+43 660 6913321",
        role: "Workshop-Leitung & Hauptansprechpartner",
        available: "Montag ab 8:00 im Büro, sonst zu allen Terminen",
        whatsapp: "Ja, gleiche Nummer"
      },
      "openresearch": {
        company: "OpenResearch GmbH",
        office_hours: "Mo-Fr 8:00-18:00",
        address: "Biberstraße 9, 4. Stock",
        access: "Unten anläuten bei OpenResearch, jemand macht auf"
      }
    },

    travel: {
      "airport_to_city": {
        s7: {
          name: "S-Bahn S7",
          frequency: "Alle 30 Minuten",
          duration: "~16 Minuten bis Wien Mitte",
          cost: "~4,40€ mit Wien-Ticket",
          route: "Flughafen → Wien Mitte → Umsteigen zu U3/U4",
          note: "Günstigste Option"
        },
        cat: {
          name: "City Airport Train (CAT)",
          frequency: "Alle 30 Minuten",
          duration: "~16 Minuten bis Wien Mitte",
          cost: "~12€",
          route: "Flughafen → Wien Mitte (non-stop)",
          note: "Schneller, aber teurer"
        },
        taxi: {
          duration: "~30-45 Min je nach Verkehr",
          cost: "~35-45€",
          note: "Direkt, aber teuerste Option"
        }
      },
      "between_locations": {
        to_workshop: {
          from_city: "U3 Herrengasse oder U1 Stephansplatz → 5 Min Fußweg",
          note: "OpenResearch Office zentral gelegen"
        },
        to_insel: {
          public: "U1 bis Kagran, dann Bus 84A bis Schüttaustraße",
          duration_public: "~45 Minuten",
          car: "Mit Marcus im 7-Sitzer oder eigenem Auto",
          duration_car: "~25 Minuten",
          note: "Öffis machbar, Auto entspannter"
        },
        to_topgolf: {
          public: "S-Bahn bis Mödling, dann Bus/Taxi",
          duration_public: "~60 Minuten",
          car: "Mit Marcus im 7-Sitzer empfohlen",
          duration_car: "~30 Minuten",
          note: "Auto definitiv besser für Topgolf"
        }
      }
    },

    wien_tips: {
      "public_transport": {
        app: "WienMobil App installieren",
        tickets: {
          "24h": "~8€ - perfekt für 1 Tag",
          "48h": "~14,10€ - ideal für Workshop",
          "72h": "~17,10€ - falls länger in Wien"
        },
        note: "Tickets gelten für U-Bahn, Bus, Tram, S-Bahn",
        zones: "Workshop-Locations alle in Zone 100 (Kernzone)"
      },
      "shopping": {
        supermarkets: [
          {
            name: "Spar",
            distance: "3 Minuten von OpenResearch",
            hours: "Mo-Sa 7:00-21:00, So 8:00-18:00",
            note: "Snacks, Getränke, Basics"
          },
          {
            name: "Billa",
            distance: "5 Minuten von OpenResearch",
            hours: "Mo-Sa 7:00-21:00, So 8:00-18:00",
            note: "Größere Auswahl, auch warme Speisen"
          }
        ],
        pharmacy: {
          name: "Apotheke zur Goldenen Kugel",
          distance: "2 Minuten von OpenResearch",
          address: "Graben 13, 1010 Wien",
          hours: "Mo-Fr 8:00-18:30, Sa 8:00-12:00"
        }
      },
      "local_recommendations": {
        coffee_near_office: [
          "Café Central (5 Min) - Wiener Kaffeehaus-Klassiker",
          "Phil (3 Min) - Modern, guter Flat White",
          "Café Hawelka (7 Min) - Legendäre Melange"
        ],
        quick_lunch: [
          "Figlmüller Bäckerstraße - Original Wiener Schnitzel",
          "Vapiano Graben (4 Min) - Schnelle italienische Küche",
          "Dean & David (3 Min) - Salate und gesundes Essen"
        ],
        sightseeing_breaks: [
          "Stephansdom (5 Min Fußweg) - Wahrzeichen Wiens",
          "Graben & Kohlmarkt (2 Min) - Einkaufsstraßen",
          "Hofburg (8 Min) - Kaiserpalast"
        ]
      }
    },

    workshop_details: {
      "check_in": {
        monday: {
          time: "Ab 8:00 Uhr",
          location: "OpenResearch Office, 4. Stock",
          process: "Unten anläuten bei OpenResearch → jemand macht auf",
          contact: "Marcus ist ab 8:00 vor Ort"
        },
        other_days: {
          process: "Direkt zu den Treffpunkten laut Zeitplan",
          late_arrival: "Marcus unter +43 660 6913321 anrufen/WhatsApp"
        }
      },
      "tech_setup": {
        wifi: {
          password: "Bei Marcus oder OpenResearch-Team erfragen"
        }
      }
    },

    weather_backup: {
      "current_season": "Ende September - mild, aber unberechenbar",
      "recommended_clothing": [
        "Lagenlook: T-Shirt + Pullover + leichte Jacke",
        "Geschlossene Schuhe (auch für Topgolf)",
        "Regenschirm oder Regenjacke",
        "Warme Jacke für Meine Insel (Outdoor)"
      ],
      "indoor_alternatives": {
        "instead_of_insel": [
          "Battlekart - Indoor Kartbahn",
          "Die Allee - Bowling & Entertainment"
        ],
        "contingency": "Entscheidung wird vor Ort getroffen"
      }
    },

    costs_and_payments: {
      "included": [
        "Alle Mahlzeiten (Viva la Mamma, Figlmüller, Meissl & Schadn)",
        "Meine Insel Reservierung + Pizzaofen",
        "Topgolf Spielzeit (2 Stunden)"
      ],
      "self_pay": [
        "Topgolf Membership (€6 pro Person - einmalig)",
        "Zusätzliche Getränke/Snacks",
        "Anreise/Abreise nach Wien",
        "Öffi-Tickets in Wien",
        "Private Sightseeing/Shopping"
      ],
      "tips": {
        "restaurants": "10% Trinkgeld ist üblich in Wien",
        "taxis": "Aufrunden oder 10%",
        "bars": "€1-2 pro Drink"
      }
    },

    emergency: {
      "workshop_issues": {
        primary: "Marcus +43 660 6913321 (WhatsApp verfügbar)",
        office: "OpenResearch Office: Biberstraße 9, 4. Stock"
      },
      "medical": {
        emergency: "144 (Rettung)",
        pharmacy_emergency: "1455 (Nacht-Apotheken)"
      },
      "general": {
        police: "133",
        fire: "122",
        tourist_help: "+43 1 24 555 (Wien Tourismus)"
      }
    }
  };

  const parseWorkshopDate = (dateString) => {
    const [day, month, year] = dateString.split('.').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const workshopDaysArray = Object.entries(workshopData.days)
    .map(([key, info]) => ({ key, ...info, dateObj: parseWorkshopDate(info.date) }))
    .sort((a, b) => a.dateObj - b.dateObj);

  const upcomingWorkshopsText = workshopDaysArray.length > 0
    ? workshopDaysArray.map(day => `- ${day.key.toUpperCase()}: ${day.date}`).join('\n')
    : '- Keine Workshop-Termine vorhanden.';

  const todayUTC = Date.UTC(nowVienna.getFullYear(), nowVienna.getMonth(), nowVienna.getDate());
  let nextWorkshopDayInfo = null;
  if (!workshopDay) {
    nextWorkshopDayInfo = workshopDaysArray.find(day => day.dateObj.getTime() >= todayUTC) || null;
  }

  let nextEvent = null;
  if (workshopDay && workshopData.days[workshopDay]) {
    const todaySchedule = workshopData.days[workshopDay].schedule;
    const currentMinutes = nowVienna.getHours() * 60 + nowVienna.getMinutes();

    for (const event of todaySchedule) {
      const timeMatch = event.time.match(/(\d{1,2}):(\d{2})/);
      if (!timeMatch) {
        continue;
      }

      const eventMinutes = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
      if (eventMinutes > currentMinutes) {
        nextEvent = event;
        break;
      }
    }
  }

  const nextWorkshopText = !workshopDay
    ? nextWorkshopDayInfo
      ? `NÄCHSTER WORKSHOP: ${nextWorkshopDayInfo.date} (${nextWorkshopDayInfo.key.toUpperCase()})`
      : 'NÄCHSTER WORKSHOP: Keine weiteren Workshop-Termine geplant.'
    : '';

  const nextEventText = nextEvent
    ? `NÄCHSTES EVENT HEUTE: ${nextEvent.time} - ${nextEvent.activity}${nextEvent.location ? ` (${nextEvent.location})` : ''}`
    : '';

  const todaysProgramHeader = workshopDay ? `HEUTE'S PROGRAMM (${workshopDay.toUpperCase()}):` : 'KEIN WORKSHOP HEUTE - hier die nächsten Termine:';
  const todaysProgramBody = workshopDay ? '' : upcomingWorkshopsText;
  const nextWorkshopLine = nextWorkshopText ? `${nextWorkshopText}\n` : '';
  const nextEventSection = nextEventText ? `\n${nextEventText}` : '';

  let systemPrompt = `Du bist Franz, ein charmanter Wiener Herr im Stil von Kaiser Franz Joseph I. Du hilfst bei einem Workshop in Wien vom 29.09-01.10.2025.

AKTUELLES DATUM UND ZEIT:
Heute ist: ${today}
Aktuelle Uhrzeit: ${currentTime} (Wien Zeit)
Workshop-Status: ${workshopStatus}
${nextWorkshopLine}${todaysProgramHeader}
${todaysProgramBody}

WICHTIGE ZEITBEZUG-REGELN:
- Bei Fragen nach "heute", "jetzt", "aktuell" IMMER das heutige Datum verwenden
- Bei "morgen" oder "übermorgen" Datum und Programm entsprechend berechnen
- Bei Fragen nach "wann treffen wir uns?" das nächste Event zeigen
- Wenn heute kein Workshop ist, das nächste Workshop-Event nennen
- Bei Zeitangaben immer Wien-Zeit verwenden${nextEventSection}

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

WICHTIG: Jede Antwort soll anders beginnen! Sei kreativ mit den Wiener Ausdrücken!

ANTWORT-BEISPIELE JE NACH DATUM:
Frage: "was machen wir heute?"
- Wenn heute Montag (29.09): "Na servas! Heute treffen wir uns ab 12 Uhr bei Viva la Mamma..."
- Wenn heute Dienstag (30.09): "Hawara! Heute startet um 10 Uhr der Workshop im OpenResearch Office..."
- Wenn heute Mittwoch (01.10): "Letzter Workshop-Tag! Um 9 Uhr geht's los..."
- Wenn heute kein Workshop: "Heute ist kein Workshop, aber am [nächstes Datum] geht's weiter..."

Frage: "welcher tag ist heute?"
Antwort: "Heute ist ${today}. ${workshopDay ? `Das ist unser Workshop-${workshopDay}!` : 'Kein Workshop heute.'}"`;

  const franzExtensions = loadExtensions();
  console.log('🔍 Extensions loaded:', JSON.stringify(franzExtensions, null, 2));
  console.log('🔍 Total extensions:', (franzExtensions.extensions || []).length);

  console.log('🔍 Adding extensions to systemPrompt...');

  if (franzExtensions.extensions && franzExtensions.extensions.length > 0) {
    console.log('✅ Adding extensions to systemPrompt:', franzExtensions.extensions);
    systemPrompt += `\n\nVON WORKSHOP-GEWINNERN BEIGEBRACHTES WISSEN:\n`;
    franzExtensions.extensions.forEach(ext => {
      systemPrompt += `- ${ext.content} (von ${ext.winner})\n`;
    });
  } else {
    console.log('❌ No extensions found');
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

    const aiMessage = data.choices[0].message.content;
    console.log('✅ AI Response:', aiMessage);

    return res.status(200).json({
      message: aiMessage
    });
  } catch (error) {
    console.error('❌ FULL ERROR:', error);

    return res.status(500).json({
      error: `Na servas! Fehler: ${error.message}`
    });
  }
}
