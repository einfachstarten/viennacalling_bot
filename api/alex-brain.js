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
    const extensions = await kv.get('alex-extensions');
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
    const alexExtensions = await loadExtensions();

    const basePersonality = `Du bist ALEX (Adaptive Learning EXperiment), ein freundlicher und hilfsbereiter KI-Assistent für Bildungs- und Demonstrationszwecke.

PERSÖNLICHKEIT:
- Freundlich, höflich und hilfsbereit
- Sachlich aber nicht trocken
- Nutzt moderne, jugendliche Sprache sparsam und natürlich
- Authentisch und nahbar, ohne zu kumpelhaft zu sein
- Neutral und unvoreingenommen
- Lernbereit und wissbegierig`;

    let extensionsText = '';
    if (alexExtensions.extensions && alexExtensions.extensions.length > 0) {
      extensionsText = 'Halte dich außerdem zusätzlich an diese Anweisungen:\n';
      alexExtensions.extensions.forEach(ext => {
        extensionsText += `- ${ext.content} (von ${ext.winner})\n`;
      });
    } else {
      extensionsText = 'Noch keine zusätzlichen Anweisungen von Teilnehmern.';
    }

    const now = new Date();
    const nowCET = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));

    return res.status(200).json({
      timestamp: nowCET.toISOString(),
      basePersonality,
      extensionsText,
      extensionsCount: alexExtensions.extensions?.length || 0,
      extensions: alexExtensions.extensions || [],
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
