function generateTokens(count = 10) {
  const tokens = {};
  const types = ['fact', 'phrase', 'behavior'];

  for (let i = 1; i <= count; i++) {
    const id = 'win' + i + '-' + Math.random().toString(36).substr(2, 6);
    tokens[id] = {
      used: false,
      winner: null,
      type: types[Math.floor(Math.random() * types.length)]
    };
  }

  console.log('Kopiere das in /api/tokens.js:');
  console.log(JSON.stringify(tokens, null, 2));
}

generateTokens(15);
