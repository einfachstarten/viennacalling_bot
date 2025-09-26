import { kv } from '@vercel/kv';

const EXTENSIONS_KEY = 'franz-extensions';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const extensions = await kv.get(EXTENSIONS_KEY);
    const extensionsList = extensions?.extensions || [];

    return res.status(200).json({
      fileExists: true, // KV ist immer "da"
      extensions: extensionsList,
      totalExtensions: extensionsList.length,
      debug: {
        storageType: 'Vercel KV',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      storageType: 'Vercel KV'
    });
  }
}
