// scripts/testReport.js
const fs = require('fs');
const { execSync } = require('child_process');

function run(command, label) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    return { label, output };
  } catch (err) {
    return { label, output: err.stdout || err.message };
  }
}

function parseVerify(output) {
  const lines = output.split('\n').filter(l => l.includes('testHelpers'));
  return lines.map(line => line.trim());
}

function parseScan(output) {
  const lines = output.split('\n').filter(l => l.includes('❌') || l.includes('⚠️'));
  return lines.map(line => line.trim());
}

function parseStatus() {
  try {
    const status = JSON.parse(fs.readFileSync('public/status.json', 'utf-8'));
    return status;
  } catch {
    return { status: 'unknown', logs: 'status.json introuvable' };
  }
}

const scan = run('node scripts/testScan.js', 'scan');
const verify = run('node scripts/testVerify.js', 'verify');
const status = parseStatus();

const report = {
  date: new Date().toISOString(),
  status,
  scanIssues: parseScan(scan.output),
  verifyIssues: parseVerify(verify.output)
};

fs.writeFileSync('scan-report.json', JSON.stringify(report, null, 2));
console.log('✅ Rapport généré : scan-report.json');
