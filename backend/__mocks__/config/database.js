module.exports = {
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
};
