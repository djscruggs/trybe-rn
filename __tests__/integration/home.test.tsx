import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '~/app/(tabs)/index';
import { challengesApi } from '~/lib/api/challengesApi';

// Mock the challengesApi
jest.mock('~/lib/api/challengesApi', () => ({
  challengesApi: {
    getActive: jest.fn(),
  },
}));

// Mock CurrentUserContext
const mockGetToken = jest.fn().mockResolvedValue(null);
const mockUseCurrentUser = jest.fn(() => ({
  currentUser: null,
  getToken: mockGetToken,
}));

jest.mock('~/contexts/currentuser-context', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

// Mock AuthSheet context
const mockOpenSignUp = jest.fn();
const mockOpenSignIn = jest.fn();

jest.mock('~/contexts/auth-sheet-context', () => ({
  useAuthSheet: () => ({
    openSignUp: mockOpenSignUp,
    openSignIn: mockOpenSignIn,
  }),
}));

// Mock Clerk
const mockUseAuth = jest.fn(() => ({
  isSignedIn: false,
  userId: null,
  getToken: jest.fn(),
}));

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
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders welcome header and About Us button', () => {
    (challengesApi.getActive as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    expect(getByText('WELCOME TO')).toBeTruthy();
    expect(getByText('Trybe')).toBeTruthy();
    expect(getByText('(BETA)')).toBeTruthy();
    expect(getByText('About Us')).toBeTruthy();
  });

  it('shows loading state while fetching challenges', async () => {
    (challengesApi.getActive as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('displays challenges when loaded successfully', async () => {
    const mockChallenges = [
      {
        id: '1',
        name: 'Test Challenge',
        description: 'A test challenge',
        imageUrl: 'https://example.com/image.jpg',
      },
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

  it('displays feedback section', () => {
    (challengesApi.getActive as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    expect(getByText("How's Your Experience?")).toBeTruthy();
    expect(getByText('Leave Us Your Feedback!')).toBeTruthy();
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

      const aboutButton = getByText('About Us');
      fireEvent.press(aboutButton);

      expect(mockPush).toHaveBeenCalledWith('/about');
    });

    it('opens sign up sheet when challenge is clicked while signed out', async () => {
      mockOpenSignUp.mockClear();
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        userId: null,
        getToken: jest.fn(),
      });

      const mockChallenges = [
        {
          id: '1',
          name: 'Test Challenge',
          description: 'A test challenge',
          imageUrl: 'https://example.com/image.jpg',
        },
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

      const mockChallenges = [
        {
          id: '1',
          name: 'Test Challenge',
          description: 'A test challenge',
          imageUrl: 'https://example.com/image.jpg',
        },
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

      expect(mockPush).toHaveBeenCalledWith('challenges/1/about');
    });
  });

  describe('Authenticated User State', () => {
    it('displays challenge list when user is signed in', async () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        userId: 'user123',
        getToken: jest.fn().mockResolvedValue('test-token'),
      });

      const mockChallenges = [
        {
          id: '1',
          name: 'Challenge One',
          description: 'First challenge',
          imageUrl: 'https://example.com/image1.jpg',
        },
        {
          id: '2',
          name: 'Challenge Two',
          description: 'Second challenge',
          imageUrl: 'https://example.com/image2.jpg',
        },
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

    it('uses auth token when fetching challenges for signed in user', async () => {
      const mockToken = 'auth-token-123';
      mockGetToken.mockResolvedValue(mockToken);
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        userId: 'user123',
        getToken: jest.fn().mockResolvedValue(mockToken),
      });

      (challengesApi.getActive as jest.Mock).mockResolvedValue([]);

      render(
        <QueryClientProvider client={queryClient}>
          <Home />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(challengesApi.getActive).toHaveBeenCalledWith(mockToken);
      });
    });
  });
});
