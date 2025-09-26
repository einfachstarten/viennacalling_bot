import fs from 'fs';

const STORAGE_FILE = '/tmp/franz-extensions.json';

function loadExtensions() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading extensions:', error);
  }
  return { extensions: [] };
}

function saveExtensions(extensions) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(extensions, null, 2));
    console.log('Extensions saved:', extensions);
  } catch (error) {
    console.error('Error saving extensions:', error);
  }
}

// Token Store ohne Types
let tokenStore = {
  "win1-bjrqke": { used: true, winner: "Mustermann" },
  "win2-a2wyl9": { used: false, winner: null },
  "win3-56f4fy": { used: false, winner: null },
  "win4-cw966v": { used: false, winner: null },
  "win5-4ehpm5": { used: false, winner: null },
  "win6-a4hepf": { used: false, winner: null },
  "win7-3pm5fy": { used: false, winner: null },
  "win8-y8cqag": { used: false, winner: null },
  "win9-jxohj8": { used: false, winner: null },
  "win10-uynio4": { used: false, winner: null }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { token } = req.query;

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
    console.log('=== TOKEN SUBMISSION START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
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

    if (content.length > 150) {
      return res.status(400).json({ error: 'Text zu lang (max 150 Zeichen)' });
    }

    if (winner_name.length > 30) {
      return res.status(400).json({ error: 'Name zu lang (max 30 Zeichen)' });
    }

    console.log('✅ Validation passed');

    // Extensions laden
    let allExtensions = loadExtensions();
    if (!Array.isArray(allExtensions.extensions)) {
      allExtensions.extensions = [];
    }
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
    console.log('✅ Token marked as used');

    // Extension hinzufügen
    allExtensions.extensions.push(entry);
    console.log('✅ Extension added:', entry);
    console.log('🔍 All extensions after adding:', JSON.stringify(allExtensions, null, 2));
    
    // Speichern mit Debug
    console.log('💾 Saving to:', STORAGE_FILE);
    try {
      const dataToSave = JSON.stringify(allExtensions, null, 2);
      console.log('💾 Data to save:', dataToSave);
      
      fs.writeFileSync(STORAGE_FILE, dataToSave);
      console.log('✅ Save completed');
      
      // Verification
      if (fs.existsSync(STORAGE_FILE)) {
        const verification = fs.readFileSync(STORAGE_FILE, 'utf8');
        console.log('🔍 File content after save:', verification);
      } else {
        console.log('❌ File does not exist after save!');
      }
      
    } catch (error) {
      console.error('❌ Save error:', error);
    }

    console.log('=== TOKEN SUBMISSION END ===');

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
      const status = Object.entries(tokenStore).map(([token, data]) => ({
        token: `${token.substring(0, 8)}...`,
        used: data.used,
        winner: data.winner
      }));
      return res.status(200).json({
        tokens: status,
        extensions: loadExtensions()
      });
    }
    return res.status(403).json({ error: 'Admin Key ungültig' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
