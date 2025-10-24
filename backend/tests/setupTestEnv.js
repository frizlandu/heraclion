// tests/setupTestEnv.js

const path = require('path');

// Injection globale de testHelpers
global.testHelpers = require(path.resolve(__dirname, '../utils/testHelpers'));
