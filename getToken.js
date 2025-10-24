const https = require('https');

const data = JSON.stringify({
  email: 'admin@heraclion.fr',
  password: 'admin123'
});

const options = {
  hostname: 'heraclion.onrender.com',
  port: 443,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      console.log('Token:', result.data.token);
    } catch (e) {
      console.error('Erreur:', body);
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();