---
paths: ["__tests__/**", "**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"]
---

# Testing Conventions

## Mock at the API Service Layer

Mock the API service objects (e.g., `challengesApi`) rather than mocking TanStack Query's `useQuery` hook. This lets React Query lifecycle (loading, error, success) work naturally.

```typescript
// Correct
jest.mock('~/lib/api/challengesApi', () => ({
  challengesApi: { getActive: jest.fn() },
}));

// Wrong — bypasses React Query lifecycle
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
```

## No Redundant HTTP Library Mocks

Only mock the abstraction your code imports. If a service uses `apiClient`, mock `apiClient` — do not also mock `axios`.

```typescript
// Correct — mock the abstraction the service uses
jest.mock('~/lib/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

// Wrong — redundant mock of underlying library
jest.mock('axios');
```

## Factory Functions for Mock Data and State

Use factory functions that return fully-typed objects with all required fields, accepting `Partial<T>` overrides. Re-create context mocks in `beforeEach` to prevent shared state between tests.

```typescript
const createMockChallenge = (overrides?: Partial<ChallengeSummary>): ChallengeSummary => ({
  id: 1,
  name: 'Test Challenge',
  type: 'SCHEDULED' as const,
  status: 'PUBLISHED' as const,
  _count: { members: 10, likes: 5, comments: 3 },
  // ... all other required fields
  ...overrides,
});

beforeEach(() => {
  mockUseCurrentUser = createMockUseCurrentUser();
  mockUseAuth = createMockUseAuth();
});
```

## Complete Mock Data

Mock data must include every required field from the TypeScript type. Incomplete mocks cause tests to pass with data that would fail in production.

## Type Annotations on Mock Data

Include TypeScript type annotations for all mock data variables.

```typescript
import type { ChallengeSummary } from '~/lib/types';

const mockChallenges: ChallengeSummary[] = [createMockChallenge()];
```

## Clear React Query Cache Between Tests

Create a fresh `QueryClient` in `beforeEach` with `retry: false`, and call `queryClient.clear()` in `afterEach` to prevent cached data from leaking across tests.

```typescript
let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});

afterEach(() => {
  queryClient.clear();
});
```
