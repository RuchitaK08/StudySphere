import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../config/firebase';
import type {
  StudyRoom,
  RoomMember,
  RoomTask,
  RoomMessage,
  StudyResource,
  StudySessionRecord,
  SharedTimerState,
  UserProfile
} from '../types';

// Starter demo rooms preserving the initial prototype vibe
const STARTER_ROOMS: StudyRoom[] = [
  {
    id: 'room-dsa',
    name: 'DSA & Algorithmic Problem Solving',
    code: 'DSA204',
    category: 'Technology',
    vibe: 'Quiet focus',
    description: 'Solve LeetCode & DSA problems, share logic, level up together.',
    hostId: 'host-maya',
    hostName: 'Maya Patel',
    memberCount: 18,
    createdAt: Date.now() - 3600000 * 24,
    timerState: {
      mode: 'focus',
      durationMinutes: 25,
      isRunning: false,
      startedAt: null,
      endsAt: null,
      pausedRemainingSeconds: 25 * 60
    }
  },
  {
    id: 'room-cloud',
    name: 'Cloud Computing & Distributed Systems',
    code: 'CLD401',
    category: 'Technology',
    vibe: 'Study buddies',
    description: 'Explore AWS, GCP, Firebase architectures, and microservices.',
    hostId: 'host-isha',
    hostName: 'Isha Sharma',
    memberCount: 12,
    createdAt: Date.now() - 3600000 * 18,
    timerState: {
      mode: 'focus',
      durationMinutes: 25,
      isRunning: false,
      startedAt: null,
      endsAt: null,
      pausedRemainingSeconds: 25 * 60
    }
  },
  {
    id: 'room-exam',
    name: 'University Semester Finals Corner',
    code: 'EXAM99',
    category: 'Exam prep',
    vibe: 'Accountability',
    description: 'A calm, supportive corner for syllabus revision and test prep.',
    hostId: 'host-aarav',
    hostName: 'Aarav Mehta',
    memberCount: 24,
    createdAt: Date.now() - 3600000 * 48,
    timerState: {
      mode: 'focus',
      durationMinutes: 25,
      isRunning: false,
      startedAt: null,
      endsAt: null,
      pausedRemainingSeconds: 25 * 60
    }
  },
  {
    id: 'room-silent',
    name: 'Deep Silent Work Club',
    code: 'SILENT',
    category: 'General',
    vibe: 'Quiet focus',
    description: 'Zero distractions, zero noise. Just your goals and steady progress.',
    hostId: 'host-noah',
    hostName: 'Noah Smith',
    memberCount: 31,
    createdAt: Date.now() - 3600000 * 12,
    timerState: {
      mode: 'focus',
      durationMinutes: 25,
      isRunning: false,
      startedAt: null,
      endsAt: null,
      pausedRemainingSeconds: 25 * 60
    }
  },
  {
    id: 'room-creative',
    name: 'Creative Studio & UI/UX Design',
    code: 'CRE888',
    category: 'Creative',
    vibe: 'Study buddies',
    description: 'Figma wireframing, frontend styling, sketching, and design systems.',
    hostId: 'host-zoya',
    hostName: 'Zoya Khan',
    memberCount: 9,
    createdAt: Date.now() - 3600000 * 8,
    timerState: {
      mode: 'focus',
      durationMinutes: 25,
      isRunning: false,
      startedAt: null,
      endsAt: null,
      pausedRemainingSeconds: 25 * 60
    }
  },
  {
    id: 'room-morning',
    name: 'Early Morning Momentum',
    code: 'AM0600',
    category: 'General',
    vibe: 'Accountability',
    description: 'Start the day before 7 AM with clear intention and positive energy.',
    hostId: 'host-riya',
    hostName: 'Riya Sen',
    memberCount: 15,
    createdAt: Date.now() - 3600000 * 72,
    timerState: {
      mode: 'focus',
      durationMinutes: 25,
      isRunning: false,
      startedAt: null,
      endsAt: null,
      pausedRemainingSeconds: 25 * 60
    }
  }
];

const LOCAL_STORAGE_PREFIX = 'studysphere_store_';

function getLocalStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {}
}

