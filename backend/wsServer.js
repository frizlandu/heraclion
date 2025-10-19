// backend/wsServer.js
// Serveur WebSocket pour dashboard temps réel

const WebSocket = require('ws');
let wss;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    console.log('Client WebSocket connecté');
    ws.on('close', () => {
      console.log('Client WebSocket déconnecté');
    });
  });
}

function broadcastDashboardUpdate(data) {
  if (!wss) return;
  const message = JSON.stringify({ type: 'dashboard-update', data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = { initWebSocket, broadcastDashboardUpdate };