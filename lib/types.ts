// JSON types for db
export type JSONValue = string | number | boolean | Date | JSONObject | JSONArray;

export interface JSONObject extends Record<string, JSONValue> {}
export interface JSONArray extends Array<JSONValue> {}

export interface User {
  id?: number | string;
  email: string;
  profile: Profile | null;
  lastLogin: Date | null;
  memberChallenges?: MemberChallenge[];
  challenges?: Challenge[] | ChallengeSummary[];
  notes?: Note[];
  posts?: Post[];
}
export interface CurrentUser extends User {
  profile: Profile;
  id: number;
  role: 'ADMIN' | 'USER';
  // the four below are added in root loader, not currently in the db
  locale?: string;
  dateFormat?: string;
  timeFormat?: string;
  dateTimeFormat?: string;
}

export interface Note {
  id?: number;
  userId?: number;
  body: string | null;
  imageMeta?: CloudinaryMeta;
  videoMeta?: CloudinaryMeta;
  challengeId?: number;
  challenge?: Challenge;
  postId?: number;
  post?: Post;
  replyToId?: number;
  replyTo?: Note;
  commentId?: number;
  isShare?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  user?: User;
  _count?: any;
}
export interface NoteSummary extends Note {
  _count: {
    likes: number;
    replies?: number;
  };
}

export interface Thread {
  id?: number;
  userId?: number;
  user?: User | CurrentUser;
  title: string | null;
  body: string | null;
  imageMeta: CloudinaryMeta;
  videoMeta: CloudinaryMeta;
  challengeId: number;
  challenge?: Challenge;
  likeCount?: number;
  commentCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface ThreadSummary extends Thread {
  _count?: {
    likes: number;
    comments: number;
  };
}

export interface Post {
  id: number;
  userId: number;
  title: string | null;
  body: string | null;
  imageMeta?: CloudinaryMeta;
  videoMeta?: CloudinaryMeta;
  embed?: string | null;
  public: boolean;
  challengeId?: number | null;
  published: boolean;
  publishAt?: Date | null;
  publishOnDayNumber?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  challenge?: Challenge;
  commentCount: number;
  likeCount: number;
  user: User;
  notifyMembers?: boolean | null;
  notificationSentOn: Date | null;
  live?: boolean; // computed field @see prisma.server
}
export interface PostSummary extends Post {
  likeCount: number;
  commentCount: number;
  _count?: CountType;
}

export type ChallengeType = 'SCHEDULED' | 'SELF_LED';
export type ChallengeStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
export interface Challenge {
  id: number | undefined;
  name: string | null | undefined;
  description: string | null | undefined;
  mission: string | null | undefined;
  startAt?: Date | null;
  endAt?: Date | null;
  numDays?: number | null;
  type: ChallengeType;
  status: ChallengeStatus;
  frequency: 'DAILY' | 'WEEKDAYS' | 'ALTERNATING' | 'WEEKLY' | 'CUSTOM';
  coverPhotoMeta: CloudinaryMeta | null;
  videoMeta: CloudinaryMeta | null;
  icon: string | null | undefined;
  color: string | null | undefined;
  user?: User;
  categories: Category[];
  reminders: boolean;
  syncCalendar: boolean;
  publishAt: Date | null;
  published: boolean;
  public: boolean;
  userId: number;
  likeCount: number;
  commentCount: number;
  _count?: CountType;
}
export interface ChallengeWithHost extends Challenge {
  user: User;
}
export interface ChallengeInputs extends Challenge {
  deleteImage: boolean;
}

export interface Cohort {
  cohortId: number;
  challengeId: number;
  challenge: Challenge;
  dayNumber: number;
  startAt: Date;
  members: MemberChallenge[];
}

export interface Category {
  id: number;
  name?: string;
}
export interface ChallengeCategory {
  category: Category;
}

interface CountType {
  members?: number;
  likes?: number;
  comments?: number;
}
export interface ChallengeSummary extends Challenge {
  _count: {
    members: number;
    likes: number;
    comments: number;
  };
  isMember?: boolean;
  members?: {
    userId: number;
  }[];
}

export interface MemberChallenge {
  id: number;
  userId: number;
  challengeId: number;
  cohortId?: number;
  cohort?: Cohort;
  user: User;
  challenge: Challenge | ChallengeSummary;
  lastCheckIn: Date | null;
  nextCheckIn: Date | null;
  dayNumber: number;
  notificationHour?: number | null;
  notificationMinute?: number | null;
  startAt: Date | null;
  _count?: {
    checkIns?: number;
  };
  createdAt: Date;
}
export interface Like {
  id: number;
  userId: number;
  postId: number;
  threadId: number;
  thread?: Thread;
  challengeId: number;
  challenge?: Challenge | ChallengeSummary;
  commentId: number;
  comment?: Comment;
  noteId: number;
  note?: Note;
  checkInId: number;
  checkIn?: CheckIn;
  createdAt: Date;
}
export interface GroupedLikes {
  post: number[];
  comment: number[];
  thread: number[];
  challenge: number[];
  checkin: number[];
}

export interface CheckIn {
  id: number;
  userId: number;
  challengeId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  data: JSONObject | JSONValue | null;
  body: string;
  imageMeta: CloudinaryMeta | null;
  videoMeta: CloudinaryMeta | null;
  challenge?: Challenge;
  user?: User;
  memberChallenge?: MemberChallenge;
  _count?: {
    likes: number;
  };
  likes?: Like[];
  likeCount: number;
  commentCount: number;
}

export interface Profile {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  profileImage: string | null;
}

export interface RegisterForm {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  redirectTo?: string;
}
export interface LoginForm {
  email: string;
  password: string;
  request: Request;
}
export interface CloudinaryMeta extends JSONObject {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
}
export interface Comment {
  id: number | string;
  body: string;
  imageMeta?: CloudinaryMeta;
  videoMeta?: CloudinaryMeta;
  userId: number;
  challengeId: number;
  challenge?: Challenge | ChallengeSummary;
  postId: number;
  post?: Post | PostSummary;
  threadId: number;
  thread?: Thread | ThreadSummary;
  checkInId: number;
  checkIn?: CheckIn;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  replies?: Comment[];
  replyToId?: number;
  replyTo?: Comment;
  threadDepth?: number;
}

export interface ErrorObject extends Record<string, { _errors: string[] }> {}

// generic interface that handles responses from server loading a single object
export interface ObjectData {
  errors?: ErrorObject;
  formData?: Record<string, number | boolean | Date | null | undefined> | undefined;
  object?: Record<string, number | boolean | Date | null | undefined> | undefined;
  [key: string]:
    | null
    | number
    | boolean
    | Date
    | ErrorObject
    | Record<string, number | boolean | Date | null | undefined>
    | undefined;
}
