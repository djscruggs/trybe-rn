# TanStack Query Migration Summary

This document summarizes the refactoring completed to standardize data fetching using TanStack Query v5 throughout the codebase.

## Goals Achieved

✅ Eliminated inconsistent data fetching patterns  
✅ Centralized API logic in reusable service files  
✅ Implemented proper cache management with query keys  
✅ Added mutations with automatic cache invalidation  
✅ Removed direct axios calls from components  

## Files Created

### API Services (`lib/api/`)

1. **`categoriesApi.ts`** - Categories data fetching
   - `getAll()` - Fetch all categories

2. **`challengesApi.ts`** - Challenges data fetching and mutations
   - `getActive()` - Fetch active challenges
   - `get(id)` - Fetch single challenge
   - `getProgram(id)` - Fetch challenge program
   - `getPost(id)` - Fetch challenge post
   - `getMembership(id, token)` - Fetch user's membership
   - `create(data, token)` - Create new challenge
   - `joinOrLeave(id, data, token)` - Join/leave challenge
   - `getCheckIns(challengeId, userId)` - Fetch check-ins
   - `updateMembership(id, data)` - Update membership

3. **`queryKeys.ts`** - Centralized query key factory
   - Categories keys
   - Challenges keys (all, active, detail, program, membership, checkIns)
   - Posts keys
   - Users keys

## Files Refactored

### App Routes

1. **`app/(tabs)/index.tsx`**
   - ✅ Using `challengesApi.getActive()`
   - ✅ Using `queryKeys.challenges.active()`
   - ❌ Removed direct axios call

2. **`app/(tabs)/my-challenges.tsx`**
   - ✅ Using `challengesApi.getActive()`
   - ✅ Using `queryKeys.challenges.active()`
   - ❌ Removed direct axios call

3. **`app/(tabs)/new.tsx`**
   - ✅ Using `useQuery` for categories with `categoriesApi.getAll()`
   - ✅ Using `useMutation` for challenge creation with `challengesApi.create()`
   - ✅ Automatic cache invalidation on success
   - ✅ Using `createChallengeMutation.isPending` instead of manual loading state
   - ❌ Removed useEffect and manual axios calls

4. **`app/(tabs)/challenges/[id]/_layout.tsx`**
   - ✅ Using `challengesApi.get()` for challenge data
   - ✅ Using `challengesApi.getMembership()` for membership
   - ✅ Using `queryKeys.challenges.detail()`
   - ❌ Removed direct axios calls

5. **`app/(tabs)/challenges/[id]/program.tsx`**
   - ✅ Using `challengesApi.getProgram()`
   - ✅ Using `queryKeys.challenges.program()`
   - ❌ Removed direct axios call

6. **`app/(tabs)/challenges/[id]/post.tsx`**
   - ✅ Using `challengesApi.getPost()`
   - ✅ Using `queryKeys.posts.detail()`
   - ❌ Removed direct axios call

### Components

7. **`components/NewChallengeSheet.tsx`**
   - ✅ Using `useQuery` for categories
   - ✅ Using `useMutation` for challenge creation
   - ✅ Automatic cache invalidation on success
   - ✅ Using `createChallengeMutation.isPending` instead of manual loading state
   - ❌ Removed useEffect and manual axios calls

## Benefits

### 1. **Automatic Caching**
- No duplicate requests for the same data
- Data persists across component remounts
- Configurable stale time

### 2. **Automatic Refetching**
- Data stays fresh automatically
- Refetch on window focus (configurable)
- Background updates

### 3. **Cache Invalidation**
- Creating a challenge automatically refetches the challenges list
- Mutations trigger relevant queries to update
- No manual cache management needed

### 4. **Consistent Loading States**
- `isPending` instead of manual `useState` for loading
- `error` property for error handling
- Cleaner component code

### 5. **Better Developer Experience**
- Centralized API logic (easier to find and modify)
- Type-safe query keys
- Reusable across components

## Query Key Strategy

Using hierarchical query keys following TanStack Query best practices:

```typescript
// Lists
['challenges'] // All challenges
['challenges', 'active'] // Active challenges

// Details  
['challenges', id] // Single challenge
['challenges', id, 'program'] // Challenge program
['challenges', id, 'membership'] // User membership

// Nested
['users', userId, 'posts'] // User's posts
```

## Migration Pattern

**Before (Direct Axios):**
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    const response = await axios.get('/api/data');
    setData(response.data);
    setLoading(false);
  };
  fetchData();
}, []);
```

**After (TanStack Query):**
```typescript
const { data, isPending } = useQuery({
  queryKey: queryKeys.data.all,
  queryFn: dataApi.getAll,
});
```

## Remaining Work

Files that still need migration (if any):
- `app/(tabs)/challenges/[id]/about.tsx` - Contains join/leave mutations that should use TanStack Query
- `components/ChallengeOverview.tsx` - May have direct axios calls
- Any other components with direct data fetching

## Testing Recommendations

1. Verify all data loads correctly
2. Test cache invalidation after mutations
3. Check loading states display properly
4. Ensure error states are handled
5. Verify offline behavior (optional based on config)

