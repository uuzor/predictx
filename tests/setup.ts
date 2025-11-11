// Test setup file
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_CONSOLE = 'false';
process.env.ENABLE_YELLOW_NETWORK = 'false'; // Disable in tests
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/predictx_test';

// Set test timeout
jest.setTimeout(30000);

// Mock Yellow Network service for tests
jest.mock('../server/services/yellowNetworkService', () => ({
  yellowNetworkService: {
    submitPrediction: jest.fn().mockResolvedValue('mock-tx-hash'),
    settlePrediction: jest.fn().mockResolvedValue('mock-settlement-tx'),
    getConnectionStatus: jest.fn().mockReturnValue('connected'),
    getSessionOpen: jest.fn().mockReturnValue(true),
    getLastRpcTimestamp: jest.fn().mockReturnValue(Date.now()),
    getHealthStatus: jest.fn().mockReturnValue({
      connected: true,
      sessionOpen: true,
      circuitOpen: false,
      failureCount: 0,
      reconnectAttempts: 0,
      queuedRequests: 0,
      pendingRequests: 0,
      lastRpcTimestamp: Date.now(),
    }),
    isYellowNetworkConnected: jest.fn().mockReturnValue(true),
  },
}));

export {};
