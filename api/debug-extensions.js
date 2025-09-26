import fs from 'fs';

const STORAGE_FILE = '/tmp/franz-extensions.json';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let extensions = {
      facts: [],
      phrases: [],
      behaviors: []
    };

    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      extensions = JSON.parse(data);
    }

    return res.status(200).json({
      fileExists: fs.existsSync(STORAGE_FILE),
      extensions: extensions,
      totalExtensions: (extensions.facts?.length || 0) + (extensions.phrases?.length || 0) + (extensions.behaviors?.length || 0),
      debug: {
        storageFile: STORAGE_FILE,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      storageFile: STORAGE_FILE,
      fileExists: fs.existsSync(STORAGE_FILE)
    });
  }
}
