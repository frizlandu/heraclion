// scripts/testFix.js
const fs = require('fs');
const path = require('path');

function getRelativeImport(filePath) {
  const depth = filePath.split(path.sep).length - 2;
  return '../'.repeat(depth) + 'utils/testHelpers';
}

function fixTestFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Ajout testHelpers si utilisé mais non importé
  if (content.includes('testHelpers') && !content.includes('require') && !content.includes('import')) {
    const importLine = `const testHelpers = require('${getRelativeImport(filePath)}');\n`;
    content = importLine + content;
    modified = true;
  }

  // Ajout afterAll() si manquant
  if (!content.includes('afterAll') && content.includes('global.server')) {
    const afterAllBlock = `\n\nafterAll(async () => {\n  if (global.server && typeof global.server.close === 'function') {\n    await new Promise((resolve) => global.server.close(resolve));\n  }\n});\n`;
    content += afterAllBlock;
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Corrigé : ${filePath}`);
  }
}

function fixRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  if (!content.includes('express.Router')) {
    const routerLine = `const express = require('express');\nconst router = express.Router();\n`;
    content = routerLine + content;
    modified = true;
  }

  if (!content.includes('module.exports = router')) {
    content = content.replace(/module\.exports\s*=\s*[^;]+;/g, 'module.exports = router;');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Corrigé route : ${filePath}`);
  }
}

function walk(dir, handler) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, handler);
    } else if (file.endsWith('.js')) {
      handler(fullPath);
    }
  });
}

// Appliquer aux tests
walk(path.join(__dirname, '..', 'tests'), fixTestFile);

// Appliquer aux routes
walk(path.join(__dirname, '..', 'routes'), fixRouteFile);
