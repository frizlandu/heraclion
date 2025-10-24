const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'scan-report.json');
const targetDir = path.join(__dirname, '..', 'frontend', 'public');
const target = path.join(targetDir, 'scan-report.json');

// Vérifie que le fichier source existe
if (!fs.existsSync(source)) {
  console.warn('⚠️ Fichier source introuvable : scan-report.json non généré.');
  process.exit(1);
}

// Vérifie que le dossier cible existe, sinon le crée
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('📁 Dossier public/ créé dans frontend.');
}

// Copie le fichier
try {
  fs.copyFileSync(source, target);
  console.log('✅ scan-report.json copié vers frontend/public/');
} catch (err) {
  console.error('❌ Erreur lors de la copie :', err.message);
  process.exit(1);
}
