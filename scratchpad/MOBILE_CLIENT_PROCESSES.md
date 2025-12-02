# Mobile Client Development Guide

This document outlines the key processes and architecture for the Trybe mobile client application.

## Table of Contents
1. [Authentication](#1-authentication)
2. [Challenges](#2-challenges)
3. [Viewing a Challenge](#3-viewing-a-challenge)
4. [Posts](#4-posts)
5. [Checkins](#5-checkins)
6. [Comments](#6-comments)
7. [Shared Features](#7-shared-features)

---

## 1. AUTHENTICATION

### Overview
The mobile app uses cookie-based session authentication with support for both email/password and OAuth (Clerk) flows.

### Key Files
- Mobile Login: [app/routes/mobile.login.$.tsx](app/routes/mobile.login.$.tsx)
- Mobile Signup: [app/routes/mobile.signup.tsx](app/routes/mobile.signup.tsx)
- OAuth Password Setup: [app/routes/mobile.oauth.password.$hash.$userId.tsx](app/routes/mobile.oauth.password.$hash.$userId.tsx)
- Auth Server: [app/models/auth.server.ts](app/models/auth.server.ts)

### User Flows

#### Standard Login
1. User navigates to `/mobile/login`
2. DeviceContext checks if device is mobile
3. User enters email/password
4. Form submits to action handler
5. Calls `login()` from [auth.server.ts:17](app/models/auth.server.ts#L17)
6. Creates user session and redirects to `/challenges`

#### Registration
1. User navigates to `/mobile/signup`
2. Device check redirects desktop users to `/signup`
3. Form collects: firstName, lastName, email, password, passwordMatch
4. Server validates using validators from [app/models/validators.server.ts](app/models/validators.server.ts)
5. Calls `register()` to create user and session
6. Redirects to `/challenges`

#### OAuth Password Setup
Used when OAuth users (via Clerk) try to login without a password:
1. System generates URL-safe hash token ([auth.server.ts:117-119](app/models/auth.server.ts#L117-L119))
2. Creates PasswordResetToken with 30-minute expiry
3. User redirected to `/mobile/oauth/password/{hash}/{userId}`
4. Token validated
5. User sets new password, syncs with Clerk
6. Redirects to login with success message

### Session Management
- **Storage**: Cookie-based using `createCookieSessionStorage`
- **Session Name**: 'trybe-session'
- **Duration**: 30 days (maxAge: 60 * 60 * 24 * 30)
- **Security**: httpOnly, sameSite: 'lax', secure in production
- **Implementation**: See [auth.server.ts:24-34](app/models/auth.server.ts#L24-L34)

### Session Functions
- `createUserSession()` - Creates new session ([auth.server.ts:35-49](app/models/auth.server.ts#L35-L49))
- `getUserSession()` - Retrieves current session
- `requireCurrentUser()` - Validates and returns current user ([auth.server.ts:163-193](app/models/auth.server.ts#L163-L193))

### Data Model: CurrentUser
```typescript
{
  id: number
  email: string
  profile: Profile
  role: 'ADMIN' | 'USER'
  memberChallenges?: MemberChallenge[]
  locale?: string
  dateFormat?: string
  timeFormat?: string
  dateTimeFormat?: string
}
```

### Context Providers
- **CurrentUserContext**: [app/contexts/CurrentUserContext.ts](app/contexts/CurrentUserContext.ts) - Global user state
- **DeviceContext**: [app/contexts/DeviceContext.ts](app/contexts/DeviceContext.ts) - Mobile/device detection

---

## 2. CHALLENGES

### Overview
Challenges are the core feature - structured programs that users can join, track, and engage with.

### Challenge Types
- **SCHEDULED**: Fixed start/end dates, all members follow same timeline
- **SELF_LED**: Flexible start dates, day-number-based content, cohort-based

### Key Files

#### Views
- Challenge List: [app/routes/challenges.tsx](app/routes/challenges.tsx)
- My Challenges: [app/routes/challenges.mine.tsx](app/routes/challenges.mine.tsx)
- All Challenges: [app/routes/challenges.all.tsx](app/routes/challenges.all.tsx)
- View Challenge: [app/routes/challenges.v.$id.tsx](app/routes/challenges.v.$id.tsx)

#### Create/Edit
- New Challenge: [app/routes/challenges.new.tsx](app/routes/challenges.new.tsx)
- Edit Challenge: [app/routes/challenges.v.$id.edit.tsx](app/routes/challenges.v.$id.edit.tsx)
- Form Component: [app/components/formChallenge.tsx](app/components/formChallenge.tsx)

#### Display Components
- [app/components/challengeHeader.tsx](app/components/challengeHeader.tsx)
- [app/components/challengeOverview.tsx](app/components/challengeOverview.tsx)
- [app/components/cardChallenge.tsx](app/components/cardChallenge.tsx)

### API Endpoints

#### Read Operations
- `GET /api/challenges` - Fetch challenges with filtering
- `GET /api/challenges/v/:id` - Load single challenge summary
- `GET /api/challenges/:range` - Fetch by range (active/upcoming/archived)

#### Write Operations
- `POST /api/challenges` - Create or update challenge
  - Handles image upload via FormData
  - Manages categories
  - Calculates numDays for SCHEDULED challenges
  - Implementation: [app/routes/api.challenges.ts:18-112](app/routes/api.challenges.ts#L18-L112)

- `POST /api/challenges/join-unjoin/:id` - Join or leave challenge
  - For SELF_LED: requires notificationHour, notificationMinute, startAt, cohortId
  - For SCHEDULED: auto-joins with challenge dates
  - Sends welcome email
  - Implementation: [app/routes/api.challenges.join-unjoin.$id.ts:24-142](app/routes/api.challenges.join-unjoin.$id.ts#L24-L142)

- `DELETE /api/challenges/delete/:id` - Delete challenge
  - Implementation: [app/routes/api.challenges.delete.$id.ts:7-12](app/routes/api.challenges.delete.$id.ts#L7-L12)

### Data Models

#### Challenge
```typescript
{
  id: number
  name: string
  description: string
  mission: string
  startAt?: Date
  endAt?: Date
  numDays?: number
  type: 'SCHEDULED' | 'SELF_LED'
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
  frequency: 'DAILY' | 'WEEKDAYS' | 'ALTERNATING' | 'WEEKLY' | 'CUSTOM'
  coverPhotoMeta: CloudinaryMeta
  videoMeta: CloudinaryMeta
  icon: string
  color: string
  categories: Category[]
  public: boolean
  userId: number
}
```

#### MemberChallenge
```typescript
{
  id: number
  userId: number
  challengeId: number
  cohortId?: number
  startAt: Date
  dayNumber: number  // Current day in challenge (for SELF_LED)
  notificationHour?: number
  notificationMinute?: number
  lastCheckIn: Date
  nextCheckIn: Date
  _count?: { checkIns?: number }
}
```

### User Flows

#### View Challenges
1. Navigate to `/challenges` (default view)
2. Can switch between tabs: All, My Challenges
3. Challenges displayed as cards with:
   - Cover photo
   - Name, description
   - Member count
   - Status (active, upcoming, completed)
4. Click to view details

#### Create Challenge
1. Navigate to `/challenges/new`
2. **Basic Info**:
   - Name (required)
   - Description (required)
   - Mission statement
   - Categories (select multiple)
3. **Appearance**:
   - Icon selection
   - Color theme
   - Cover photo upload
   - Optional video
4. **Schedule Settings**:
   - Type: SCHEDULED or SELF_LED
   - **For SCHEDULED**:
     - Start date (required)
     - End date (required)
     - System calculates numDays
   - **For SELF_LED**:
     - Number of days (5-60, required)
     - No fixed dates
5. **Frequency**:
   - Daily, Weekdays, Alternating, Weekly, or Custom
6. **Visibility**:
   - Public (anyone can find) or Invite-only
7. **Status**:
   - Published (live immediately) or Draft
8. Submit to `/api/challenges`
9. For SCHEDULED: Creator automatically joins ([challenge.server.ts:21-27](app/models/challenge.server.ts#L21-L27))

#### Join Challenge
1. View challenge at `/challenges/v/:id/about`
2. Click "Join this Challenge" button
3. **For SELF_LED**:
   - Opens DialogJoin modal
   - Select start date
   - Set notification time
   - System assigns to cohort or creates new one
4. **For SCHEDULED**:
   - Joins immediately with challenge dates
   - No configuration needed
5. POST to `/api/challenges/join-unjoin/:id`
6. Creates MemberChallenge record ([challenge.server.ts:514-611](app/models/challenge.server.ts#L514-L611))
7. Sends welcome email
8. Redirects to challenge with active membership

#### Edit Challenge
1. Navigate to `/challenges/v/:id/edit`
2. Loads existing challenge data
3. **Restrictions** (based on membership count):
   - Cannot switch type if >1 member
   - Cannot make draft if members exist
   - Cannot change start date after challenge started
4. All other fields editable
5. Submit updates to `/api/challenges`
6. If start date changed: updates all member startAt dates

#### Delete Challenge
1. From edit page or challenge menu
2. System confirms deletion
3. DELETE to `/api/challenges/delete/:id`
4. Deletes media from Cloudinary
5. Cascades delete to:
   - Member challenges
   - Posts
   - Checkins
   - Comments

---

## 3. VIEWING A CHALLENGE

### Overview
Challenge detail view has 4 main tabs: About, Program, Progress (Checkins), and Chat.

### Parent Layout
- **File**: [app/routes/challenges.v.$id.tsx](app/routes/challenges.v.$id.tsx)
- Loads challenge and membership data
- Renders header with challenge info
- Provides tab navigation
- Wraps content in MemberContextProvider

### Tab Navigation
- **File**: [app/components/challengeTabs.tsx](app/components/challengeTabs.tsx)
- Shows: About, Program, Progress, Chat
- Membership required to access Program, Progress, Chat
- For SELF_LED: adds cohortId to URLs

---

### 3.1 ABOUT TAB

**File**: [app/routes/challenges.v.$id.about.($cohortId).tsx](app/routes/challenges.v.$id.about.($cohortId).tsx)

#### Purpose
Shows challenge overview and join/leave functionality.

#### Key Components
- **ChallengeOverview**: Displays full challenge details
- **Join/Leave Button**: Toggle membership status
- **DialogJoin**: For SELF_LED challenges (set start date & notifications)
- **DialogConfirm**: Confirm leaving challenge
- **DialogShare**: Share challenge link

#### Content Displayed
- Challenge description
- Mission statement
- Start/end dates (SCHEDULED) or duration (SELF_LED)
- Frequency
- Member count
- Categories
- Creator info

#### User Actions
- **Join** (if not member):
  - SELF_LED: Opens modal to configure
  - SCHEDULED: Joins immediately
- **Leave** (if member): Confirms and removes membership
- **Share**: Copy link to clipboard

---

### 3.2 PROGRAM TAB

**File**: [app/routes/challenges.v.$id.program.tsx](app/routes/challenges.v.$id.program.tsx)

#### Purpose
Shows scheduled content/posts for the challenge timeline.

#### Data Loading
- Fetches from `/api/challenges/v/:id/program`
- **For SCHEDULED**: Posts filtered by publishAt date
- **For SELF_LED**: Posts filtered by publishOnDayNumber

#### Display
- Uses ChallengeSchedule component
- Shows posts in chronological order
- Each post displays:
  - Day number (SELF_LED) or date (SCHEDULED)
  - Title
  - Preview of body
  - Media thumbnails
- If no posts: Prompts creator to add content

#### Related API
**File**: [app/routes/api.challenges.v.$id.program.ts](app/routes/api.challenges.v.$id.program.ts)
- Loads published posts for challenge
- For SELF_LED: Only shows posts up to member's current day

---

### 3.3 PROGRESS TAB (CHECKINS)

**File**: [app/routes/challenges.v.$id.checkins.($cohortId).tsx](app/routes/challenges.v.$id.checkins.($cohortId).tsx)

#### Purpose
Displays user's progress and checkin history for the challenge.

#### Key Components
- **ProgressChart**: Circular progress indicator
- **CheckinsList**: Chronological list of checkins

#### Data Loading
- Fetches from `/api/checkins/:challengeId/:userId/:cohortId?`
- Only loads current user's checkins
- Groups by date

#### Content Displayed
1. **Progress Summary**:
   - Total checkins
   - Percentage complete
   - Current day number
   - Next checkin date

2. **Checkin History**:
   - Grouped by date
   - Shows for each checkin:
     - Timestamp
     - Text note
     - Photos/videos
     - Public/private status
     - Comment count
     - Like count

#### Related API
**File**: [app/routes/api.checkins.$challengeId.($userId).($cohortId).ts](app/routes/api.checkins.$challengeId.($userId).($cohortId).ts)
- Fetches checkins filtered by challenge, user, cohort

---

### 3.4 CHAT TAB

**File**: [app/routes/challenges.v.$id.chat.($cohortId).tsx](app/routes/challenges.v.$id.chat.($cohortId).tsx)

#### Purpose
Real-time chat feed combining posts, checkins, and comments for challenge members.

#### Data Loading (Loader: lines 41-183)
1. Requires membership
2. Loads challenge details
3. Fetches **posts** filtered by:
   - SCHEDULED: publishAt <= today
   - SELF_LED: publishOnDayNumber <= member's current day
4. Fetches **checkins** (non-empty ones)
5. Fetches **top-level comments**
6. Groups all content by date
7. Sorts chronologically

#### State Management
- `groupedData`: Content organized by date
- `featuredPostId`: Highlighted post from URL hash
- `dayCount`: Number of days to display (loads 5 at a time)
- `hasCheckedInToday`: Tracks daily checkin status

#### Key Features

**Mixed Content Feed**:
- Posts from creator
- Member checkins
- Comments/replies
- All grouped by date, sorted chronologically

**Auto-scroll**:
- Scrolls to bottom on load
- Keeps latest content visible

**Load More**:
- Shows previous 5 days at a time
- "Show previous days" button at top

**Daily Checkin Prompt**:
- DialogCheckin pops up if:
  - Haven't checked in today
  - Challenge is active (started, not expired)
- Can dismiss or complete checkin

**Chat Input**:
- FormChat component at bottom
- Auto-focuses for quick replies
- Supports text, images, videos

**Featured Post Dialog**:
- Opens specific post in modal
- Triggered by URL hash (#post-123)

#### Related Components
- **CheckinsList**: Renders grouped content
- **FormChat**: Comment input form
- **DialogCheckin**: Daily checkin modal

#### Real-time Updates
- Uses Pusher for live message broadcasting
- Channel: `challenge-{challengeId}-cohort-{cohortId}`
- Event: 'new-message'
- Auto-updates feed without refresh

#### Context Providers
- **ChatContextProvider**: Manages comments by date
- **MemberContext**: Provides challenge and membership data

---

## 4. POSTS

### Overview
Posts are content items that can be standalone or associated with challenges. They support text, images, videos, and embeds.

### Key Files

#### Views
- View Post: [app/routes/posts.$id.tsx](app/routes/posts.$id.tsx)
- Posts List: [app/routes/posts._index.tsx](app/routes/posts._index.tsx)
- Post Card: [app/components/cardPost.tsx](app/components/cardPost.tsx)

#### Create/Edit
- New Post: [app/routes/posts_.new.tsx](app/routes/posts_.new.tsx)
- Edit Post: [app/routes/posts.$id.edit.tsx](app/routes/posts.$id.edit.tsx)
- Form Component: [app/components/formPost.tsx](app/components/formPost.tsx)

### API Endpoints

#### Read Operations
- `GET /posts/:id` - View single post
  - Loads post with user, profile, counts (comments, likes)
  - Loads associated challenge and membership
  - Validates published status (unless creator/admin)

#### Write Operations
- `POST /api/posts` - Create or update post
  - Handles FormData with image/video upload
  - Sets publish timing based on challenge type
  - **For SCHEDULED**: Uses publishAt date
  - **For SELF_LED**: Uses publishOnDayNumber (1 to numDays)
  - Sends email notification if notifyMembers=true
  - Implementation: [app/routes/api.posts.ts:19-124](app/routes/api.posts.ts#L19-L124)

- `DELETE /api/posts/delete/:id` - Delete post
  - Deletes Cloudinary media first
  - Then deletes post record
  - Implementation: [app/routes/api.posts.delete.$id.ts:5-14](app/routes/api.posts.delete.$id.ts#L5-L14)

### Data Model: Post
```typescript
{
  id: number
  userId: number
  title: string
  body: string
  imageMeta?: CloudinaryMeta
  videoMeta?: CloudinaryMeta
  embed?: string  // For YouTube, etc.
  public: boolean
  challengeId?: number
  published: boolean
  publishAt?: Date  // For SCHEDULED challenges
  publishOnDayNumber?: number  // For SELF_LED challenges
  createdAt: Date
  updatedAt: Date
  notifyMembers?: boolean
  notificationSentOn: Date
  live?: boolean  // computed: published && (publishAt is past or null)
  _count?: {
    likes: number
    comments: number
  }
}
```

### User Flows

#### View Post
1. Navigate to `/posts/:id`
2. System validates access:
   - Published: Anyone can view (if public)
   - Unpublished: Only creator or admin
3. Displays CardPost with:
   - User info (avatar, name, timestamp)
   - Title (bold)
   - Body (with rendered links)
   - Images/videos
   - Embeds (YouTube, etc.)
4. Footer shows:
   - Comments count (opens drawer)
   - Like button with count
   - Share menu (if public)
   - Edit/delete (if creator)

#### Create Post

**Standalone Post**:
1. Navigate to `/posts/new`
2. Fill in form:
   - **Title** (required)
   - **Body** (required, min 10 chars)
   - **Image** (optional upload)
   - **Video** (optional - record or upload)
   - **Embed** (optional - YouTube URL)
3. Set publishing:
   - Publish immediately
   - Save as draft
   - Schedule for later
4. Email members checkbox (if not draft)
5. Click "Publish Now" or "Save Draft"
6. POST to `/api/posts`
7. Redirects to `/posts/:id`

**Challenge Post**:
1. Same as above, but challengeId is pre-set
2. **For SCHEDULED challenges**:
   - Select publish date (calendar picker)
   - Sets publishAt date
   - Can email members when published
3. **For SELF_LED challenges**:
   - Select day number (1 to challenge.numDays)
   - Sets publishOnDayNumber
   - Always saved as unpublished (visible based on member progress)
   - Button shows "Schedule" instead of "Publish"
4. Submit to `/api/posts`

#### Edit Post
1. From post view, click "edit" link
2. Or navigate to `/posts/:id/edit`
3. FormPost loads with existing data
4. All fields editable:
   - Title, body
   - Media (can replace)
   - Publish settings
5. POST to `/api/posts` with post.id
6. Updates post record
7. If switching to published: sends email notifications

#### Delete Post
1. From CardPost, click "delete" link
2. DialogDelete confirms action
3. DELETE to `/api/posts/delete/:id`
4. System deletes:
   - Cloudinary media (images/videos)
   - Post record
   - Associated comments (cascade)
5. Navigates back to:
   - Challenge page (if challenge post)
   - Challenges list (if standalone)

#### Comment on Post
1. Click comments icon in post footer
2. Opens ChatDrawer (slide-out panel)
3. Shows:
   - Post content at top
   - Existing comments (threaded)
   - FormComment at bottom
4. Enter comment:
   - Text (required)
   - Optional image/video
5. POST to `/api/comments` with postId
6. Creates Comment record
7. Updates post commentCount
8. Sends notification to post author
9. Real-time update via Pusher (if in chat)

---

## 5. CHECKINS

### Overview
Checkins are the core engagement feature - daily progress entries that members make to track their journey through a challenge. They support text notes, images, and videos.

### Key Files

#### API Routes
- Create/Update: [app/routes/api.challenges.$id.checkins.($cohortId).ts](app/routes/api.challenges.$id.checkins.($cohortId).ts)
- Fetch Checkins: [app/routes/api.checkins.$challengeId.($userId).($cohortId).ts](app/routes/api.checkins.$challengeId.($userId).($cohortId).ts)
- Delete: [app/routes/api.checkins.delete.$id.ts](app/routes/api.checkins.delete.$id.ts)

#### View Components
- Progress View: [app/routes/challenges.v.$id.checkins.($cohortId).tsx](app/routes/challenges.v.$id.checkins.($cohortId).tsx)
- Checkin List: [app/components/checkinsList.tsx](app/components/checkinsList.tsx)
- Challenge Member Checkin: [app/components/challengeMemberCheckin.tsx](app/components/challengeMemberCheckin.tsx)

#### Form Components
- FormCheckin: [app/components/formCheckin.tsx](app/components/formCheckin.tsx)
- CheckInButton: [app/components/checkinButton.tsx](app/components/checkinButton.tsx)
- DialogCheckin: [app/components/dialogCheckin.tsx](app/components/dialogCheckin.tsx)

#### Server Functions
- Model: [app/models/challenge.server.ts](app/models/challenge.server.ts)
  - `fetchCheckIns()` - Lines 672-720
  - `deleteCheckIn()` - Lines 723-740
  - `updateCheckin()` - Line 332-338

### API Endpoints

#### Create/Update Checkin
`POST /api/challenges/:id/checkins/:cohortId?` ([api.challenges.$id.checkins.($cohortId).ts:13-139](app/routes/api.challenges.$id.checkins.($cohortId).ts#L13-L139))

**Parameters**:
- body (string, optional) - Text note for the checkin
- userId (number, required) - User creating the checkin
- challengeId (number, required) - Challenge being checked into
- cohortId (number, optional) - For SELF_LED challenges
- checkinId (number, optional) - If updating existing checkin
- image (File | 'delete', optional) - Image upload or delete flag
- video (File | 'delete', optional) - Video upload or delete flag

**Process**:
1. Validates user authentication ([lines 16-21](app/routes/api.challenges.$id.checkins.($cohortId).ts#L16-L21))
2. Loads challenge and verifies it exists ([lines 28-35](app/routes/api.challenges.$id.checkins.($cohortId).ts#L28-L35))
3. Checks for existing membership ([lines 38-48](app/routes/api.challenges.$id.checkins.($cohortId).ts#L38-L48))
4. If creator and no membership: auto-joins challenge ([lines 49-55](app/routes/api.challenges.$id.checkins.($cohortId).ts#L49-L55))
5. Creates or updates checkin record ([lines 60-80](app/routes/api.challenges.$id.checkins.($cohortId).ts#L60-L80))
6. Updates membership's lastCheckIn and nextCheckIn ([lines 83-91](app/routes/api.challenges.$id.checkins.($cohortId).ts#L83-L91))
7. Handles image/video uploads via Cloudinary ([lines 92-97](app/routes/api.challenges.$id.checkins.($cohortId).ts#L92-L97))
8. Reloads and returns updated checkin with user data ([lines 99-131](app/routes/api.challenges.$id.checkins.($cohortId).ts#L99-L131))

**Returns**:
```typescript
{
  checkIn: CheckIn,
  memberChallenge: MemberChallenge
}
```

#### Fetch Checkins
`GET /api/checkins/:challengeId/:userId?/:cohortId?` ([api.checkins.$challengeId.($userId).($cohortId).ts:8-15](app/routes/api.checkins.$challengeId.($userId).($cohortId).ts#L8-L15))

**Parameters**:
- challengeId (number, required) - Filter by challenge
- userId (number, optional) - Filter by user
- cohortId (number, optional) - Filter by cohort

**Returns**: Array of CheckIn objects

#### Delete Checkin
`POST /api/checkins/delete/:id` ([api.checkins.delete.$id.ts:5-14](app/routes/api.checkins.delete.$id.ts#L5-L14))

**Process**:
1. Validates authentication
2. Deletes Cloudinary media (if exists)
3. Deletes checkin record
4. Returns success message

### Data Model: CheckIn

**Prisma Schema** ([schema.prisma:204-226](prisma/schema.prisma#L204-L226)):
```typescript
{
  id: number
  body: string | null
  imageMeta: CloudinaryMeta | null
  videoMeta: CloudinaryMeta | null
  data: Json | null
  userId: number
  challengeId: number
  cohortId: number | null
  memberChallengeId: number
  likeCount: number
  commentCount: number
  createdAt: Date
  updatedAt: Date

  // Relations
  challenge: Challenge
  memberChallenge: MemberChallenge
  user: User
  cohort?: Cohort
  likes: Like[]
  comments: Comment[]
}
```

**TypeScript Interface** ([utils/types.ts:224-243](app/utils/types.ts#L224-L243)):
```typescript
{
  id: number
  userId: number
  challengeId: number
  createdAt: Date | string
  updatedAt: Date | string
  data: JSONObject | JSONValue | null
  body: string
  imageMeta: CloudinaryMeta | null
  videoMeta: CloudinaryMeta | null
  challenge?: Challenge
  user?: User
  memberChallenge?: MemberChallenge
  _count?: {
    likes: number
  }
  likes?: Like[]
  likeCount: number
  commentCount: number
}
```

### User Flows

#### Daily Checkin (Chat Tab)
1. User navigates to challenge chat tab
2. System checks if user has checked in today
3. If not checked in AND challenge is active:
   - DialogCheckin auto-opens ([dialogCheckin.tsx:13-53](app/components/dialogCheckin.tsx#L13-L53))
   - Prompts: "You have not checked in today. Check in now?"
4. User clicks "Check In Now" button
5. Opens FormCheckin in dialog
6. User can:
   - Add optional text note
   - Upload image
   - Record/upload video
7. Clicks "Check In" button
8. POST to `/api/challenges/:id/checkins`
9. Dialog closes, feed updates with new checkin
10. Toast notification: "🎉 Woo hoo! Great job!"

#### Manual Checkin (via Button)
1. User clicks CheckInButton component
2. Button validates:
   - Challenge has started (not before startAt)
   - Challenge not expired (not after endAt)
   - Challenge not in DRAFT status
3. If valid: Opens DialogCheckIn modal
4. FormCheckin displays:
   - Text area for note (optional)
   - Image upload button
   - Video recorder/uploader
5. User fills form and submits
6. Creates checkin via API
7. Updates membership's lastCheckIn timestamp
8. Calculates and sets nextCheckIn based on frequency
9. Returns to calling view with success message

#### View Checkins (Progress Tab)
1. Navigate to `/challenges/v/:id/checkins/:cohortId?`
2. Loads user's checkins for this challenge
3. Displays:
   - **Progress Summary** (top):
     - Total checkins count
     - Percentage complete (checkins/numDays)
     - Current day number
     - Next checkin date
   - **Checkin History** (chronological list):
     - Grouped by date
     - Each shows:
       - Timestamp
       - Text note
       - Images/videos
       - Like button and count
       - Comment button and count
4. Can click on checkin to view details/comments
5. Can delete own checkins

#### Edit Checkin
1. From checkin display, click "edit"
2. FormCheckin loads with existing data:
   - Pre-filled body text
   - Existing image/video thumbnails
3. Can modify:
   - Text note
   - Replace or delete media
4. Submit updates
5. POST to `/api/challenges/:id/checkins` with checkinId
6. Updates existing record (doesn't create new)

#### Delete Checkin
1. From checkin view, click "delete"
2. Confirm deletion
3. POST to `/api/checkins/delete/:id`
4. System:
   - Deletes Cloudinary media (image/video)
   - Removes checkin record
   - Updates challenge member counts
5. Checkin removed from list

### Key Components

#### FormCheckin
**File**: [app/components/formCheckin.tsx](app/components/formCheckin.tsx)

**Props**:
```typescript
{
  checkIn?: CheckIn        // For editing existing
  afterCheckIn?: (checkIn: CheckIn) => void
  onCancel?: () => void
  challengeId: number      // Required
  cohortId?: number        // For SELF_LED
  saveLabel?: string       // Custom button text
}
```

**Features**:
- Optional text note (textarea with auto-resize)
- Image upload with preview and delete
- Video recording/upload with preview
- VideoChooser modal for record vs. upload
- Submit button disabled while:
  - Saving in progress
  - Video recorder active but no video saved
- Keyboard shortcut: Ctrl/Cmd + Enter to submit
- Success toast on completion
- Error handling with axios

**State Management**:
- body: Text content
- image/imageUrl: Image file and preview URL
- video/videoUrl: Video file and preview URL
- showVideoRecorder: Toggle video recording UI
- videoRecording: Recording in progress flag
- btnDisabled: Submit button state

#### CheckInButton
**File**: [app/components/checkinButton.tsx](app/components/checkinButton.tsx)

**Props**:
```typescript
{
  challenge: Challenge
  label?: string           // Default: "Check In"
  membership?: MemberChallenge
  afterCheckIn?: (checkIn: CheckIn) => void
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}
```

**Features**:
- Validates challenge state:
  - Shows "Not Started" if before startAt
  - Shows "Challenge Ended" if expired
  - Disabled for DRAFT challenges
- Opens FormCheckin in modal dialog
- Customizable size and styling
- Handles post-checkin callback

**Button States**:
- Active: Green background, clickable
- Not Started: Gray, disabled
- Expired: Gray, disabled with message
- Recording: Shows "Recording..." during video capture

#### DialogCheckin
**File**: [app/components/dialogCheckin.tsx](app/components/dialogCheckin.tsx)

**Purpose**: Auto-prompt for daily checkin

**Props**:
```typescript
{
  challenge: Challenge
  open?: boolean
  onClose?: () => void
  afterCheckIn?: (checkIn: CheckIn) => void
}
```

**Behavior**:
- Shows modal with prompt
- Contains CheckInButton for quick action
- Auto-closes after successful checkin
- Can be dismissed without checking in

### Integration with Challenges

#### Membership Updates
Every checkin updates the MemberChallenge record:
- **lastCheckIn**: Set to current timestamp
- **nextCheckIn**: Calculated based on challenge frequency:
  - DAILY: Next day
  - WEEKDAYS: Next weekday (skips weekends)
  - ALTERNATING: Every other day
  - WEEKLY: Same day next week
  - CUSTOM: Based on challenge-specific rules

Implementation: `calculateNextCheckin()` in [challenge.server.ts](app/models/challenge.server.ts)

#### Progress Tracking
Checkins contribute to:
- **Total checkins count**: _count.checkIns on MemberChallenge
- **Progress percentage**: (checkIns / challenge.numDays) * 100
- **Streak calculation**: Consecutive days with checkins
- **Engagement metrics**: For challenge leaderboards

#### Real-time Updates
When a checkin is created in challenge chat:
1. Broadcasts via Pusher to channel: `challenge-{challengeId}-cohort-{cohortId}`
2. Event: 'new-message'
3. Other users see the checkin appear immediately
4. No page refresh needed

### Business Rules

1. **Membership Required**: Must be a member of challenge to check in
   - Exception: Challenge creator auto-joins on first checkin

2. **One Checkin per Submission**: Each form submission creates one checkin
   - No daily limit (can check in multiple times per day)

3. **Media Optional**: All fields are optional
   - Can submit blank checkin (just timestamp)
   - Validation currently disabled (lines 84-88 in formCheckin.tsx)

4. **Cloudinary Integration**:
   - Images and videos uploaded to Cloudinary
   - Stored as JSON metadata (public_id, secure_url, etc.)
   - Automatically deleted when checkin deleted

5. **Cohort Scoping** (SELF_LED only):
   - Checkins associated with specific cohort
   - Only visible to members of same cohort
   - Enables separate conversations per start group

6. **Comments and Likes**:
   - Checkins support comments (threaded)
   - Can be liked by other members
   - Counts displayed in list view

### Validation and Security

**Server-side**:
- Validates user authentication
- Checks challenge membership
- Verifies challenge exists and is accessible
- Auto-joins creator if needed

**Client-side**:
- Button disabled for draft/expired/not-started challenges
- Form validation (currently minimal)
- File type validation for uploads
- Size limits enforced by Cloudinary

### Performance Considerations

**Fetching Checkins**:
- Uses indexes on [userId, challengeId] for fast queries
- Can filter by cohortId for SELF_LED efficiency
- Ordered by date (desc) for recent-first display

**Media Handling**:
- Uses memory upload handler for FormData
- Cloudinary handles optimization and CDN
- Lazy loading for images in list views

---

## 6. COMMENTS

### Overview
Comments can be added to posts, checkins, or challenges. They support nested replies up to 5 levels deep.

### Key Files
- API: [app/routes/api.comments.ts](app/routes/api.comments.ts)
- Form: [app/components/formComment.tsx](app/components/formComment.tsx)
- Display: [app/components/commentItem.tsx](app/components/commentItem.tsx)
- Container: [app/components/commentsContainer.tsx](app/components/commentsContainer.tsx)

### API Endpoints

#### Create/Update Comment
`POST /api/comments` ([api.comments.ts:19-181](app/routes/api.comments.ts#L19-L181))
- **Parameters**:
  - body (required)
  - postId, challengeId, checkInId (one required)
  - threadId (for challenge chat)
  - replyToId (for nested replies)
  - cohortId (for SELF_LED challenges)
  - imageMeta, videoMeta (optional)
- **Handles**:
  - FormData for media uploads
  - Nested replies (max 5 levels)
  - Real-time broadcast via Pusher
  - Email notifications for replies

#### Delete Comment
`POST /api/comments` with intent='delete'
- Deletes Cloudinary media
- Updates parent comment counts
- Cascade deletes not performed (soft delete)

### Data Model: Comment
```typescript
{
  id: number
  body: string
  imageMeta?: CloudinaryMeta
  videoMeta?: CloudinaryMeta
  userId: number
  challengeId?: number
  postId?: number
  threadId?: number  // For challenge chat
  checkInId?: number
  cohortId?: number
  replyToId?: number  // Parent comment
  threadDepth: number  // 0-5, max nesting
  likeCount: number
  replyCount: number
  createdAt: Date
  user?: User
  replies?: Comment[]  // Nested up to 5 levels
}
```

### User Flows

#### Add Comment
1. User viewing post/checkin/challenge
2. Clicks comment icon or opens chat
3. FormComment displays
4. Enters:
   - Text (required)
   - Optional image
   - Optional video
5. Submits form
6. POST to `/api/comments`
7. Creates Comment record
8. Broadcasts to Pusher channel
9. Updates parent item's comment count
10. Sends notification to author

#### Reply to Comment
1. Click "Reply" on existing comment
2. FormComment appears nested under comment
3. Enter reply text/media
4. Submit
5. POST to `/api/comments` with replyToId
6. Creates nested comment (threadDepth = parent + 1)
7. Updates parent's replyCount
8. Sends notification to comment author
9. Max nesting: 5 levels deep

#### View Comments
- Displayed in threaded view
- Indented based on threadDepth
- Shows:
  - User avatar and name
  - Comment body
  - Images/videos
  - Timestamp
  - Like button and count
  - Reply button
  - Edit/delete (if creator)
- Nested replies shown inline

#### Delete Comment
1. Click delete on comment
2. Confirm deletion
3. POST to `/api/comments` with intent='delete'
4. Deletes Cloudinary media
5. Removes comment record
6. Updates parent counts

---

## 7. SHARED FEATURES

### File Uploads
**Handler**: [app/utils/uploadFile.ts](app/utils/uploadFile.ts)
- All images and videos uploaded to Cloudinary
- Uses `memoryUploadHandler` for FormData parsing
- Automatic optimization and transformation
- Deletes old media when replacing

**CloudinaryMeta type**:
```typescript
{
  public_id: string
  version: number
  signature: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  bytes: number
  type: string
  url: string
  secure_url: string
}
```

### Real-time Updates (Pusher)
**Service**: [app/services/pusher.server.ts](app/services/pusher.server.ts)
- Used for live chat messages
- Channel naming: `challenge-{challengeId}-cohort-{cohortId}`
- Event: 'new-message'
- Triggered on:
  - New comments in chat
  - New checkins
  - New posts (in challenge context)

### Email Notifications (SendGrid)
**Service**: [app/utils/mailer.ts](app/utils/mailer.ts)
- **Welcome Email**: When joining challenge
- **Reply Notifications**: When someone replies to your comment
- **Post Notifications**: When creator posts to challenge (if notifyMembers=true)
- **Daily Reminders**: For challenge checkins (not yet implemented)

### Context Providers

#### MemberContext
**File**: [app/contexts/MemberContext.tsx](app/contexts/MemberContext.tsx)
- Provides:
  - `membership`: Current user's MemberChallenge
  - `challenge`: Challenge details
  - `checkIns`: User's checkin history
- Methods:
  - `refreshUserCheckIns()`: Reload checkins
  - `getUserCheckIns()`: Get cached checkins
- Used in all challenge detail views

#### CurrentUserContext
**File**: [app/contexts/CurrentUserContext.ts](app/contexts/CurrentUserContext.ts)
- Global user state
- Includes:
  - User profile
  - Preferences (locale, date format)
  - Role (ADMIN/USER)
- Accessible throughout app

#### DeviceContext
**File**: [app/contexts/DeviceContext.ts](app/contexts/DeviceContext.ts)
- Detects device type
- Properties:
  - `isMobileDevice`: Boolean
  - `isIphone`: Boolean
  - `isAndroid`: Boolean
- Method:
  - `isMobile()`: Returns true if mobile
- Used for responsive behavior

### Validation
**File**: [app/models/validators.server.ts](app/models/validators.server.ts)
- Server-side validation functions
- Returns errors object or undefined
- Common validators:
  - `validateEmail(email)`
  - `validatePassword(password)`
  - `validateName(name)`
  - `validateRequired(value, field)`

### Date/Time Handling
- Uses user's locale and format preferences
- Stored in CurrentUser: locale, dateFormat, timeFormat
- For SELF_LED challenges: Uses day numbers (1 to numDays)
- For SCHEDULED challenges: Uses actual dates

---

## ARCHITECTURAL PATTERNS

### Mobile-First Routing
- Mobile routes prefixed with `mobile.` (e.g., mobile.login.tsx)
- DeviceContext checks device type
- Desktop users redirected to standard routes
- Ensures optimized experience per device

### Challenge Type Handling
**SCHEDULED Challenges**:
- Fixed start and end dates
- All members on same timeline
- Posts published by date (publishAt)
- Automatically advances days

**SELF_LED Challenges**:
- User chooses start date
- Content based on day number (publishOnDayNumber)
- Cohort system groups users with similar schedules
- More flexible, self-paced

### Content Publishing Strategy
- **Draft Mode**: Visible only to creator
- **Scheduled**: Published at specific date/time
- **Published**: Immediately visible
- **Day-based** (SELF_LED): Visible when member reaches that day

### Data Fetching Patterns
1. **Server-side loaders**: Initial page data
2. **Client-side axios**: Mutations and updates
3. **Revalidator**: Refresh after mutations
4. **Pusher**: Real-time updates without polling

### Error Handling
- Server returns errors object
- Client displays errors inline
- Toast notifications for success messages
- Form-level validation before submission

### Authentication Flow
1. Cookie-based sessions (30-day expiry)
2. `requireCurrentUser()` middleware on protected routes
3. Redirects to login if not authenticated
4. Session persists across mobile/desktop

---

## DEVELOPMENT TIPS

### Working with Challenges
- Always check challenge.type before rendering date vs. day-number UI
- Use MemberContext to access current membership state
- Respect cohortId for SELF_LED challenges in all API calls

### Handling Posts
- Check `published` AND `publishAt`/`publishOnDayNumber` for visibility
- For SELF_LED: posts are always unpublished but visible based on member's dayNumber
- Remember to include challengeId in create/edit flows

### Comments and Replies
- Max threadDepth is 5 - disable reply button after that
- Always include appropriate parent ID (postId, challengeId, checkInId)
- For challenge chat: use threadId to group related comments

### Real-time Features
- Subscribe to Pusher channel on component mount
- Unsubscribe on unmount to prevent memory leaks
- Handle reconnection gracefully

### Testing Mobile Features
- Use DeviceContext to simulate mobile
- Test both iPhone and Android code paths
- Verify redirects work correctly

---

## COMMON GOTCHAS

1. **SELF_LED Challenge Posts**: Always unpublished, use publishOnDayNumber
2. **Cohort IDs**: Required for SELF_LED, omit for SCHEDULED
3. **Thread Depth**: Max 5 levels for comment nesting
4. **Media Cleanup**: Remember to delete Cloudinary assets when deleting posts/checkins
5. **Notification Time**: For SELF_LED, must set notificationHour and notificationMinute
6. **Date Handling**: SCHEDULED uses Date objects, SELF_LED uses day numbers
7. **Membership Check**: Some views require active membership, handle gracefully
8. **Device Detection**: Always use DeviceContext, not user agent parsing
9. **Checkin Creation**: Challenge creator auto-joins on first checkin if not already a member
10. **Checkin Endpoint**: Use `/api/challenges/:id/checkins` for create/update, not `/api/checkins`
11. **MemberChallenge Updates**: Every checkin updates lastCheckIn and nextCheckIn automatically
12. **Checkin Validation**: Currently minimal - all fields optional, can submit empty checkin

---

## NEXT STEPS FOR MOBILE DEVELOPMENT

When implementing the mobile client, focus on:

1. **Authentication**: Implement the login/signup/OAuth flows first
2. **Challenge List**: Build the browsing and discovery experience
3. **Challenge About**: Implement join/leave functionality
4. **Daily Checkin**: Core engagement feature
5. **Chat/Feed**: Real-time interaction and community
6. **Posts**: Content creation and consumption
7. **Progress Tracking**: Visualize user's journey

Ensure all features respect the SCHEDULED vs SELF_LED distinction and handle cohorts correctly.

---

## QUESTIONS?

For more details on any feature:
- Check the specific file references throughout this doc
- Review the linked components and API routes
- Look at existing web implementation for UI patterns
- Test flows in the web app to understand behavior

This documentation provides the foundation for building a full-featured mobile client that mirrors the web experience while optimizing for mobile UX.
