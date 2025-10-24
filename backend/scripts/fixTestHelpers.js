// scripts/fixTestHelpers.js
const fs = require('fs');
const path = require('path');

function getRelativeImport(fromPath, toPath) {
  const relative = path.relative(path.dirname(fromPath), toPath);
  return relative.startsWith('.') ? relative : './' + relative;
}

function fixTestHelpersImport(filePath, helpersPath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const usesHelpers = content.includes('testHelpers');
  const alreadyImported = content.includes('require') && content.includes('testHelpers');

  if (usesHelpers && !alreadyImported) {
    const relativePath = getRelativeImport(filePath, helpersPath).replace(/\\/g, '/');
    const importLine = `const testHelpers = require('${relativePath}');\n`;
    content = importLine + content;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Import ajouté : ${filePath}`);
  }
}

function walkAndFix(dir, helpersPath) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkAndFix(fullPath, helpersPath);
    } else if (file.endsWith('.test.js')) {
      fixTestHelpersImport(fullPath, helpersPath);
    }
  });
}

const helpersPath = path.resolve(__dirname, '..', 'utils', 'testHelpers.js');
const testsDir = path.resolve(__dirname, '..', 'tests');

if (!fs.existsSync(helpersPath)) {
  console.error('❌ Fichier utils/testHelpers.js introuvable. Crée-le avant de lancer ce script.');
  process.exit(1);
}

walkAndFix(testsDir, helpersPath);
