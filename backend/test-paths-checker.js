const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'tests');
const VALIDATORS = [
  'clientValidators',
  'comptabiliteValidators',
  'documentValidators',
  'entrepriseValidators',
  'stockValidators',
  'userValidators'
];

function scanTestFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanTestFiles(fullPath);
    } else if (file.endsWith('.test.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const uncommented = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
      let found = false;

      for (const validator of VALIDATORS) {
        const regex = new RegExp(`require\\((['"\`]).*${validator}\\1\\)`);
        if (regex.test(uncommented)) {
          console.log(`✅ ${file} → utilise ${validator}`);
          found = true;
        }
      }

      if (!found) {
        console.log(`⚠️  ${file} → aucun validator détecté`);
      }
    }
  });
}

console.log('🔍 Scan cockpitifié des tests validators...\n');
scanTestFiles(TEST_DIR);
