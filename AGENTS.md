# Project Overview: Trybe Mobile (React Native)

This repository (`trybe-rn`) contains the **mobile client** for the Trybe application, built with **React Native** and **Expo**.

> [!IMPORTANT]
> **Documentation Discrepancy**: The file `scratchpad/MOBILE_CLIENT_PROCESSES.md` appears to describe a **Remix/Web backend** architecture (referencing server-side loaders, `app/models`, and API routes). The actual codebase is a client-side React Native application using Expo Router. Do not rely on that document for file structure or implementation details of *this* repo.

## Tech Stack

- **Framework**: [Expo](https://expo.dev) (SDK 52)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Authentication**: [Clerk](https://clerk.com) (`@clerk/clerk-expo`)
- **State Management**: 
  - Server State: [TanStack Query](https://tanstack.com/query/latest) (React Query)
  - Global State: [Zustand](https://github.com/pmndrs/zustand) (available in dependencies)
  - Auth State: Clerk + Context (`CurrentUserContext`)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **UI Components**: 
  - `@rn-primitives` (Radix-like primitives)
  - `@rneui` (React Native Elements)
  - Vector Icons (`@expo/vector-icons`, `@roninoss/icons`)

## Key Directories

- **`app/`**: Application source code (Expo Router structure).
  - **`_layout.tsx`**: Root layout containing providers (Clerk, QueryClient, UserContext).
  - **`(tabs)/`**: Main tab-based navigation layout.
    - `index.tsx`: Home/Challenges list.
    - `new.tsx`: Create new challenge (protected).
    - `about.tsx`: About screen.
    - `profile.tsx`: User profile (protected).
    - `my-challenges.tsx`: User's challenges list.
    - `challenges/`: Challenge detail screens (nested routes).
    - `sign-in.tsx`: Sign in screen.
    - `sign-up.tsx`: Sign up screen.
- **`components/`**: Reusable UI components.
- **`contexts/`**: React Context providers (e.g., `CurrentUserContext`).
- **`lib/`**: Utilities, environment configuration, and helpers.
- **`store/`**: State management stores (likely Zustand).
- **`scratchpad/`**: Documentation and notes (contains the mismatched `MOBILE_CLIENT_PROCESSES.md`).

## Authentication Flow

Authentication is handled by **Clerk**:
1.  **Root Layout**: Wraps the app in `<ClerkProvider>` and `<ClerkLoaded>`.
2.  **Token Cache**: Uses `expo-secure-store` (via `lib/cache.ts`) to persist sessions.
3.  **User Context**: `UserProvider` (in `contexts/currentuser-context`) likely syncs Clerk user data with app state.
4.  **Protected Routes**: Tab screens like `new` and `profile` conditionally render or redirect based on `currentUser` presence.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Setup**:
    Ensure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in your environment (referenced in `lib/environment.ts`).
3.  **Run Development Server**:
    ```bash
    npx expo start
    ```
    - Press `i` for iOS simulator
    - Press `a` for Android emulator

## Git Worktree Workflow

This project uses **git-worktree-utils** for managing multiple feature branches simultaneously. The repository is organized in a "bare repo + worktree" pattern.

### Repository Structure

```
/Users/djscruggs/worktrees/trybe-rn/
├── .bare/              # Git internals (shared across all worktrees)
├── master/             # Master branch worktree
├── feature/my-ui/      # Feature branch worktree
└── hotfix/crash-fix/   # Hotfix branch worktree
```

### Why Use Worktrees?

- **Parallel Development**: Work on multiple features/bugs simultaneously without branch switching
- **Isolated Environments**: Each worktree has its own `node_modules/`, Metro cache, and uncommitted changes
- **No Context Switching**: Keep dev servers running in different features
- **Fast Branch Testing**: Quickly test PRs without disrupting your current work

### Essential Commands

```bash
# Navigate to a worktree
wt-cd trybe-rn master
wt-cd trybe-rn feature/new-ui

# Create new feature worktree
wt-new trybe-rn feature/add-dark-mode

# Create worktree from existing remote branch
wt-continue trybe-rn feature/auth-improvements

# List all worktrees
wt-ls trybe-rn

# Remove worktree (prompts to delete branch)
wt-rm trybe-rn feature/completed-feature

# Update master branch
wt-update trybe-rn

# Rebase current feature onto updated master
cd /Users/djscruggs/worktrees/trybe-rn/feature/my-feature
wt-rebase
```

### Common Workflows

**Starting a New Feature:**
```bash
# Create worktree for new feature
wt-new trybe-rn feature/add-notifications

# Navigate to it
cd /Users/djscruggs/worktrees/trybe-rn/feature/add-notifications

# Install dependencies (required for each new worktree)
npm install

# Start development
npx expo start
```

**Working on Multiple Features:**
```bash
# Terminal 1: Bug fix
wt-cd trybe-rn hotfix/crash-on-ios
npx expo start --ios

# Terminal 2: Continue feature work
wt-cd trybe-rn feature/new-ui
# Your uncommitted changes are still here

# Terminal 3: Review a PR
wt-continue trybe-rn feature/colleague-pr
npm test
```

**Cleaning Up After Merge:**
```bash
# Remove worktree after PR is merged
wt-rm trybe-rn feature/completed-feature
# Prompts: "Delete remote branch? (y/n)"
```

### Integration with Git Flow

Git worktrees work seamlessly with Git Flow branching strategy:

- **Git Flow**: Defines branch naming (`feature/*`, `release/*`, `hotfix/*`)
- **Worktrees**: Provides workspace isolation for those branches

You can use your Git Flow slash commands (`/feature`, `/release`, `/hotfix`) inside any worktree:

```bash
# Navigate to master worktree
wt-cd trybe-rn master

# Create feature using your slash command
/feature my-new-feature
# This creates feature/my-new-feature branch

# Create a worktree for it
wt-new trybe-rn feature/my-new-feature
```

### Important Notes for React Native

1. **Dependencies**: Each worktree needs its own `npm install` after creation
2. **Metro Bundler**: Can run simultaneously in different worktrees (different ports)
3. **Build Artifacts**: `ios/` and `android/` folders are isolated per worktree
4. **Environment Variables**: Shared across worktrees (from `.bare/.git/config`)

### Configuration

Environment variables in `~/.zshrc`:
```bash
export WORKTREE_BASE="/Users/djscruggs/worktrees"
export CROSS_REPO_BASE="/Users/djscruggs/cross-repo-tasks"
export CROSS_REPO_ARCHIVE="/Users/djscruggs/cross-repo-tasks/wt-archive"
```

### When to Use This vs Original Repo

- **Use Worktrees**: For active development with multiple concurrent features
- **Original Repo** (`/Users/djscruggs/VSCode/trybe-rn`): Can be archived or kept as backup

## API Documentation

The file `scratchpad/MOBILE_CLIENT_PROCESSES.md` serves as the **API Contract** for this mobile client.

- **Relevance**: While the file describes the *backend* implementation (Remix loaders, server-side code), the **API Endpoints** and **Data Models** it lists are the exact ones consumed by this React Native app.
- **Verified Endpoints**:
  - `GET /api/challenges/active` (Used in `app/(tabs)/index.tsx`)
  - `GET /api/challenges/v/:id/program` (Used in `app/(tabs)/challenges/[id]/program.tsx`)
- **Usage Pattern**: The app uses `axios` and `TanStack Query` to fetch data from these endpoints, expecting the JSON structures defined in that document.


**Important**
When doing web searches for documentation, search for an llms.txt file and add it to blz (see below)

This project uses `blz` - a fast CLI tool for searching llms.txt documentation files. Use it to quickly find documentation for the tech stack and this project.


```bash

# Option 1: Local docs if an llms.txt exists

blz add [name of project] ./llms.txt


# Option 2: Add from web 
# JavaScript/TypeScript ecosystem
blz add bun https://bun.sh/llms.txt
blz add turborepo https://turborepo.com/llms.txt
```
- The current year is 2026. When searching, make sure you include the current year.

## Coding Conventions

### Component Files

- Name all React Native component files in PascalCase (e.g., `ChallengeListItem.tsx`, `CheckInModal.tsx`, `BackButton.tsx`).
- Use NativeWind `className` strings for styling instead of `StyleSheet.create` objects.

### Logging

- Use the custom `logger` utility from `~/lib/logger` for all logging instead of raw `console.log` / `console.error`.
- Use `logger.debug()` for development logging and `logger.error()` for errors.

### Types

- All domain types live in `lib/types.ts`. Use base interfaces (e.g., `Challenge`, `Post`) and extended Summary interfaces (e.g., `ChallengeSummary`, `PostSummary`) that add `_count` aggregation fields.
- API methods returning lists must use the Summary variant (e.g., `ChallengeSummary[]` not `Challenge[]`) when aggregate counts are included.

### API Service Layer

- Organize API interactions as domain-specific `const` object literals (e.g., `challengesApi`, `categoriesApi`, `commentsApi`) in `lib/api/`.
- Each method is an `async` arrow function with explicit TypeScript return types.
- Pass auth tokens as explicit function parameters — never read auth state inside the API layer.
- Default nullable list fields to empty arrays (`|| []`) in the service layer to prevent null propagation to consumers.

### Query Keys

- Use the centralized `queryKeys` factory in `lib/api/queryKeys.ts` for all TanStack Query `queryKey` and `queryClient.invalidateQueries` calls. Never use inline string arrays for query keys.

## Development Practices

### Planning and Execution

- When planning a complex code change, always start with a plan of action and then ask for approval on that plan.
- For simple changes, just make the code change but always think carefully and step-by-step about the change itself.
- When a file becomes too long, split it into smaller files.
- When a function becomes too long, split it into smaller functions.

### Debugging

- When debugging a problem, make sure you have sufficient information to deeply understand the problem.
- More often than not, opt in to adding more logging and tracing to the code to help you understand the problem before making any changes. If you are provided logs that make the source of the problem obvious, then implement a solution. If you're still not 100% confident about the source of the problem, then reflect on 4-6 different possible sources of the problem, distill those down to 1-2 most likely sources, and then implement a solution for the most likely source - either adding more logging to validate your theory or implement the actual fix if you're extremely confident about the source of the problem.

### Markdown Files

- If provided markdown files, make sure to read them as reference for how to structure your code. Do not update the markdown files at all. Only use them for reference and examples of how to structure your code.

### GitHub Workflow

When interfacing with GitHub:
When asked to submit a PR - use the GitHub CLI. Assume you are already authenticated correctly.
When asked to create a PR follow this process:

1. git status - to check if there are any changes to commit
2. git add . - to add all the changes to the staging area (IF NEEDED)
3. git commit -m "your commit message" - to commit the changes (IF NEEDED)
4. git push - to push the changes to the remote repository (IF NEEDED)
5. git branch - to check the current branch
6. git log main..[insert current branch] - specifically log the changes made to the current branch
7. git diff --name-status main - check to see what files have been changed
When asked to create a commit, first check for all files that have been changed using git status.
Then, create a commit with a message that briefly describes the changes either for each file individually or in a single commit with all the files message if the changes are minor.
8. gh pr create --title "Title goes here..." --body "Example body..."

When writing a message for the PR, don't include new lines in the message. Just write a single long message.
