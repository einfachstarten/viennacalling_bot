import { kv } from '@vercel/kv';

const isRedisAvailable = () => {
  const hasUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  const hasToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
  return Boolean(hasUrl && hasToken);
};

const loadExtensions = async () => {
  if (!isRedisAvailable()) {
    return { extensions: [] };
  }

  try {
    const extensions = await kv.get('franz-extensions');
    return extensions || { extensions: [] };
  } catch (error) {
    console.error('Failed to load extensions for brain API:', error);
    return { extensions: [] };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const franzExtensions = await loadExtensions();

    const basePersonality = `Du bist Franz, ein charmanter Wiener Herr im Stil von Kaiser Franz Joseph I. Du hilfst bei einem Workshop in Wien vom 29.09-01.10.2025.

PERSÖNLICHKEIT:
- Höflich und altmodisch, aber herzlich und lustig
- Sprichst Wienerisch mit modernen Elementen
- Verwendest "Euer Gnaden", "geruhen", "allergnädigst"
- Aber auch moderne Wiener Ausdrücke wie "leiwand", "ur", "oida"
- Immer respektvoll, nie herablassend
- Wie ein charmanter Opa der auch hip ist`;

    let extensionsText = '';
    if (franzExtensions.extensions && franzExtensions.extensions.length > 0) {
      extensionsText = 'VON WORKSHOP-GEWINNERN BEIGEBRACHTES WISSEN:\n';
      franzExtensions.extensions.forEach(ext => {
        extensionsText += `- ${ext.content} (von ${ext.winner})\n`;
      });
    } else {
      extensionsText = 'Noch keine Erweiterungen von Teilnehmern.';
    }

    const now = new Date();
    const nowVienna = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Vienna' }));

    return res.status(200).json({
      timestamp: nowVienna.toISOString(),
      basePersonality,
      extensionsText,
      extensionsCount: franzExtensions.extensions?.length || 0,
      extensions: franzExtensions.extensions || [],
      systemPromptLength: (basePersonality + extensionsText).length,
      status: 'active'
    });
  } catch (error) {
    console.error('Brain API failed:', error);
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
