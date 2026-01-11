import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
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
jest.mock('~/contexts/currentuser-context', () => ({
  useCurrentUser: () => ({
    currentUser: null,
    getToken: jest.fn().mockResolvedValue(null),
  }),
}));

// Mock AuthSheet context
jest.mock('~/contexts/auth-sheet-context', () => ({
  useAuthSheet: () => ({
    openSignUp: jest.fn(),
    openSignIn: jest.fn(),
  }),
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
    jest.clearAllMocks();
  });

  it('renders welcome header correctly', () => {
    (challengesApi.getActive as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

    expect(getByText('WELCOME TO')).toBeTruthy();
    expect(getByText('Trybe')).toBeTruthy();
    expect(getByText('(BETA)')).toBeTruthy();
  });

  it('displays About Us button', () => {
    (challengesApi.getActive as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>
    );

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
});
