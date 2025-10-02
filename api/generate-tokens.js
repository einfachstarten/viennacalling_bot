export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { admin_password, count } = req.body;
  
  // Admin Password Check
  if (admin_password !== 'workshop2025admin') {
    return res.status(401).json({ error: 'Falsches Admin-Passwort!' });
  }
  
  if (!count || count < 1 || count > 50) {
    return res.status(400).json({ error: 'Count muss zwischen 1-50 sein' });
  }
  
  const tokens = {};
  const types = ['fact', 'phrase', 'behavior'];
  
  for (let i = 1; i <= count; i++) {
    const id = 'win' + i + '-' + Math.random().toString(36).substring(2, 8);
    tokens[id] = {
      used: false,
      winner: null,
      type: types[Math.floor(Math.random() * types.length)]
    };
  }
  
  const urls = Object.keys(tokens)
    .map(token => `https://viennacalling-bot.vercel.app/token?token=${token}`)
    .join('\n');
  
  // Generate code to copy into tokens.js
  const tokensCode = `// Generierte Tokens - Kopiere das in /api/tokens.js in den tokenStore:
${JSON.stringify(tokens, null, 2)}

// URLs für Demo:
${urls}`;
  
  return res.status(200).json({ 
    success: true,
    count: count,
    tokens_code: tokensCode,
    message: `${count} Tokens generiert`
  });
}
