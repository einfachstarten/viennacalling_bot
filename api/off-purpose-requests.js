import { kv } from '@vercel/kv';

const isRedisAvailable = () => {
  const hasUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  const hasToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
  return hasUrl && hasToken;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { admin_key } = req.query;

  if (admin_key !== 'workshop2025admin') {
    return res.status(403).json({ error: 'Admin Key ungültig' });
  }

  if (!isRedisAvailable()) {
    return res.status(200).json({
      requests: [],
      total: 0,
      message: 'Redis not available'
    });
  }

  try {
    const offPurposeLog = (await kv.get('off-purpose-requests')) || { requests: [] };
    const requests = Array.isArray(offPurposeLog.requests) ? offPurposeLog.requests : [];

    const sortedRequests = [...requests].sort((a, b) =>
      new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );

    const byCategory = sortedRequests.reduce((acc, request) => {
      const category = request.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      requests: sortedRequests,
      total: sortedRequests.length,
      byCategory
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
