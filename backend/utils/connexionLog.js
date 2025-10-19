const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '../logs/connexion.log');

function logConnexion({ userId, email, ip, success }) {
  const entry = {
    date: new Date().toISOString(),
    userId,
    email,
    ip,
    success
  };
  fs.appendFile(LOG_PATH, JSON.stringify(entry) + '\n', err => {
    if (err) console.error('Erreur log connexion', err);
  });
}

function readConnexionLog(limit = 100) {
  if (!fs.existsSync(LOG_PATH)) return [];
  const lines = fs.readFileSync(LOG_PATH, 'utf-8').trim().split('\n');
  return lines.slice(-limit).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

module.exports = { logConnexion, readConnexionLog };