export const firestoreService = {
  // ================= ROOMS =================
  subscribeRooms(callback: (rooms: StudyRoom[]) => void): Unsubscribe {
    if (!db) {
      const initial = getLocalStore<StudyRoom[]>('rooms', STARTER_ROOMS);
      callback(initial);
      const listener = () => {
        callback(getLocalStore<StudyRoom[]>('rooms', STARTER_ROOMS));
      };
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    }

    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const fetched: StudyRoom[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<StudyRoom, 'id'>)
      }));
      callback(fetched);
    }, (error) => {
      console.warn('Firestore room sync error, falling back to local:', error);
      callback(getLocalStore<StudyRoom[]>('rooms', STARTER_ROOMS));
    });
  },

  async createRoom(data: {
    name: string;
    category: StudyRoom['category'];
    vibe: StudyRoom['vibe'];
    description: string;
    hostId: string;
    hostName: string;
  }): Promise<StudyRoom> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: Omit<StudyRoom, 'id'> = {
      name: data.name,
      code,
      category: data.category,
      vibe: data.vibe,
      description: data.description,
      hostId: data.hostId,
      hostName: data.hostName,
      memberCount: 1,
      createdAt: Date.now(),
      timerState: {
        mode: 'focus',
        durationMinutes: 25,
        isRunning: false,
        startedAt: null,
        endsAt: null,
        pausedRemainingSeconds: 25 * 60,
        lastUpdatedBy: data.hostName,
        lastUpdatedAt: Date.now()
      }
    };

    if (!db) {
      const current = getLocalStore<StudyRoom[]>('rooms', STARTER_ROOMS);
      const roomWithId: StudyRoom = {
        id: 'room-' + Date.now(),
        ...newRoom,
        isDemo: true
      };
      setLocalStore('rooms', [roomWithId, ...current]);
      return roomWithId;
    }

    const docRef = await addDoc(collection(db, 'rooms'), {
      ...newRoom,
      createdAt: serverTimestamp()
    });

    // Also add creator as initial member
    await setDoc(doc(db, 'rooms', docRef.id, 'members', data.hostId), {
      uid: data.hostId,
      displayName: data.hostName,
      role: 'host',
      joinedAt: serverTimestamp(),
      isOnline: true
    });

    return { id: docRef.id, ...newRoom };
  },

  subscribeRoom(roomId: string, callback: (room: StudyRoom | null) => void): Unsubscribe {
    if (!db) {
      const current = getLocalStore<StudyRoom[]>('rooms', STARTER_ROOMS);
      const room = current.find((r) => r.id === roomId) || null;
      callback(room);
      return () => {};
    }

    return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...(snap.data() as Omit<StudyRoom, 'id'>) });
      } else {
        callback(null);
      }
    });
  },

  async updateRoomTimer(roomId: string, timerState: SharedTimerState): Promise<void> {
    if (!db) {
      const current = getLocalStore<StudyRoom[]>('rooms', STARTER_ROOMS);
      const updated = current.map((r) => (r.id === roomId ? { ...r, timerState } : r));
      setLocalStore('rooms', updated);
      return;
    }

    await updateDoc(doc(db, 'rooms', roomId), {
      timerState: {
        ...timerState,
        lastUpdatedAt: Date.now()
      }
    });
  },

  // ================= ROOM MEMBERS =================
  subscribeRoomMembers(roomId: string, callback: (members: RoomMember[]) => void): Unsubscribe {
    if (!db) {
      const defaultMembers: RoomMember[] = [
        { uid: 'm-1', displayName: 'Maya Patel', role: 'host', joinedAt: Date.now() - 3600000, isOnline: true, currentStatus: 'Focusing 🧠' },
        { uid: 'm-2', displayName: 'Aarav Mehta', role: 'member', joinedAt: Date.now() - 1800000, isOnline: true, currentStatus: 'Coding 💻' },
        { uid: 'm-3', displayName: 'Isha Sharma', role: 'member', joinedAt: Date.now() - 600000, isOnline: true, currentStatus: 'Reviewing Notes 📚' }
      ];
      callback(defaultMembers);
      return () => {};
    }

    return onSnapshot(collection(db, 'rooms', roomId, 'members'), (snapshot) => {
      const members: RoomMember[] = snapshot.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<RoomMember, 'uid'>)
      }));
      callback(members);
    });
  },

  async joinRoom(roomId: string, user: UserProfile): Promise<void> {
    if (!db) return;
    await setDoc(doc(db, 'rooms', roomId, 'members', user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL || null,
      role: 'member',
      joinedAt: serverTimestamp(),
      isOnline: true,
      currentStatus: 'Ready to focus'
    });
  },

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'rooms', roomId, 'members', userId));
    } catch {}
  },

  // ================= COLLABORATIVE TASKS =================
  subscribeTasks(roomId: string, callback: (tasks: RoomTask[]) => void): Unsubscribe {
    if (!db) {
      const initial: RoomTask[] = getLocalStore<RoomTask[]>('tasks_' + roomId, [
        { id: 't1', roomId, title: 'Complete Topic 3 Practice Problems', completed: true, createdBy: 'u1', createdByName: 'Alex', createdAt: Date.now() - 2400000 },
        { id: 't2', roomId, title: 'Summarize Cloud Firestore WebSocket architecture', completed: false, createdBy: 'u2', createdByName: 'Maya', createdAt: Date.now() - 1800000 },
        { id: 't3', roomId, title: 'Review 25-minute Pomodoro study notes', completed: false, createdBy: 'u1', createdByName: 'Alex', createdAt: Date.now() - 900000 }
      ]);
      callback(initial);
      return () => {};
    }

    const q = query(collection(db, 'rooms', roomId, 'tasks'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const tasks: RoomTask[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RoomTask, 'id'>)
      }));
      callback(tasks);
    });
  },

  async addTask(roomId: string, title: string, user: UserProfile): Promise<void> {
    if (!db) {
      const current = getLocalStore<RoomTask[]>('tasks_' + roomId, []);
      const newTask: RoomTask = {
        id: 'task-' + Date.now(),
        roomId,
        title,
        completed: false,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: Date.now()
      };
      setLocalStore('tasks_' + roomId, [...current, newTask]);
      return;
    }

    await addDoc(collection(db, 'rooms', roomId, 'tasks'), {
      roomId,
      title,
      completed: false,
      createdBy: user.uid,
      createdByName: user.displayName,
      createdAt: serverTimestamp()
    });
  },

  async toggleTask(roomId: string, taskId: string, completed: boolean, user: UserProfile): Promise<void> {
    if (!db) {
      const current = getLocalStore<RoomTask[]>('tasks_' + roomId, []);
      const updated = current.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed,
              completedBy: completed ? user.uid : undefined,
              completedByName: completed ? user.displayName : undefined,
              completedAt: completed ? Date.now() : undefined
            }
          : t
      );
      setLocalStore('tasks_' + roomId, updated);
      return;
    }

    await updateDoc(doc(db, 'rooms', roomId, 'tasks', taskId), {
      completed,
      completedBy: completed ? user.uid : null,
      completedByName: completed ? user.displayName : null,
      completedAt: completed ? serverTimestamp() : null
    });
  },

  async deleteTask(roomId: string, taskId: string): Promise<void> {
    if (!db) {
      const current = getLocalStore<RoomTask[]>('tasks_' + roomId, []);
      setLocalStore('tasks_' + roomId, current.filter((t) => t.id !== taskId));
      return;
    }
    await deleteDoc(doc(db, 'rooms', roomId, 'tasks', taskId));
  },

  // ================= REAL-TIME CHAT =================
  subscribeMessages(roomId: string, callback: (messages: RoomMessage[]) => void): Unsubscribe {
    if (!db) {
      const initial: RoomMessage[] = getLocalStore<RoomMessage[]>('msgs_' + roomId, [
        { id: 'm1', roomId, senderId: 'host-maya', senderName: 'Maya Patel', text: 'Hey everyone! Welcome to the virtual room. Let’s do a 25m focus sprint!', createdAt: Date.now() - 1800000 },
        { id: 'm2', roomId, senderId: 'host-aarav', senderName: 'Aarav Mehta', text: 'Ready! Working on Distributed Systems notes.', createdAt: Date.now() - 1500000 },
        { id: 'm3', roomId, senderId: 'system', senderName: 'StudySphere Bot', text: '⏰ Shared Pomodoro Timer started: 25 minutes of Focus Time.', isSystem: true, createdAt: Date.now() - 1200000 }
      ]);
      callback(initial);
      return () => {};
    }

    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const msgs: RoomMessage[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RoomMessage, 'id'>)
      }));
      callback(msgs);
    });
  },

  async sendMessage(roomId: string, text: string, user: UserProfile): Promise<void> {
    if (!db) {
      const current = getLocalStore<RoomMessage[]>('msgs_' + roomId, []);
      const newMsg: RoomMessage = {
        id: 'msg-' + Date.now(),
        roomId,
        senderId: user.uid,
        senderName: user.displayName,
        senderAvatar: user.photoURL,
        text,
        createdAt: Date.now()
      };
      setLocalStore('msgs_' + roomId, [...current, newMsg]);
      return;
    }

    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      roomId,
      senderId: user.uid,
      senderName: user.displayName,
      senderAvatar: user.photoURL || null,
      text,
      createdAt: serverTimestamp()
    });
  },

  // ================= STUDY RESOURCES =================
  subscribeResources(callback: (resources: StudyResource[]) => void): Unsubscribe {
    if (!db) {
      const starterResources: StudyResource[] = getLocalStore<StudyResource[]>('resources', [
        {
          id: 'res-1',
          name: 'Cloud_Computing_Unit_4_Virtualization.pdf',
          title: 'Cloud Computing Architecture & Virtualization Notes',
          category: 'Technology',
          description: 'Comprehensive lecture summary on Hypervisors, IaaS, PaaS, SaaS, and Cloud Security.',
          sizeBytes: 2450000,
          formattedSize: '2.4 MB',
          mimeType: 'application/pdf',
          downloadURL: '#preview-pdf-demo',
          storagePath: 'resources/demo/Cloud_Computing_Unit_4.pdf',
          uploaderId: 'host-isha',
          uploaderName: 'Isha Sharma',
          createdAt: Date.now() - 3600000 * 20
        },
        {
          id: 'res-2',
          name: 'DSA_Cheatsheet_Dynamic_Programming.pdf',
          title: 'Dynamic Programming Patterns Cheatsheet',
          category: 'Technology',
          description: 'Knapsack, Longest Common Subsequence, and Tree DP patterns with C++ / Java snippets.',
          sizeBytes: 1850000,
          formattedSize: '1.8 MB',
          mimeType: 'application/pdf',
          downloadURL: '#preview-dsa-demo',
          storagePath: 'resources/demo/DSA_Cheatsheet.pdf',
          uploaderId: 'host-maya',
          uploaderName: 'Maya Patel',
          createdAt: Date.now() - 3600000 * 40
        },
        {
          id: 'res-3',
          name: 'Semester_Exams_Important_Questions.docx',
          title: 'Semester Final Exam Important Question Bank',
          category: 'Exam prep',
          description: 'Compiled previous 5-year questions for Database Management Systems and Cloud Architecture.',
          sizeBytes: 940000,
          formattedSize: '940 KB',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          downloadURL: '#preview-doc-demo',
          storagePath: 'resources/demo/Exam_Questions.docx',
          uploaderId: 'host-aarav',
          uploaderName: 'Aarav Mehta',
          createdAt: Date.now() - 3600000 * 60
        }
      ]);
      callback(starterResources);
      return () => {};
    }

    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list: StudyResource[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<StudyResource, 'id'>)
      }));
      callback(list);
    });
  },

  async createResourceRecord(resource: Omit<StudyResource, 'id'>): Promise<StudyResource> {
    if (!db) {
      const current = getLocalStore<StudyResource[]>('resources', []);
      const created: StudyResource = {
        id: 'res-' + Date.now(),
        ...resource
      };
      setLocalStore('resources', [created, ...current]);
      return created;
    }

    const docRef = await addDoc(collection(db, 'resources'), {
      ...resource,
      createdAt: serverTimestamp()
    });

    return { id: docRef.id, ...resource };
  },

  async deleteResourceRecord(resourceId: string): Promise<void> {
    if (!db) {
      const current = getLocalStore<StudyResource[]>('resources', []);
      setLocalStore('resources', current.filter((r) => r.id !== resourceId));
      return;
    }
    await deleteDoc(doc(db, 'resources', resourceId));
  },

  // ================= STUDY SESSIONS & ANALYTICS =================
  subscribeUserSessions(userId: string, callback: (sessions: StudySessionRecord[]) => void): Unsubscribe {
    if (!db) {
      const today = new Date().toISOString().split('T')[0];
      const initial: StudySessionRecord[] = getLocalStore<StudySessionRecord[]>('sessions_' + userId, [
        { id: 's1', userId, userName: 'Student', roomName: 'DSA & Coding', minutes: 25, mode: 'Focus time', date: today, completedAt: Date.now() - 7200000, validatedByFunction: true },
        { id: 's2', userId, userName: 'Student', roomName: 'Cloud Computing', minutes: 25, mode: 'Focus time', date: today, completedAt: Date.now() - 3600000, validatedByFunction: true },
        { id: 's3', userId, userName: 'Student', roomName: 'Deep Silent Work', minutes: 25, mode: 'Focus time', date: today, completedAt: Date.now() - 1200000, validatedByFunction: true }
      ]);
      callback(initial);
      return () => {};
    }

    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const list: StudySessionRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<StudySessionRecord, 'id'>)
      }));
      callback(list);
    }, (error) => {
      console.warn('Firestore session query notice (indexes or auth):', error);
    });
  },

  async recordSession(params: {
    user: UserProfile;
    minutes: number;
    mode: string;
    roomId?: string | null;
    roomName: string;
  }): Promise<StudySessionRecord> {
    const today = new Date().toISOString().split('T')[0];

    // Priority 1: If Firebase Functions is available, invoke serverless validation!
    if (functions) {
      try {
        const recordCallable = httpsCallable<unknown, { success: boolean; sessionId: string; message: string }>(
          functions,
          'recordFocusSession'
        );
        const result = await recordCallable({
          minutes: params.minutes,
          mode: params.mode,
          roomId: params.roomId || null,
          roomName: params.roomName,
          userName: params.user.displayName,
          clientStartedAt: Date.now() - params.minutes * 60 * 1000
        });

        return {
          id: result.data.sessionId,
          userId: params.user.uid,
          userName: params.user.displayName,
          roomId: params.roomId,
          roomName: params.roomName,
          minutes: params.minutes,
          mode: params.mode,
          date: today,
          completedAt: Date.now(),
          validatedByFunction: true
        };
      } catch (fnErr) {
        console.warn('Cloud Function invocation failed or offline, falling back to direct Firestore write:', fnErr);
      }
    }

    // Priority 2: Direct Firestore write if DB configured
    if (db) {
      const docRef = await addDoc(collection(db, 'studySessions'), {
        userId: params.user.uid,
        userName: params.user.displayName,
        roomId: params.roomId || null,
        roomName: params.roomName,
        minutes: params.minutes,
        mode: params.mode,
        date: today,
        completedAt: serverTimestamp(),
        validatedByFunction: false
      });

      return {
        id: docRef.id,
        userId: params.user.uid,
        userName: params.user.displayName,
        roomId: params.roomId,
        roomName: params.roomName,
        minutes: params.minutes,
        mode: params.mode,
        date: today,
        completedAt: Date.now(),
        validatedByFunction: false
      };
    }

    // Priority 3: Demo Local Mode
    const sessionRecord: StudySessionRecord = {
      id: 'sess-' + Date.now(),
      userId: params.user.uid,
      userName: params.user.displayName,
      roomId: params.roomId,
      roomName: params.roomName,
      minutes: params.minutes,
      mode: params.mode,
      date: today,
      completedAt: Date.now(),
      validatedByFunction: false
    };

    const existing = getLocalStore<StudySessionRecord[]>('sessions_' + params.user.uid, []);
    setLocalStore('sessions_' + params.user.uid, [sessionRecord, ...existing]);

    return sessionRecord;
  }
};
