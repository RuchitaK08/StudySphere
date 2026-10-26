export type RoomCategory = 'Technology' | 'Exam prep' | 'Creative' | 'General';
export type RoomVibe = 'Quiet focus' | 'Study buddies' | 'Accountability';
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL?: string;
  dailyGoalMinutes: number;
  totalFocusMinutes: number;
  completedSessions: number;
  streakDays: number;
  lastStudyDate?: string;
  createdAt?: string;
  isDemo?: boolean;
}

export interface SharedTimerState {
  mode: TimerMode;
  durationMinutes: number;
  isRunning: boolean;
  startedAt: number | null; // epoch timestamp ms
  endsAt: number | null;    // epoch timestamp ms
  pausedRemainingSeconds: number;
  lastUpdatedBy?: string;
  lastUpdatedAt?: number;
}

export interface StudyRoom {
  id: string;
  name: string;
  code: string; // 6-character room code (e.g. 'DSA101')
  category: RoomCategory;
  vibe: RoomVibe;
  description: string;
  hostId: string;
  hostName: string;
  memberCount: number;
  timerState: SharedTimerState;
  createdAt: number;
  isDemo?: boolean;
}

export interface RoomMember {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: 'host' | 'member';
  joinedAt: number;
  isOnline: boolean;
  currentStatus?: string;
}

export interface RoomTask {
  id: string;
  roomId?: string;
  title: string;
  completed: boolean;
  createdBy: string;
  createdByName: string;
  completedBy?: string;
  completedByName?: string;
  createdAt: number;
  completedAt?: number;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  isSystem?: boolean;
  createdAt: number;
}

export interface StudyResource {
  id: string;
  name: string;
  title: string;
  category: string;
  description?: string;
  sizeBytes: number;
  formattedSize: string;
  mimeType: string;
  downloadURL: string;
  storagePath: string;
  uploaderId: string;
  uploaderName: string;
  roomId?: string | null;
  createdAt: number;
}

export interface StudySessionRecord {
  id: string;
  userId: string;
  userName: string;
  roomId?: string | null;
  roomName: string;
  minutes: number;
  mode: string;
  date: string; // YYYY-MM-DD
  completedAt: number;
  validatedByFunction?: boolean;
}

export type ActiveView = 
  | 'landing' 
  | 'dashboard' 
  | 'rooms' 
  | 'room-detail' 
  | 'resources' 
  | 'analytics' 
  | 'profile';
