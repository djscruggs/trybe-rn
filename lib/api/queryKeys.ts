/**
 * Centralized query key factory for TanStack Query
 * Following best practices from TanStack Query documentation
 */

export const queryKeys = {
  // Categories
  categories: {
    all: ['categories'] as const,
  },

  // Challenges
  challenges: {
    all: ['challenges'] as const,
    active: () => [...queryKeys.challenges.all, 'active'] as const,
    detail: (id: string) => [...queryKeys.challenges.all, id] as const,
    program: (id: string) => [...queryKeys.challenges.detail(id), 'program'] as const,
    membership: (id: string) => [...queryKeys.challenges.detail(id), 'membership'] as const,
    checkIns: (challengeId: string, userId: string) =>
      [...queryKeys.challenges.detail(challengeId), 'checkIns', userId] as const,
  },

  // Posts
  posts: {
    all: ['posts'] as const,
    detail: (id: string) => [...queryKeys.posts.all, id] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    detail: (id: string) => [...queryKeys.users.all, id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
  },

  // Comments
  comments: {
    all: ['comments'] as const,
    challenge: (challengeId: string, cohortId?: number) =>
      [...queryKeys.comments.all, 'challenge', challengeId, cohortId || 'all'] as const,
  },
};
