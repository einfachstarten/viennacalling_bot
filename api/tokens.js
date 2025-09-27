import { kv } from '@vercel/kv';

// Fallback In-Memory Storage für Development
let memoryExtensions = { extensions: [] };
let memoryTokenStore = {
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

// Check if Redis is available
const isRedisAvailable = () => {
  const hasUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  const hasToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
  return hasUrl && hasToken;
};

async function loadExtensions() {
  if (!isRedisAvailable()) {
    console.log('📦 Redis not available, using memory storage for extensions');
    return memoryExtensions;
  }
  
  try {
    const extensions = await kv.get('franz-extensions');
    console.log('📦 Loaded from Redis:', extensions);
    return extensions || { extensions: [] };
  } catch (error) {
    console.error('❌ Redis failed, fallback to memory:', error.message);
    return memoryExtensions;
  }
}

async function saveExtensions(extensions) {
  if (!isRedisAvailable()) {
    console.log('📦 Saving to memory storage');
    memoryExtensions = extensions;
    return;
  }
  
  try {
    await kv.set('franz-extensions', extensions);
    console.log('📦 Saved to Redis:', extensions);
  } catch (error) {
    console.error('❌ Redis save failed, saving to memory:', error.message);
    memoryExtensions = extensions;
  }
}

async function loadTokenStore() {
  if (!isRedisAvailable()) {
    console.log('📦 Using memory storage for tokens');
    return memoryTokenStore;
  }
  
  try {
    const tokenStore = await kv.get('token-store');
    const result = tokenStore || memoryTokenStore;
    console.log('📦 Loaded token store from Redis');
    return result;
  } catch (error) {
    console.error('❌ Redis failed for token store, fallback to memory:', error.message);
    return memoryTokenStore;
  }
}

async function saveTokenStore(tokenStore) {
  if (!isRedisAvailable()) {
    console.log('📦 Saving tokens to memory storage');
    memoryTokenStore = tokenStore;
    return;
  }
  
  try {
    await kv.set('token-store', tokenStore);
    console.log('📦 Token store saved to Redis');
  } catch (error) {
    console.error('❌ Redis save failed for tokens, saving to memory:', error.message);
    memoryTokenStore = tokenStore;
  }
}

export default async function handler(req, res) {
  // Environment Debug Info
  console.log('🔍 Environment Check:', {
    hasKV: !!process.env.KV_REST_API_URL,
    hasStorage: !!process.env.STORAGE_REST_API_URL,
    redisAvailable: isRedisAvailable()
  });

  if (req.method === 'POST' || req.method === 'DELETE') {
    const requiredPassword = process.env.WORKSHOP_PASSWORD || 'frieder2025';
    const body = req.body || {};

    if (req.method === 'DELETE' || body.admin_key) {
      // Admin operations remain protected by admin key validation below
    } else {
      const providedPassword = body.workshopPassword;

      if (!providedPassword || providedPassword !== requiredPassword) {
        return res.status(401).json({
          error: 'Workshop-Passwort erforderlich für Token-Einlösung',
          needsPassword: true
        });
      }
    }
  }

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
    console.log('=== TOKEN SUBMISSION START (Redis) ===');
    const sanitizedBody = { ...(req.body || {}) };
    if (sanitizedBody.workshopPassword) {
      sanitizedBody.workshopPassword = '[REDACTED]';
    }
    console.log('Request body:', JSON.stringify(sanitizedBody, null, 2));
    console.log('🔍 Redis available:', isRedisAvailable());

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
    console.log('🔍 Current extensions:', JSON.stringify(allExtensions, null, 2));
    
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
    console.log('✅ Token marked as used');

    // Extension hinzufügen
    allExtensions.extensions.push(entry);
    console.log('✅ Extension added:', entry);
    console.log('🔍 All extensions after adding:', JSON.stringify(allExtensions, null, 2));
    
    // Speichern
    console.log('💾 Saving extensions...');
    await saveExtensions(allExtensions);
    console.log('✅ Save completed');
    
    // Verification
    const verification = await loadExtensions();
    console.log('🔍 Verification load:', JSON.stringify(verification, null, 2));

    console.log('=== TOKEN SUBMISSION END (Redis) ===');

    return res.status(200).json({
      success: true,
      message: 'Franz hat neues Wissen gelernt!',
      winner: winner_name,
      debug: {
        extensions: allExtensions,
        redisAvailable: isRedisAvailable(),
        storageType: isRedisAvailable() ? 'Redis' : 'Memory'
      }
    });
  }

  // Admin endpoint
  if (req.method === 'DELETE') {
    const { admin_key, action } = req.body || {};

    if (admin_key !== 'workshop2025admin') {
      return res.status(403).json({ error: 'Admin Key ungültig' });
    }

    if (action === 'reset_tokens') {
      console.log('🔄 ADMIN RESET: Resetting all tokens...');

      const tokenStore = await loadTokenStore();

      Object.keys(tokenStore).forEach(token => {
        tokenStore[token].used = false;
        tokenStore[token].winner = null;
      });

      await saveTokenStore(tokenStore);
      console.log('✅ All tokens reset to unused');

      return res.status(200).json({
        success: true,
        message: 'Alle Tokens wurden zurückgesetzt',
        resetTokens: Object.keys(tokenStore).length
      });
    }

    if (action === 'reset_extensions') {
      console.log('🔄 ADMIN RESET: Clearing all extensions...');

      const emptyExtensions = { extensions: [] };
      await saveExtensions(emptyExtensions);
      console.log('✅ All extensions cleared');

      return res.status(200).json({
        success: true,
        message: 'Franz-Wissen wurde zurückgesetzt'
      });
    }

    if (action === 'full_reset') {
      console.log('🔄 ADMIN RESET: Full system reset...');

      const tokenStore = await loadTokenStore();
      Object.keys(tokenStore).forEach(token => {
        tokenStore[token].used = false;
        tokenStore[token].winner = null;
      });
      await saveTokenStore(tokenStore);

      const emptyExtensions = { extensions: [] };
      await saveExtensions(emptyExtensions);

      console.log('✅ Full system reset completed');

      return res.status(200).json({
        success: true,
        message: 'Kompletter Reset durchgeführt',
        resetTokens: Object.keys(tokenStore).length,
        clearedExtensions: true
      });
    }

    const tokenStore = await loadTokenStore();
    const extensions = await loadExtensions();

    const status = Object.entries(tokenStore).map(([token, data]) => ({
      token: token,
      shortToken: `${token.substring(0, 8)}...`,
      used: data.used,
      winner: data.winner,
      url: `https://viennacalling-bot.vercel.app/token?token=${token}`
    }));

    return res.status(200).json({
      tokens: status,
      extensions: extensions,
      totalTokens: Object.keys(tokenStore).length,
      usedTokens: Object.values(tokenStore).filter(t => t.used).length,
      availableTokens: Object.values(tokenStore).filter(t => !t.used).length,
      debug: {
        redisAvailable: isRedisAvailable(),
        storageType: isRedisAvailable() ? 'Redis' : 'Memory'
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
