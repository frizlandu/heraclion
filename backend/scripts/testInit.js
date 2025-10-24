// scripts/testInit.js
const fs = require('fs');
const path = require('path');

const beforeEachBlock = `
beforeEach(() => {
  const testUser = testHelpers.createTestUser({ role: 'ADMIN' });
  const testClient = testHelpers.createTestClient();
  const testEntreprise = testHelpers.createTestEntreprise();
  const authToken = testHelpers.createTestToken(testUser.id, testUser.role);
});
`;

const afterAllBlock = `
afterAll(async () => {
  if (global.server && typeof global.server.close === 'function') {
    await new Promise((resolve) => global.server.close(resolve));
  }
});
`;

function wrapWithDescribe(content, fileName) {
  const testName = path.basename(fileName).replace('.test.js', '');
  return `describe('${testName}', () => {\n${content}\n});\n`;
}

function inject(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  const usesHelpers = content.includes('testHelpers');
  const hasBeforeEach = content.includes('beforeEach');
  const hasAfterAll = content.includes('afterAll');
  const hasDescribe = content.includes('describe(');

  // Inject beforeEach
  if (usesHelpers && !hasBeforeEach) {
    content += '\n' + beforeEachBlock;
    modified = true;
  }

  // Inject afterAll
  if (content.includes('global.server') && !hasAfterAll) {
    content += '\n' + afterAllBlock;
    modified = true;
  }

  // Wrap with describe if missing
  if (!hasDescribe && content.includes('test(')) {
    content = wrapWithDescribe(content, filePath);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Injecté : ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.test.js')) {
      inject(fullPath);
    }
  });
}

walk(path.join(__dirname, '..', 'tests'));
