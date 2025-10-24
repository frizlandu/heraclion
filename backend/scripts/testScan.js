// scripts/testScan.js
const fs = require('fs');
const path = require('path');

const scanDirs = ['tests', 'routes', 'controllers'];
const report = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  if (filePath.includes('.test.js')) {
    if (!content.includes('testHelpers')) {
      issues.push('❌ testHelpers non importé');
    }
    if (!content.includes('afterAll') || !content.includes('server.close')) {
      issues.push('⚠️ afterAll() ne ferme pas le serveur');
    }
  }

  if (filePath.includes('routes')) {
    if (!content.includes('express.Router')) {
      issues.push('❌ Router non utilisé');
    }
    if (!content.includes('module.exports = router')) {
      issues.push('❌ Mauvais export (pas de router)');
    }
  }

  if (issues.length > 0) {
    report.push({ file: filePath, issues });
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.js')) {
      scanFile(fullPath);
    }
  });
}

scanDirs.forEach(dir => {
  if (fs.existsSync(dir)) walk(dir);
});

fs.writeFileSync('scan-report.json', JSON.stringify(report, null, 2));

console.log('📦 Rapport de scan :');
report.forEach(({ file, issues }) => {
  console.log(`\n📁 ${file}`);
  issues.forEach(issue => console.log(`   ${issue}`));
});
