const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'routes/paie.js',
  'utils/numeroGenerator.js',
  'services/emailService.js',
  'config/database.js',
  'utils/logger.js',
  'models/BaseModel.js'
];

const missing = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, '..', file)));

if (missing.length > 0) {
  console.warn('❌ Fichiers manquants :');
  missing.forEach(file => console.warn(`  - ${file}`));
  console.warn('\nCorrige les chemins ou restaure les fichiers avant de relancer les tests.');
} else {
  console.log('✅ Tous les fichiers critiques sont présents.');
}

// Patch automatique du setInterval dans config/database.js
const dbPath = path.join(__dirname, '..', 'config', 'database.js');
let dbContent = fs.readFileSync(dbPath, 'utf8');

if (dbContent.includes('setInterval') && !dbContent.includes('process.env.NODE_ENV !== \'test\'')) {
  const patched = dbContent.replace(
    /setInterval\(/,
    'if (process.env.NODE_ENV !== \'test\') setInterval('
  );
  fs.writeFileSync(dbPath, patched);
  console.log('🔧 setInterval patché pour éviter les fuites mémoire Jest.');
} else {
  console.log('✅ setInterval déjà protégé ou absent.');
}

console.log('\n🚀 Tu peux maintenant relancer : npm run test');
