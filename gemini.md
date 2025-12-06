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
    - `about/`: About screen.
    - `profile.tsx`: User profile (protected).
    - `sign-up.tsx`: Auth entry point.
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

## API Documentation

The file `scratchpad/MOBILE_CLIENT_PROCESSES.md` serves as the **API Contract** for this mobile client.

- **Relevance**: While the file describes the *backend* implementation (Remix loaders, server-side code), the **API Endpoints** and **Data Models** it lists are the exact ones consumed by this React Native app.
- **Verified Endpoints**:
  - `GET /api/challenges/active` (Used in `app/index.tsx`)
  - `GET /api/challenges/v/:id/program` (Used in `app/challenges/[id]/program.tsx`)
- **Usage Pattern**: The app uses `axios` and `TanStack Query` to fetch data from these endpoints, expecting the JSON structures defined in that document.

## Issue Tracking (Beads)

This project uses **Beads** for issue tracking, an AI-native tool that lives directly in the codebase.

### Essential Commands

```bash
# Create new issues
bd create "Add user authentication"

# View all issues
bd list

# View issue details
bd show <issue-id>

# Update issue status
bd update <issue-id> --status in-progress
bd update <issue-id> --status done

# Sync with git remote
bd sync
```

### Key Features
- **Git-native**: Issues are stored in `.beads/issues.jsonl` and synced with your code.
- **AI-friendly**: Designed for CLI usage and AI agents.



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