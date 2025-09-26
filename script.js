const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('userInput');

function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage(text, false);
  inputEl.value = '';
  inputEl.focus();

  const response = processUserMessage(text);
  addMessage(response, true);
}

function addMessage(text, isBot = false) {
  const bubble = document.createElement('div');
  bubble.classList.add('message', isBot ? 'bot-message' : 'user-message');

  if (isBot) {
    bubble.innerHTML = text;
  } else {
    bubble.textContent = text;
  }

  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function processUserMessage(rawText) {
  const normalized = normalizeText(rawText);
  const answer = searchWorkshopData(normalized);

  if (answer && answer.trim().length > 0) {
    return answer;
  }

  const fallbacks = [
    'Hm, das habe ich leider nicht ganz verstanden. Frag mich gerne nach Zeiten, Orten oder Reservierungen! 😊',
    'Ich bin mir nicht sicher, was du meinst. Probier es mit Stichworten wie "Montag", "Topgolf" oder "Parken".',
    'Nochmals bitte? Ich kann dir bei Zeitplänen, Adressen, Reservierungscodes und Transport helfen.'
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function searchWorkshopData(normalizedQuery) {
  const responses = [];
  const matchedTargets = new Set();
  const aliasHits = new Set();

  for (const [keyword, target] of Object.entries(workshopData.keywords)) {
    if (normalizedQuery.includes(keyword)) {
      if (Array.isArray(target)) {
        target.forEach((item) => matchedTargets.add(item));
      } else {
        matchedTargets.add(target);
      }
    }
  }

  const aliasMap = {
    'open research': 'openresearch',
    'openresearch office': 'openresearch',
    'or office': 'openresearch',
    'viva la mamma': 'viva',
    'figlmuller': 'figlmueller',
    'figlmueller': 'figlmueller',
    'meissl und schadn': 'meissl',
    'meissl schadn': 'meissl',
    'das schinakl': 'schinakl',
    'schinakl': 'schinakl',
    'meine insel': 'insel',
    'insel': 'insel',
    'top golf': 'topgolf'
  };

  for (const [alias, target] of Object.entries(aliasMap)) {
    if (normalizedQuery.includes(alias)) {
      matchedTargets.add(target);
      aliasHits.add(target);
    }
  }

  const dayKey = detectDay(normalizedQuery);

  if (matchedTargets.has('days') || dayKey) {
    const dayResponse = buildDayResponse(dayKey, normalizedQuery);
    if (dayResponse) {
      responses.push(dayResponse);
    }
  }

  const locationKeys = collectLocationKeys(matchedTargets, normalizedQuery, aliasHits);
  locationKeys.forEach((key) => {
    const message = buildLocationResponse(key);
    if (message) responses.push(message);
  });

  if (locationKeys.length === 0 && matchedTargets.has('locations')) {
    const overview = buildLocationOverview();
    if (overview) responses.push(overview);
  }

  const reservationKeys = collectReservationKeys(matchedTargets, normalizedQuery, aliasHits);
  reservationKeys.forEach((key) => {
    const message = buildReservationResponse(key);
    if (message) responses.push(message);
  });

  if (reservationKeys.length === 0 && matchedTargets.has('reservations')) {
    const overview = buildReservationOverview();
    if (overview) responses.push(overview);
  }

  if (matchedTargets.has('parking') || normalizedQuery.includes('park')) {
    const parkingResponse = buildParkingResponse(normalizedQuery);
    if (parkingResponse) responses.push(parkingResponse);
  }

  if (matchedTargets.has('transport')) {
    responses.push(buildTransportResponse());
  }

  if (matchedTargets.has('topgolf_info') || normalizedQuery.includes('topgolf')) {
    responses.push(buildTopgolfResponse(normalizedQuery));
  }

  if (responses.length === 0 && dayKey) {
    const fallbackDay = buildDayResponse(dayKey, normalizedQuery, true);
    if (fallbackDay) responses.push(fallbackDay);
  }

  return responses.join('<br><br>');
}

function detectDay(normalizedQuery) {
  const dayEntries = Object.keys(workshopData.days);
  return dayEntries.find((day) => normalizedQuery.includes(day)) || null;
}

function buildDayResponse(dayKey, normalizedQuery, allowFullOverview = false) {
  if (!dayKey && !allowFullOverview) {
    return buildFullScheduleOverview();
  }

  if (dayKey) {
    const day = workshopData.days[dayKey];
    if (!day) return null;

  const focusWords = ['fruhstuck', 'mittag', 'essen', 'workshop', 'abfahrt', 'topgolf', 'pizza', 'ende', 'start'];
    const matchesWord = (text) => focusWords.some((word) => text.includes(word));

    const requestedSpecifics = focusWords.filter((word) => normalizedQuery.includes(word));

    const filteredSchedule = day.schedule.filter((item) => {
      if (requestedSpecifics.length === 0) return true;
      const itemText = normalizeText(
        [item.time, item.activity, item.location || '', item.note || ''].join(' ')
      );
      return requestedSpecifics.some((word) => itemText.includes(word));
    });

    const scheduleToShow = filteredSchedule.length > 0 ? filteredSchedule : day.schedule;

    const lines = scheduleToShow.map((item) => {
      const parts = [`<strong>${item.time}</strong> – ${item.activity}`];
      if (item.location) parts.push(item.location);
      if (item.note) parts.push(item.note);
      if (item.maps) parts.push(`<a href="${item.maps}" target="_blank" rel="noopener">Maps-Link</a>`);
      return parts.join('<br>');
    });

    return `📅 <strong>${capitalize(dayKey)} (${day.date})</strong><br>${lines.join('<br><br>')}`;
  }

  return buildFullScheduleOverview();
}

function buildFullScheduleOverview() {
  const snippets = Object.entries(workshopData.days).map(([dayKey, day]) => {
    const highlight = day.schedule.find((item) => normalizeText(item.activity).includes('workshop')) || day.schedule[0];
    const mainText = highlight ? `${highlight.time} – ${highlight.activity}` : '';
    return `<strong>${capitalize(dayKey)} (${day.date})</strong>: ${mainText}`;
  });

  return `Hier ist der Überblick über alle Workshop-Tage:<br>${snippets.join('<br>')}`;
}

function collectLocationKeys(matchedTargets, normalizedQuery, aliasHits) {
  const locationKeys = new Set();
  const trustedTargets = new Set(['openresearch']);

  Object.keys(workshopData.locations).forEach((key) => {
    if (normalizedQuery.includes(key)) {
      locationKeys.add(key);
    }
  });

  matchedTargets.forEach((target) => {
    if (workshopData.locations[target]) {
      if (trustedTargets.has(target) || normalizedQuery.includes(target) || aliasHits.has(target)) {
        locationKeys.add(target);
      }
    }
  });

  if (matchedTargets.has('openresearch')) {
    locationKeys.add('openresearch');
  }

  return Array.from(locationKeys);
}

function buildLocationResponse(locationKey) {
  const location = workshopData.locations[locationKey];
  if (!location) return null;

  const lines = [
    `📍 <strong>${location.name}</strong>`,
    location.address
  ];

  if (location.note) lines.push(location.note);
  if (location.maps) lines.push(`<a href="${location.maps}" target="_blank" rel="noopener">Maps-Link öffnen</a>`);

  return lines.join('<br>');
}

function buildLocationOverview() {
  const entries = Object.values(workshopData.locations);
  if (!entries || entries.length === 0) return null;

  const lines = entries.map((location) => `• <strong>${location.name}</strong> – ${location.address}`);
  return `Hier sind die wichtigsten Orte:<br>${lines.join('<br>')}`;
}

function collectReservationKeys(matchedTargets, normalizedQuery, aliasHits) {
  const reservationKeys = new Set();

  Object.keys(workshopData.reservations).forEach((key) => {
    if (normalizedQuery.includes(key)) {
      reservationKeys.add(key);
    }
  });

  matchedTargets.forEach((target) => {
    if (workshopData.reservations[target]) {
      if (normalizedQuery.includes(target) || aliasHits.has(target)) {
        reservationKeys.add(target);
      }
    }
  });

  if (normalizedQuery.includes('pizza') || normalizedQuery.includes('insel')) {
    reservationKeys.add('insel');
  }

  if (normalizedQuery.includes('topgolf')) {
    reservationKeys.add('topgolf');
  }

  return Array.from(reservationKeys);
}

function buildReservationResponse(reservationKey) {
  const reservation = workshopData.reservations[reservationKey];
  if (!reservation) return null;

  const lines = [
    `🗓️ <strong>${reservation.name}</strong>`,
    `Zeit: ${reservation.time}`
  ];

  if (reservation.code) lines.push(`Code: <strong>${reservation.code}</strong>`);
  if (reservation.guests) lines.push(`Für ${reservation.guests} Personen`);
  if (reservation.bays) lines.push(`Bays: ${reservation.bays}`);
  if (reservation.cost) lines.push(`Kosten: ${reservation.cost}`);
  if (reservation.bill) lines.push(`Rechnung an: ${reservation.bill}`);
  if (reservation.note) lines.push(reservation.note);

  return lines.join('<br>');
}

function buildReservationOverview() {
  const entries = Object.values(workshopData.reservations);
  if (!entries || entries.length === 0) return null;

  const lines = entries.map((reservation) => {
    const pieces = [`• <strong>${reservation.name}</strong>`];
    if (reservation.time) pieces.push(reservation.time);
    if (reservation.code) pieces.push(`Code: ${reservation.code}`);
    return pieces.join(' – ');
  });

  return `Reservierungen im Überblick:<br>${lines.join('<br>')}`;
}

function buildParkingResponse(normalizedQuery) {
  if (!workshopData.parking) return null;

  let parkingKey = 'insel';
  if (normalizedQuery.includes('topgolf')) {
    parkingKey = 'topgolf';
  }

  const parkingSpots = workshopData.parking[parkingKey];
  if (!parkingSpots || parkingSpots.length === 0) {
    return '🅿️ Aktuell sind keine Parkhinweise hinterlegt. Frag gerne nochmals bei den Hosts nach!';
  }

  const lines = parkingSpots.map((spot) => {
    const parts = [];
    if (spot.address) parts.push(spot.address);
    if (spot.maps) parts.push(`<a href="${spot.maps}" target="_blank" rel="noopener">Maps</a>`);
    return `• ${parts.join(' – ')}`;
  });

  return `🅿️ Parken für ${capitalize(parkingKey)}:<br>${lines.join('<br>')}`;
}

function buildTransportResponse() {
  const transport = workshopData.transport;
  if (!transport) return null;

  const lines = [`🚗 <strong>Transport</strong>`, transport.general];
  if (transport.monday) lines.push(`Montag: ${transport.monday}`);
  if (transport.tuesday) lines.push(`Dienstag: ${transport.tuesday}`);

  return lines.join('<br>');
}

function buildTopgolfResponse(normalizedQuery) {
  const info = workshopData.topgolf_info;
  if (!info) return null;

  const lines = [`⛳ <strong>Topgolf Facts</strong>`];
  if (info.rules) lines.push(`Regeln: ${info.rules}`);
  if (info.features) lines.push(`Location: ${info.features}`);
  if (info.food) lines.push(`Snacks: ${info.food}`);
  if (info.payment) lines.push(`Zahlung: ${info.payment}`);
  if (info.membership) lines.push(`Membership: ${info.membership}`);
  if (info.video) lines.push(`<a href="${info.video}" target="_blank" rel="noopener">Video ansehen</a>`);

  if (!normalizedQuery.includes('reserv') && !normalizedQuery.includes('code')) {
    const reservation = workshopData.reservations.topgolf;
    if (reservation) {
      lines.push('<br>Reservierungsdetails:');
      lines.push(buildReservationResponse('topgolf'));
    }
  }

  return lines.join('<br>');
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Focus input on load for quicker typing
if (inputEl) {
  inputEl.focus();
}
