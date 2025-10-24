// jest.setup.js

jest.mock('./config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn().mockResolvedValue({
    query: jest.fn().mockRejectedValue(new Error('Transaction error')),
    release: jest.fn(),
    done: jest.fn()
  }),
  end: jest.fn(),
  config: {},
  getPoolStats: jest.fn(),
  healthCheck: jest.fn(),
  isRetryableError: jest.fn()
}));

jest.mock('./utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.useFakeTimers(); // ✅ empêche les timers de bloquer Jest
