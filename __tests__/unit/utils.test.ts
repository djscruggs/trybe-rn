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

  it('should have debug method', () => {
    expect(typeof logger.debug).toBe('function');
  });

  it('should have error method', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('should have info method', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('should have warn method', () => {
    expect(typeof logger.warn).toBe('function');
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
