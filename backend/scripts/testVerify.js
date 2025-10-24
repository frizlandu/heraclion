// scripts/testVerify.js
const fs = require('fs');
const path = require('path');

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const usesHelpers = content.includes('testHelpers');
  const hasGlobal = content.includes('global.testHelpers');
  const hasImport = content.includes('require') && content.includes('testHelpers');

  if (usesHelpers && !hasGlobal && !hasImport) {
    console.log(`❌ testHelpers utilisé sans import ni injection : ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.test.js')) {
      scanFile(fullPath);
    }
  });
}

walk(path.join(__dirname, '..', 'tests'));
