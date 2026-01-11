# Trybe Mobile Test Suite

This directory contains functional tests for the Trybe React Native mobile application.

## Test Structure

```
__tests__/
├── integration/          # Integration tests for app components and APIs
│   ├── api.test.ts      # API endpoint tests
│   └── home.test.tsx    # Home screen component tests
└── unit/                # Unit tests for utilities
    └── utils.test.ts    # Utility function tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Coverage

### Integration Tests

#### API Tests (`api.test.ts`)
- **getActive**: Tests fetching active challenges with/without authentication
- **get**: Tests fetching individual challenges
- **getProgram**: Tests fetching challenge programs
- **getMembership**: Tests fetching user membership data
- **getCheckIns**: Tests fetching check-in data with various parameters

#### Home Screen Tests (`home.test.tsx`)
- Header rendering (Welcome message, Trybe branding, About Us button)
- Loading states
- Challenge list rendering
- Authentication state handling
- Error state handling
- Feedback section rendering

### Unit Tests

#### Utility Tests (`utils.test.ts`)
- Logger utility methods (debug, error, info, warn)
- Type validation for core data models (ChallengeSummary, CheckIn)

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Preset: `react-native`
- Test environment: `node`
- Module name mapping for `~` alias
- Transform ignore patterns for React Native and Expo modules

### Jest Setup (`jest.setup.js`)
Mocked modules:
- `expo-router` - Navigation mocks
- `expo-secure-store` - Secure storage mocks
- `@clerk/clerk-expo` - Authentication mocks
- `react-native-gesture-handler` - Gesture handling mocks
- `@gorhom/bottom-sheet` - Bottom sheet component mocks
- `react-native-reanimated` - Animation library mocks
- `expo-image-picker` - Image picker mocks
- `expo-modules-core` - Expo core modules

## Writing New Tests

### Example: Testing a new component

```typescript
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import YourComponent from '~/app/your-component';

describe('YourComponent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <YourComponent />
      </QueryClientProvider>
    );
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

### Example: Testing an API endpoint

```typescript
import { apiClient } from '~/lib/api/client';
import { yourApi } from '~/lib/api/yourApi';

jest.mock('~/lib/api/client');

describe('Your API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches data correctly', async () => {
    const mockData = { id: '1', name: 'Test' };
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: mockData,
    });

    const result = await yourApi.getData('1');

    expect(apiClient.get).toHaveBeenCalledWith('/api/endpoint/1');
    expect(result).toEqual(mockData);
  });
});
```

## Known Issues

- Some async operations may not exit gracefully (use `--forceExit` flag)
- React Testing Library may show warnings about updates not wrapped in `act()` - these are expected for async queries

## Test Statistics

- **Total Test Suites**: 3
- **Total Tests**: 22
- **Pass Rate**: 100%

## Dependencies

- `jest`: Testing framework
- `@testing-library/react-native`: React Native testing utilities
- `@testing-library/jest-native`: Additional matchers (deprecated, using built-in matchers)
- `react-test-renderer`: React component renderer for tests
- `babel-jest`: Babel transformer for Jest
- `identity-obj-proxy`: CSS module mock
