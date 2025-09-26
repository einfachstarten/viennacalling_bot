// In-Memory Token Store (reset bei Deployment)
let tokenStore = {
  'win1-abc123': { used: false, winner: null, type: 'fact' },
  'win2-def456': { used: false, winner: null, type: 'phrase' },
  'win3-ghi789': { used: false, winner: null, type: 'behavior' },
  'win4-jkl012': { used: false, winner: null, type: 'fact' },
  'win5-mno345': { used: false, winner: null, type: 'phrase' },
  // ... mehr Tokens nach Bedarf
};

let franzExtensions = {
  facts: [],
  phrases: [],
  behaviors: []
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Token-Status prüfen
    const { token } = req.query;

    if (!token || !tokenStore[token]) {
      return res.status(404).json({ error: 'Token nicht gefunden' });
    }

    if (tokenStore[token].used) {
      return res.status(410).json({ error: 'Token bereits verwendet' });
    }

    return res.status(200).json({
      valid: true,
      type: tokenStore[token].type,
      message: 'Token ist gültig!'
    });
  }

  if (req.method === 'POST') {
    // Token einlösen
    const { token, content, winner_name } = req.body;

    if (!token || !content || !winner_name) {
      return res.status(400).json({ error: 'Token, Content und Name erforderlich' });
    }

    if (!tokenStore[token]) {
      return res.status(404).json({ error: 'Token nicht gefunden' });
    }

    if (tokenStore[token].used) {
      return res.status(410).json({ error: 'Token bereits verwendet' });
    }

    // Content validieren
    if (content.length > 150) {
      return res.status(400).json({ error: 'Text zu lang (max 150 Zeichen)' });
    }

    if (winner_name.length > 30) {
      return res.status(400).json({ error: 'Name zu lang (max 30 Zeichen)' });
    }

    // Verbotene Wörter (optional)
    const badWords = ['hack', 'delete', 'admin', 'password'];
    if (badWords.some(word => content.toLowerCase().includes(word))) {
      return res.status(400).json({ error: 'Unerlaubter Inhalt' });
    }

    const type = tokenStore[token].type;

    if (!['fact', 'phrase', 'behavior'].includes(type)) {
      return res.status(400).json({ error: 'Ungültiger Tokentyp' });
    }

    if (!franzExtensions[type]) {
      franzExtensions[type] = [];
    }

    const timestamp = new Date().toISOString();

    // Token als verwendet markieren
    tokenStore[token].used = true;
    tokenStore[token].winner = winner_name;
    tokenStore[token].content = content;
    tokenStore[token].timestamp = timestamp;

    // Zu Franz hinzufügen
    const entry = {
      content,
      winner: winner_name,
      timestamp,
      token
    };

    franzExtensions[type].push(entry);

    return res.status(200).json({
      success: true,
      message: `Franz wurde erfolgreich um ${type} erweitert!`,
      winner: winner_name
    });
  }

  // Admin endpoint für Token-Status
  if (req.method === 'DELETE') {
    const { admin_key } = req.body || {};
    if (admin_key === 'workshop2025admin') {
      // Token-Status für Admin
      const status = Object.entries(tokenStore).map(([token, data]) => ({
        token: `${token.substring(0, 8)}...`,
        used: data.used,
        winner: data.winner,
        type: data.type
      }));
      return res.status(200).json({ tokens: status });
    }

    return res.status(403).json({ error: 'Admin Key ungültig' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export { franzExtensions, tokenStore };
