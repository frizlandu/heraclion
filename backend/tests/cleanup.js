// test/cleanup.js

afterAll(async () => {
  // ✅ Fermer le serveur Express si exposé
  if (global.server && typeof global.server.close === 'function') {
    await new Promise((resolve) => global.server.close(resolve));
  }

  // ✅ Fermer le pool PostgreSQL si exposé
  try {
    const db = require('../config/database');
    if (db && typeof db.end === 'function') {
      await db.end();
    }
  } catch (err) {
    // Ignorer si le pool est mocké
  }
});
