import { kv } from '@vercel/kv';

const isRedisAvailable = () => {
  const hasUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  const hasToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
  return Boolean(hasUrl && hasToken);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    await sendCurrentActivity(res);

    const interval = setInterval(async () => {
      await sendCurrentActivity(res);
    }, 2000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      res.end();
    }, 300000);

    req.on('close', () => {
      clearInterval(interval);
      clearTimeout(timeout);
    });

    return;
  }

  try {
    const activityData = await getCurrentActivity();
    res.status(200).json(activityData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getCurrentActivity() {
  if (!isRedisAvailable()) {
    return {
      isProcessing: false,
      recentActivities: [],
      stats: { totalRequests: 0, activeRequests: 0, avgResponseTime: 0 }
    };
  }

  try {
    const activities = await kv.get('alex-activities') || { events: [] };
    const events = activities.events || [];
    const now = Date.now();

    const activeRequests = events.filter(event =>
      event.type === 'request_start' &&
      !events.find(endEvent => endEvent.type === 'request_end' && endEvent.data.sessionId === event.data.sessionId) &&
      now - new Date(event.timestamp).getTime() < 30000
    );

    const completedRequests = events.filter(event => event.type === 'request_end');
    const avgResponseTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, event) => sum + (event.data.processingTime || 0), 0) / completedRequests.length
      : 0;

    const recentActivities = events.slice(0, 10).map(event => ({
      type: event.type,
      timestamp: event.timestamp,
      message: event.data.message ? `${event.data.message.substring(0, 100)}${event.data.message.length > 100 ? '...' : ''}` : '',
      responseTime: event.data.processingTime || null,
      success: event.data.success
    }));

    return {
      isProcessing: activeRequests.length > 0,
      activeRequests: activeRequests.length,
      recentActivities,
      stats: {
        totalRequests: events.filter(event => event.type === 'request_start').length,
        completedRequests: completedRequests.length,
        errorRequests: events.filter(event => event.type === 'request_error').length,
        avgResponseTime: Math.round(avgResponseTime),
        uptime: new Date().toISOString()
      },
      lastActivity: events[0]?.timestamp || null
    };
  } catch (error) {
    throw new Error('Activity fetch failed: ' + error.message);
  }
}

async function sendCurrentActivity(res) {
  try {
    const data = await getCurrentActivity();
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  }
}
