import { kv } from '@vercel/kv';

// KV Storage Keys
const EXTENSIONS_KEY = 'franz-extensions';
const TOKEN_STORE_KEY = 'token-store';

// Initial Token Store (wird in KV gespeichert)
const defaultTokenStore = {
  "win1-bjrqke": { used: true, winner: "Mustermann" },
  "win2-a2wyl9": { used: true, winner: "Musterfrau" },
  "win3-56f4fy": { used: false, winner: null },
  "win4-cw966v": { used: false, winner: null },
  "win5-4ehpm5": { used: false, winner: null },
  "win6-a4hepf": { used: false, winner: null },
  "win7-3pm5fy": { used: false, winner: null },
  "win8-y8cqag": { used: false, winner: null },
  "win9-jxohj8": { used: false, winner: null },
  "win10-uynio4": { used: false, winner: null }
};

async function loadExtensions() {
  try {
    const extensions = await kv.get(EXTENSIONS_KEY);
    return extensions || { extensions: [] };
  } catch (error) {
    console.error('Error loading extensions from KV:', error);
    return { extensions: [] };
  }
}

async function saveExtensions(extensions) {
  try {
    await kv.set(EXTENSIONS_KEY, extensions);
    console.log('Extensions saved to KV:', extensions);
  } catch (error) {
    console.error('Error saving extensions to KV:', error);
  }
}

async function loadTokenStore() {
  try {
    const tokenStore = await kv.get(TOKEN_STORE_KEY);
    return tokenStore || defaultTokenStore;
  } catch (error) {
    console.error('Error loading token store from KV:', error);
    return defaultTokenStore;
  }
}

async function saveTokenStore(tokenStore) {
  try {
    await kv.set(TOKEN_STORE_KEY, tokenStore);
    console.log('Token store saved to KV');
  } catch (error) {
    console.error('Error saving token store to KV:', error);
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { token } = req.query;

    const tokenStore = await loadTokenStore();

    if (!token || !tokenStore[token]) {
      return res.status(404).json({ error: 'Token nicht gefunden' });
    }

    if (tokenStore[token].used) {
      return res.status(410).json({ error: 'Token bereits verwendet' });
    }

    return res.status(200).json({
      valid: true,
      message: 'Token ist gültig!'
    });
  }

  if (req.method === 'POST') {
    console.log('=== TOKEN SUBMISSION START (KV) ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { token, content, winner_name } = req.body;

    if (!token || !content || !winner_name) {
      return res.status(400).json({ error: 'Token, Content und Name erforderlich' });
    }

    if (content.length > 150) {
      return res.status(400).json({ error: 'Text zu lang (max 150 Zeichen)' });
    }

    if (winner_name.length > 30) {
      return res.status(400).json({ error: 'Name zu lang (max 30 Zeichen)' });
    }

    // Token Store laden
    const tokenStore = await loadTokenStore();

    if (!tokenStore[token]) {
      return res.status(404).json({ error: 'Token nicht gefunden' });
    }

    if (tokenStore[token].used) {
      return res.status(410).json({ error: 'Token bereits verwendet' });
    }

    console.log('✅ Validation passed');

    // Extensions laden
    const allExtensions = await loadExtensions();
    if (!Array.isArray(allExtensions.extensions)) {
      allExtensions.extensions = [];
    }
    console.log('🔍 Current extensions from KV:', JSON.stringify(allExtensions, null, 2));

    const entry = {
      content,
      winner: winner_name,
      timestamp: new Date().toISOString(),
      token
    };

    // Token markieren
    tokenStore[token].used = true;
    tokenStore[token].winner = winner_name;
    await saveTokenStore(tokenStore);
    console.log('✅ Token marked as used in KV');

    // Extension hinzufügen
    allExtensions.extensions.push(entry);
    console.log('✅ Extension added:', entry);
    console.log('🔍 All extensions after adding:', JSON.stringify(allExtensions, null, 2));

    // In KV speichern
    console.log('💾 Saving to KV...');
    await saveExtensions(allExtensions);
    console.log('✅ Save to KV completed');

    // Verification
    const verification = await loadExtensions();
    console.log('🔍 KV content after save:', JSON.stringify(verification, null, 2));

    console.log('=== TOKEN SUBMISSION END (KV) ===');

    return res.status(200).json({
      success: true,
      message: 'Franz hat neues Wissen gelernt!',
      winner: winner_name,
      debug: allExtensions
    });
  }

  // Admin endpoint
  if (req.method === 'DELETE') {
    const { admin_key } = req.body || {};
    if (admin_key === 'workshop2025admin') {
      const tokenStore = await loadTokenStore();
      const extensions = await loadExtensions();

      const status = Object.entries(tokenStore).map(([token, data]) => ({
        token: `${token.substring(0, 8)}...`,
        used: data.used,
        winner: data.winner
      }));

      return res.status(200).json({
        tokens: status,
        extensions: extensions
      });
    }
    return res.status(403).json({ error: 'Admin Key ungültig' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
