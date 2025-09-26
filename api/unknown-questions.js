import { kv } from '@vercel/kv';

const isRedisAvailable = () => {
  const hasUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  const hasToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
  return hasUrl && hasToken;
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { admin_key } = req.query;

    if (admin_key !== 'workshop2025admin') {
      return res.status(403).json({ error: 'Admin Key ungültig' });
    }

    if (!isRedisAvailable()) {
      return res.status(200).json({
        questions: [],
        total: 0,
        message: 'Redis not available'
      });
    }

    try {
      const unknownQuestions = await kv.get('unknown-questions') || { questions: [] };

      const sortedQuestions = unknownQuestions.questions.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      return res.status(200).json({
        questions: sortedQuestions,
        total: sortedQuestions.length,
        unresolved: sortedQuestions.filter(q => !q.resolved).length,
        byType: {
          unknown: sortedQuestions.filter(q => q.type === 'unknown').length,
          uncertain: sortedQuestions.filter(q => q.type === 'uncertain').length,
          offTopic: sortedQuestions.filter(q => q.type === 'off-topic').length
        },
        highPriority: sortedQuestions.filter(q => !q.resolved && q.priority === 'high').length
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { admin_key, questionId, action } = req.body;

    if (admin_key !== 'workshop2025admin') {
      return res.status(403).json({ error: 'Admin Key ungültig' });
    }

    if (!isRedisAvailable()) {
      return res.status(500).json({ error: 'Redis not available' });
    }

    try {
      const unknownQuestions = await kv.get('unknown-questions') || { questions: [] };

      if (action === 'resolve') {
        const question = unknownQuestions.questions.find(q => q.id === questionId);
        if (question) {
          question.resolved = true;
          question.resolvedAt = new Date().toISOString();
        }
      } else if (action === 'delete') {
        unknownQuestions.questions = unknownQuestions.questions.filter(q => q.id !== questionId);
      } else if (action === 'clear_resolved') {
        unknownQuestions.questions = unknownQuestions.questions.filter(q => !q.resolved);
      }

      await kv.set('unknown-questions', unknownQuestions);

      return res.status(200).json({
        success: true,
        message: `Question ${action}d successfully`
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
