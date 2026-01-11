import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Home from '~/app/(tabs)/index';
import { challengesApi } from '~/lib/api/challengesApi';

// Mock TanStack Query useQuery hook
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

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
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

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
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

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

    (useQuery as jest.Mock).mockReturnValue({
      data: mockChallenges,
      isLoading: false,
      error: null,
    });

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
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

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
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    expect(getByText("How's Your Experience?")).toBeTruthy();
    expect(getByText('Leave Us Your Feedback!')).toBeTruthy();
  });

  it('handles error state gracefully', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch challenges'),
    });

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

      (useQuery as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

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

      (useQuery as jest.Mock).mockReturnValue({
        data: mockChallenges,
        isLoading: false,
        error: null,
      });

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

      (useQuery as jest.Mock).mockReturnValue({
        data: mockChallenges,
        isLoading: false,
        error: null,
      });

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

      (useQuery as jest.Mock).mockReturnValue({
        data: mockChallenges,
        isLoading: false,
        error: null,
      });

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

      const mockChallenges = [
        {
          id: '1',
          name: 'Test Challenge',
          description: 'A test challenge',
          imageUrl: 'https://example.com/image.jpg',
        },
      ];

      (useQuery as jest.Mock).mockReturnValue({
        data: mockChallenges,
        isLoading: false,
        error: null,
      });

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
