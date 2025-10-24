// backend/scripts/migrate-passwords.js
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Renseignez ici vos paramètres de connexion
const client = new Client({
  user: 'heraclion_pauq_user',
  password: 'ZYQxlPyyMyAR39N2VM8RgAoLGRNFi8kV',
  host: 'dpg-d3r239qli9vc73cp5lug-a.pg.render.com',
  database: 'heraclion_pauq',
  port: 5432
});

async function migratePasswords() {
  try {
    await client.connect();
    const res = await client.query('SELECT id, mot_de_passe FROM users WHERE mot_de_passe IS NOT NULL');
    for (const user of res.rows) {
      if (user.mot_de_passe) {
        const hash = await bcrypt.hash(user.mot_de_passe, 10);
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
        console.log(`Utilisateur ${user.id} migré`);
      }
    }
    await client.end();
    console.log('Migration terminée.');
  } catch (err) {
    console.error('Erreur de migration:', err);
    process.exit(1);
  }
}

migratePasswords();