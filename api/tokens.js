import fs from 'fs';

const STORAGE_FILE = '/tmp/franz-extensions.json';

function loadExtensions() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return {
        facts: Array.isArray(parsed.facts) ? parsed.facts : [],
        phrases: Array.isArray(parsed.phrases) ? parsed.phrases : [],
        behaviors: Array.isArray(parsed.behaviors) ? parsed.behaviors : []
      };
    }
  } catch (error) {
    console.error('Error loading extensions:', error);
  }

  return {
    facts: [],
    phrases: [],
    behaviors: []
  };
}

function saveExtensions(extensions) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(extensions, null, 2));
    console.log('Extensions saved:', extensions);
  } catch (error) {
    console.error('Error saving extensions:', error);
  }
}

// In-Memory Token Store (reset bei Deployment)
let tokenStore = {
  "win1-bjrqke": {
    "used": false,
    "winner": null,
    "type": "phrase"
  },
  "win2-a2wyl9": {
    "used": false,
    "winner": null,
    "type": "behavior"
  },
  "win3-56f4fy": {
    "used": false,
    "winner": null,
    "type": "phrase"
  },
  "win4-cw966v": {
    "used": false,
    "winner": null,
    "type": "behavior"
  },
  "win5-4ehpm5": {
    "used": false,
    "winner": null,
    "type": "behavior"
  },
  "win6-a4hepf": {
    "used": false,
    "winner": null,
    "type": "behavior"
  },
  "win7-3pm5fy": {
    "used": false,
    "winner": null,
    "type": "phrase"
  },
  "win8-y8cqag": {
    "used": false,
    "winner": null,
    "type": "fact"
  },
  "win9-jxohj8": {
    "used": false,
    "winner": null,
    "type": "behavior"
  },
  "win10-uynio4": {
    "used": false,
    "winner": null,
    "type": "phrase"
  }
};

let franzExtensions = loadExtensions();

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

    const typeKey = `${type}s`;

    if (!franzExtensions[typeKey]) {
      franzExtensions[typeKey] = [];
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

    franzExtensions[typeKey].push(entry);

    saveExtensions(franzExtensions);

    console.log('Franz Extensions after adding:', franzExtensions);

    return res.status(200).json({
      success: true,
      message: `Franz wurde erfolgreich um ${type} erweitert!`,
      winner: winner_name,
      debug: franzExtensions
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
      return res.status(200).json({
        tokens: status,
        extensions: franzExtensions
      });
    }

    return res.status(403).json({ error: 'Admin Key ungültig' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export { franzExtensions, tokenStore };
