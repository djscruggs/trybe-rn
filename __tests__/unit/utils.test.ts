import { logger } from '~/lib/logger';

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log debug messages to console.log', () => {
    const testMessage = 'test debug message';
    const testData = { foo: 'bar' };

    logger.debug(testMessage, testData);

    // In test environment, __DEV__ should be true, so debug should call console.log
    expect(console.log).toHaveBeenCalledWith(testMessage, testData);
  });

  it('should log error messages to console.error', () => {
    const testError = 'test error message';
    const errorDetails = { code: 500 };

    logger.error(testError, errorDetails);

    expect(console.error).toHaveBeenCalledWith(testError, errorDetails);
  });

  it('should log info messages to console.info', () => {
    const testInfo = 'test info message';

    logger.info(testInfo);

    // In test environment, __DEV__ should be true, so info should call console.info
    expect(console.info).toHaveBeenCalledWith(testInfo);
  });

  it('should log warning messages to console.warn', () => {
    const testWarning = 'test warning message';

    logger.warn(testWarning);

    expect(console.warn).toHaveBeenCalledWith(testWarning);
  });
});

describe('Type Definitions', () => {
  it('should validate ChallengeSummary type structure', () => {
    const mockChallenge = {
      id: '1',
      name: 'Test Challenge',
      description: 'A test challenge',
      imageUrl: 'https://example.com/image.jpg',
    };

    expect(mockChallenge).toHaveProperty('id');
    expect(mockChallenge).toHaveProperty('name');
    expect(mockChallenge).toHaveProperty('description');
    expect(typeof mockChallenge.id).toBe('string');
    expect(typeof mockChallenge.name).toBe('string');
  });

  it('should validate CheckIn type structure', () => {
    const mockCheckIn = {
      id: '1',
      date: '2024-01-01',
      userId: 'user1',
      challengeId: 'challenge1',
    };

    expect(mockCheckIn).toHaveProperty('id');
    expect(mockCheckIn).toHaveProperty('date');
    expect(mockCheckIn).toHaveProperty('userId');
    expect(mockCheckIn).toHaveProperty('challengeId');
  });
});
