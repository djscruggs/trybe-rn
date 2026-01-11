import axios from 'axios';
import { challengesApi } from '~/lib/api/challengesApi';
import { API_HOST } from '~/lib/environment';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock environment
jest.mock('~/lib/environment', () => ({
  API_HOST: 'https://api.test.com',
}));

// Mock apiClient
jest.mock('~/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { apiClient } from '~/lib/api/client';

describe('Challenges API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActive', () => {
    it('fetches active challenges without token', async () => {
      const mockChallenges = [
        { id: '1', name: 'Challenge 1' },
        { id: '2', name: 'Challenge 2' },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { challenges: mockChallenges },
      });

      const result = await challengesApi.getActive();

      expect(apiClient.get).toHaveBeenCalledWith(
        `${API_HOST}/api/challenges/active`,
        {}
      );
      expect(result).toEqual(mockChallenges);
    });

    it('fetches active challenges with token', async () => {
      const mockChallenges = [{ id: '1', name: 'Challenge 1' }];
      const token = 'test-token';

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { challenges: mockChallenges },
      });

      const result = await challengesApi.getActive(token);

      expect(apiClient.get).toHaveBeenCalledWith(
        `${API_HOST}/api/challenges/active`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(result).toEqual(mockChallenges);
    });

    it('returns empty array when challenges is null', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { challenges: null },
      });

      const result = await challengesApi.getActive();

      expect(result).toEqual([]);
    });
  });

  describe('get', () => {
    it('fetches a single challenge by id', async () => {
      const mockChallenge = { id: '1', name: 'Challenge 1', description: 'Test' };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockChallenge,
      });

      const result = await challengesApi.get('1');

      expect(apiClient.get).toHaveBeenCalledWith(`${API_HOST}/api/challenges/v/1`);
      expect(result).toEqual(mockChallenge);
    });
  });

  describe('getProgram', () => {
    it('fetches challenge program by id', async () => {
      const mockProgram = { days: [], tasks: [] };

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: mockProgram,
      });

      const result = await challengesApi.getProgram('1');

      expect(apiClient.get).toHaveBeenCalledWith(
        `${API_HOST}/api/challenges/v/1/program`
      );
      expect(result).toEqual(mockProgram);
    });
  });

  describe('getMembership', () => {
    it('fetches user membership for a challenge', async () => {
      const mockMembership = { id: '1', userId: 'user1', challengeId: 'challenge1' };
      const token = 'test-token';

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { membership: mockMembership },
      });

      const result = await challengesApi.getMembership('challenge1', token);

      expect(apiClient.get).toHaveBeenCalledWith(
        `${API_HOST}/api/challenges/v/challenge1/membership`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(result).toEqual(mockMembership);
    });
  });

  describe('getCheckIns', () => {
    it('fetches check-ins with token', async () => {
      const mockCheckIns = [
        { id: '1', date: '2024-01-01' },
        { id: '2', date: '2024-01-02' },
      ];
      const token = 'test-token';

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { checkIns: mockCheckIns },
      });

      const result = await challengesApi.getCheckIns('challenge1', 'user1', token);

      expect(apiClient.get).toHaveBeenCalledWith(
        `${API_HOST}/api/checkins/challenge1/user1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(result).toEqual(mockCheckIns);
    });

    it('fetches check-ins with cohort id', async () => {
      const mockCheckIns = [{ id: '1', date: '2024-01-01' }];
      const token = 'test-token';

      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { checkIns: mockCheckIns },
      });

      const result = await challengesApi.getCheckIns('challenge1', 'user1', token, 123);

      expect(apiClient.get).toHaveBeenCalledWith(
        `${API_HOST}/api/checkins/challenge1/user1/123`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(result).toEqual(mockCheckIns);
    });

    it('returns empty array when checkIns is null', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { checkIns: null },
      });

      const result = await challengesApi.getCheckIns('challenge1', 'user1', 'token');

      expect(result).toEqual([]);
    });
  });
});
