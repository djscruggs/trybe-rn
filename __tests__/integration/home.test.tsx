import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '~/app/(tabs)/index';
import { challengesApi } from '~/lib/api/challengesApi';
import type { ChallengeSummary } from '~/lib/types';

// Mock the challengesApi
jest.mock('~/lib/api/challengesApi', () => ({
  challengesApi: {
    getActive: jest.fn(),
  },
}));

// Mock CurrentUserContext
let mockGetToken: jest.Mock;
let mockUseCurrentUser: jest.Mock;

// Factory function for creating fresh mocks
const createMockUseCurrentUser = () => {
  mockGetToken = jest.fn().mockResolvedValue(null);
  return jest.fn(() => ({
    currentUser: null,
    getToken: mockGetToken,
  }));
};

jest.mock('~/contexts/currentuser-context', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

// Mock AuthSheet context
let mockOpenSignUp: jest.Mock;
let mockOpenSignIn: jest.Mock;

const createMockAuthSheet = () => {
  mockOpenSignUp = jest.fn();
  mockOpenSignIn = jest.fn();
  return {
    openSignUp: mockOpenSignUp,
    openSignIn: mockOpenSignIn,
  };
};

jest.mock('~/contexts/auth-sheet-context', () => ({
  useAuthSheet: () => createMockAuthSheet(),
}));

// Mock Clerk
let mockUseAuth: jest.Mock;

const createMockUseAuth = () => {
  return jest.fn(() => ({
    isSignedIn: false,
    userId: null,
    getToken: jest.fn(),
  }));
};

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock logger
jest.mock('~/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Create a complete mock challenge with all required fields
const createMockChallenge = (overrides?: Partial<ChallengeSummary>): ChallengeSummary => ({
  id: 1,
  name: 'Test Challenge',
  description: 'A test challenge description',
  mission: 'Test mission',
  startAt: new Date('2024-01-01'),
  endAt: new Date('2024-01-31'),
  numDays: 30,
  type: 'SCHEDULED' as const,
  status: 'PUBLISHED' as const,
  frequency: 'DAILY' as const,
  coverPhotoMeta: {
    url: 'https://example.com/image.jpg',
    secure_url: 'https://example.com/image.jpg',
    public_id: 'test-image',
    format: 'jpg',
    resource_type: 'image',
  },
  videoMeta: null,
  icon: null,
  color: '#FF5733',
  categories: [],
  reminders: true,
  syncCalendar: false,
  publishAt: new Date('2024-01-01'),
  published: true,
  public: true,
  userId: 1,
  likeCount: 0,
  commentCount: 0,
  _count: {
    members: 10,
    likes: 5,
    comments: 3,
  },
  ...overrides,
});

describe('Home Screen', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    queryClient.clear();

    // Reset all mocks using factory functions
    mockUseCurrentUser = createMockUseCurrentUser();
    mockUseAuth = createMockUseAuth();
    mockOpenSignUp = jest.fn();
    mockOpenSignIn = jest.fn();

    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders welcome header and About Us button', async () => {
    (challengesApi.getActive as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('WELCOME TO')).toBeTruthy();
      expect(getByText('Trybe')).toBeTruthy();
      expect(getByText('(BETA)')).toBeTruthy();
      expect(getByText('About Us')).toBeTruthy();
    });
  });

  it('shows loading state while fetching challenges', async () => {
    // Mock a delayed response to simulate loading
    (challengesApi.getActive as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('displays challenges when loaded successfully', async () => {
    const mockChallenges: ChallengeSummary[] = [
      createMockChallenge({
        id: 1,
        name: 'Test Challenge',
        description: 'A test challenge',
      }),
    ];

    (challengesApi.getActive as jest.Mock).mockResolvedValue(mockChallenges);

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('Explore Challenges')).toBeTruthy();
    });
  });

  it('displays sign up prompt when user is not signed in', async () => {
    (challengesApi.getActive as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('Sign Up to Join Challenges')).toBeTruthy();
    });
  });

  it('displays feedback section', async () => {
    (challengesApi.getActive as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText("How's Your Experience?")).toBeTruthy();
      expect(getByText('Leave Us Your Feedback!')).toBeTruthy();
    });
  });

  it('handles error state gracefully', async () => {
    (challengesApi.getActive as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch challenges')
    );

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('Error loading challenges')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('navigates to about page when About Us is clicked', async () => {
      const mockPush = jest.fn();
      jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      (challengesApi.getActive as jest.Mock).mockResolvedValue([]);

      const { getByText } = render(
        <QueryClientProvider client={queryClient}>
          <Home />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(getByText('About Us')).toBeTruthy();
      });

      const aboutButton = getByText('About Us');
      fireEvent.press(aboutButton);

      expect(mockPush).toHaveBeenCalledWith('/about');
    });

    it('opens sign up sheet when challenge is clicked while signed out', async () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        userId: null,
        getToken: jest.fn(),
      });

      const mockChallenges: ChallengeSummary[] = [
        createMockChallenge({
          id: 1,
          name: 'Test Challenge',
        }),
      ];

      (challengesApi.getActive as jest.Mock).mockResolvedValue(mockChallenges);

      const { getByText } = render(
        <QueryClientProvider client={queryClient}>
          <Home />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(getByText('Test Challenge')).toBeTruthy();
      });

      const challengeItem = getByText('Test Challenge');
      fireEvent.press(challengeItem);

      expect(mockOpenSignUp).toHaveBeenCalled();
    });

    it('navigates to challenge detail when clicked while signed in', async () => {
      const mockPush = jest.fn();
      jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        userId: 'user123',
        getToken: jest.fn(),
      });

      const mockChallenges: ChallengeSummary[] = [
        createMockChallenge({
          id: 1,
          name: 'Test Challenge',
        }),
      ];

      (challengesApi.getActive as jest.Mock).mockResolvedValue(mockChallenges);

      const { getByText } = render(
        <QueryClientProvider client={queryClient}>
          <Home />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(getByText('Test Challenge')).toBeTruthy();
      });

      const challengeItem = getByText('Test Challenge');
      fireEvent.press(challengeItem);

      expect(mockPush).toHaveBeenCalledWith(`challenges/${mockChallenges[0].id}/about`);
    });
  });

  describe('Authenticated User State', () => {
    it('displays challenge list when user is signed in', async () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        userId: 'user123',
        getToken: jest.fn().mockResolvedValue('test-token'),
      });

      const mockChallenges: ChallengeSummary[] = [
        createMockChallenge({
          id: 1,
          name: 'Challenge One',
          description: 'First challenge',
        }),
        createMockChallenge({
          id: 2,
          name: 'Challenge Two',
          description: 'Second challenge',
        }),
      ];

      (challengesApi.getActive as jest.Mock).mockResolvedValue(mockChallenges);

      const { getByText, queryByText } = render(
        <QueryClientProvider client={queryClient}>
          <Home />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(getByText('Challenge One')).toBeTruthy();
        expect(getByText('Challenge Two')).toBeTruthy();
      });

      // Should not show sign up prompt when signed in
      expect(queryByText('Sign Up to Join Challenges')).toBeNull();
    });

    it('renders successfully for signed in user', async () => {
      const mockToken = 'auth-token-123';
      mockGetToken.mockResolvedValue(mockToken);
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        userId: 'user123',
        getToken: jest.fn().mockResolvedValue(mockToken),
      });

      const mockChallenges: ChallengeSummary[] = [
        createMockChallenge({
          id: 1,
          name: 'Test Challenge',
        }),
      ];

      (challengesApi.getActive as jest.Mock).mockResolvedValue(mockChallenges);

      const { getByText } = render(
        <QueryClientProvider client={queryClient}>
          <Home />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(getByText('Test Challenge')).toBeTruthy();
      });
    });
  });
});
