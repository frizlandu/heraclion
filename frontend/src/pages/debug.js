import { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://heraclion.onrender.com/api/v1';

export default function DebugPage() {
  const [pingResult, setPingResult] = useState(null);
  const [loginResult, setLoginResult] = useState(null);
  const [meResult, setMeResult] = useState(null);
  const [logoutResult, setLogoutResult] = useState(null);
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [loading, setLoading] = useState(false);

  const email = 'admin@heraclion.fr';
  const password = 'admin123'; // remplace par ton mot de passe de test

  const testPing = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://heraclion.onrender.com/ping');
      setPingResult(res.data);
    } catch (err) {
      setPingResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setLoginResult(res.data);
      const jwt = res.data?.data?.token;
      setToken(jwt);
      decodeToken(jwt);
    } catch (err) {
      setLoginResult({ success: false, error: err.response?.data || err.message });
    } finally {
      setLoading(false);
    }
  };

  const testMe = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeResult(res.data);
    } catch (err) {
      setMeResult({ success: false, error: err.response?.data || err.message });
    } finally {
      setLoading(false);
    }
  };

  const testLogout = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogoutResult(res.data);
    } catch (err) {
      setLogoutResult({ success: false, error: err.response?.data || err.message });
    } finally {
      setLoading(false);
    }
  };

  const decodeToken = (jwt) => {
    try {
      const payload = jwt.split('.')[1];
      const decodedJson = JSON.parse(atob(payload));
      setDecoded(decodedJson);
    } catch (err) {
      setDecoded({ error: 'Token invalide ou non décodable' });
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🧪 Debug Vercel ↔ Render</h1>

      <button onClick={testPing} disabled={loading}>Tester /ping</button>
      {pingResult && <pre>{JSON.stringify(pingResult, null, 2)}</pre>}

      <button onClick={testLogin} disabled={loading}>Tester /login</button>
      {loginResult && <pre>{JSON.stringify(loginResult, null, 2)}</pre>}

      {token && (
        <>
          <h3>🔐 Token JWT</h3>
          <textarea value={token} readOnly rows={4} style={{ width: '100%' }} />
          <button onClick={() => navigator.clipboard.writeText(token)}>📋 Copier le token</button>

          <h3>🧠 Payload décodé</h3>
          <pre>{JSON.stringify(decoded, null, 2)}</pre>
        </>
      )}

      <button onClick={testMe} disabled={loading || !token}>Tester /me</button>
      {meResult && <pre>{JSON.stringify(meResult, null, 2)}</pre>}

      <button onClick={testLogout} disabled={loading || !token}>Tester /logout</button>
      {logoutResult && <pre>{JSON.stringify(logoutResult, null, 2)}</pre>}
    </div>
  );
}
