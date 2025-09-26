import { kv } from '@vercel/kv';

// Check if Redis is available
const isRedisAvailable = () => {
  const hasUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  const hasToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
  return hasUrl && hasToken;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Debug Extensions - Redis available:', isRedisAvailable());

  try {
    let extensions = { extensions: [] };

    if (isRedisAvailable()) {
      try {
        extensions = await kv.get('franz-extensions') || { extensions: [] };
        console.log('📦 Loaded from Redis:', extensions);
      } catch (error) {
        console.error('❌ Redis error:', error);
        extensions = { extensions: [] };
      }
    } else {
      console.log('📦 Redis not available, returning empty extensions');
    }

    const extensionsList = extensions.extensions || [];

    return res.status(200).json({
      fileExists: isRedisAvailable(),
      extensions: extensionsList,
      totalExtensions: extensionsList.length,
      debug: {
        storageType: isRedisAvailable() ? 'Redis (Upstash)' : 'Memory/Fallback',
        redisAvailable: isRedisAvailable(),
        hasKV: !!process.env.KV_REST_API_URL,
        hasStorage: !!process.env.STORAGE_REST_API_URL,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      storageType: 'Error',
      redisAvailable: isRedisAvailable()
    });
  }
}
