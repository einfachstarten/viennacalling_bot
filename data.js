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
    "openresearch": {
      name: "Parkgarage Georg-Coch-Platz",
      address: "Georg-Coch-Platz 2, 1010 Wien",
      maps: "https://maps.google.com/?q=Georg-Coch-Platz%202,%201010%20Wien",
      distance: "2 Minuten Fußweg zum OpenResearch Office",
      note: "Beste Parkoption für Workshop-Teilnehmer",
      cost: "Kostenpflichtig, Tageskarte empfohlen"
    },
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
      cost: "€300 + Pizzaofen €29"
    },
    "topgolf": {
      name: "Topgolf Wien",
      code: "3DX8MV3CMW97",
      time: "19:45-21:45", 
      bays: "2 nebeneinander",
      guests: 10,
      cost: "€180 + €6 Membership pro Erstspieler",
      note: "SMS 15min vor Start für Bay-Nummer"
    },
    "meissl": {
      name: "Meissl & Schadn",
      code: "M4N4",
      time: "12:30-14:30",
      guests: 12,
      bill: "OpenResearch GmbH, Biberstraße 9, 1010 Wien"
    }
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
  },

  keywords: {
    "adresse": "locations",
    "ort": "locations",
    "wo": "locations",
    "wann": "days",
    "zeit": "days",
    "uhrzeit": "days",
    "essen": ["viva", "figlmueller", "meissl", "pizza"],
    "restaurant": ["viva", "figlmueller", "meissl"],
    "parken": ["parking", "openresearch"],
    "parkplatz": ["parking", "openresearch"],
    "garage": ["parking", "openresearch"],
    "georg-coch": "parking",
    "georg coch": "parking",
    "workshop parken": ["parking", "openresearch"],
    "office parken": ["parking", "openresearch"],
    "reservierung": "reservations",
    "code": "reservations",
    "preis": "reservations",
    "topgolf": "topgolf_info",
    "golf": "topgolf_info",
    "transport": "transport",
    "auto": "transport",
    "workshop": "openresearch",
    "marcus": "contact",
    "ansprechpartner": "contact",
    "kontakt": "contact",
    "telefon": "contact",
    "handy": "contact",
    "notfall": "emergency",
    "hilfe": "emergency",
    "flughafen": "travel",
    "anreise": "travel",
    "s7": "travel",
    "cat": "travel",
    "öffis": "wien_tips",
    "u-bahn": "wien_tips",
    "ticket": "wien_tips",
    "wienmobil": "wien_tips",
    "einkaufen": "wien_tips",
    "supermarkt": "wien_tips",
    "spar": "wien_tips",
    "billa": "wien_tips",
    "apotheke": "wien_tips",
    "kaffee": "wien_tips",
    "café": "wien_tips",
    "checkin": "workshop_details",
    "anmeldung": "workshop_details",
    "wlan": "workshop_details",
    "wifi": "workshop_details",
    "passwort": "workshop_details",
    "technik": "workshop_details",
    "wetter": "weather_backup",
    "regen": "weather_backup",
    "kleidung": "weather_backup",
    "anziehen": "weather_backup",
    "kosten": ["reservations", "costs_and_payments"],
    "bezahlen": "costs_and_payments",
    "trinkgeld": "costs_and_payments",
    "sightseeing": "wien_tips",
    "sehenswürdigkeiten": "wien_tips",
    "stephansdom": "wien_tips"
  }
};
