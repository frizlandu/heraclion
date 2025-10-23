// vercel-render-check.js
require('dotenv').config();
const axios = require('axios');

const API_URL = 'https://heraclion.onrender.com/api/v1';
const testEmail = 'admin@heraclion.fr';
const testPassword = 'admin123'; // Remplace par ton mot de passe de test
const timeout = 15000;

let jwtToken = null;

const testPing = async () => {
  try {
    const res = await axios.get('https://heraclion.onrender.com/ping', { timeout });
    console.log('✅ /ping OK:', res.data);
  } catch (err) {
    console.error('❌ /ping échoué:', err.message);
  }
};

const testLogin = async () => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    }, { timeout });

    console.log('✅ /login OK:', res.data);
    jwtToken = res.data?.data?.token;
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout sur /login (15s)');
    } else if (err.response) {
      console.error(`❌ /login erreur ${err.response.status}:`, err.response.data);
    } else {
      console.error('❌ /login échoué:', err.message);
    }
  }
};

const testMe = async () => {
  if (!jwtToken) {
    console.warn('⚠️ Token JWT non disponible, test /me ignoré');
    return;
  }

  try {
    const res = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`
      },
      timeout
    });

    console.log('✅ /me OK:', res.data);
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      console.error('⏱️ Timeout sur /me (15s)');
    } else if (err.response) {
      console.error(`❌ /me erreur ${err.response.status}:`, err.response.data);
    } else {
      console.error('❌ /me échoué:', err.message);
    }
  }
};

const runCheck = async () => {
  console.log('🔍 Test Vercel ↔ Render');
  console.log('🌐 Backend:', API_URL);
  await testPing();
  await testLogin();
  await testMe();
};

runCheck();
