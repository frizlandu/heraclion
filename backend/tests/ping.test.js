const http = require('http');

http.get('http://localhost:3000/ping', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if (json.success === true) {
      console.log('✅ /ping opérationnel');
      process.exit(0);
    } else {
      console.error('❌ /ping échoue');
      process.exit(1);
    }
  });
}).on('error', err => {
  console.error('❌ Erreur de connexion à /ping');
  process.exit(1);
});
