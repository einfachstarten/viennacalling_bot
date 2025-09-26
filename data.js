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

  keywords: {
    "adresse": "locations",
    "ort": "locations", 
    "wo": "locations",
    "wann": "days",
    "zeit": "days",
    "uhrzeit": "days",
    "essen": ["viva", "figlmueller", "meissl", "pizza"],
    "restaurant": ["viva", "figlmueller", "meissl"],
    "parken": "parking",
    "parkplatz": "parking",
    "reservierung": "reservations",
    "code": "reservations",
    "kosten": "reservations",
    "preis": "reservations",
    "topgolf": "topgolf_info",
    "golf": "topgolf_info",
    "transport": "transport",
    "auto": "transport",
    "workshop": "openresearch"
  }
};
