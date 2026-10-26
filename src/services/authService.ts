import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth, googleProvider, db } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile } from '../types';

const DEMO_STORAGE_KEY = 'studysphere_demo_user';

// Fallback demo user management for testing and offline presentation
export function getStoredDemoUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDemoUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  }
}

export const authService = {
  // Sign up with Email and Password
  async signUp(email: string, pass: string, displayName: string): Promise<UserProfile> {
    if (!auth) {
      // Fallback demo mode
      const demoUser: UserProfile = {
        uid: 'demo-' + Date.now(),
        email,
        displayName: displayName || email.split('@')[0],
        dailyGoalMinutes: 120,
        totalFocusMinutes: 0,
        completedSessions: 0,
        streakDays: 1,
        isDemo: true
      };
      saveDemoUser(demoUser);
      return demoUser;
    }

    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName });

    const profile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: displayName || cred.user.email?.split('@')[0] || 'Student',
      photoURL: cred.user.photoURL || undefined,
      dailyGoalMinutes: 120,
      totalFocusMinutes: 0,
      completedSessions: 0,
      streakDays: 1,
      createdAt: new Date().toISOString()
    };

    if (db) {
      try {
        await setDoc(doc(db, 'users', cred.user.uid), {
          ...profile,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Could not save user profile to Firestore:', err);
      }
    }

    return profile;
  },

  // Sign in with Email and Password
  async signIn(email: string, pass: string): Promise<UserProfile> {
    if (!auth) {
      const demoUser: UserProfile = {
        uid: 'demo-user-1',
        email,
        displayName: email.split('@')[0] || 'Student Explorer',
        dailyGoalMinutes: 120,
        totalFocusMinutes: 45,
        completedSessions: 2,
        streakDays: 3,
        isDemo: true
      };
      saveDemoUser(demoUser);
      return demoUser;
    }

    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return await this.fetchOrCreateProfile(cred.user);
  },

  // Google Sign-In Popup
  async signInWithGoogle(): Promise<UserProfile> {
    if (!auth || !googleProvider) {
      const demoUser: UserProfile = {
        uid: 'demo-google-user',
        email: 'alex.student@gmail.com',
        displayName: 'Alex Chen',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        dailyGoalMinutes: 120,
        totalFocusMinutes: 90,
        completedSessions: 3,
        streakDays: 4,
        isDemo: true
      };
      saveDemoUser(demoUser);
      return demoUser;
    }

    const cred = await signInWithPopup(auth, googleProvider);
    return await this.fetchOrCreateProfile(cred.user);
  },

  // Demo one-click sign in (for evaluation / presentation)
  demoSignIn(name = 'Alex Chen', email = 'alex.chen@university.edu'): UserProfile {
    const demoUser: UserProfile = {
      uid: 'demo-alex',
      email,
      displayName: name,
      dailyGoalMinutes: 120,
      totalFocusMinutes: 75,
      completedSessions: 3,
      streakDays: 4,
      isDemo: true
    };
    saveDemoUser(demoUser);
    return demoUser;
  },

  // Password reset email
  async resetPassword(email: string): Promise<void> {
    if (!auth) {
      console.log('Demo mode password reset simulated for:', email);
      return;
    }
    await sendPasswordResetEmail(auth, email);
  },

  // Sign out
  async logOut(): Promise<void> {
    saveDemoUser(null);
    if (auth) {
      await signOut(auth);
    }
  },

  // Fetch or initialize Firestore user profile
  async fetchOrCreateProfile(user: User): Promise<UserProfile> {
    let profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Student',
      photoURL: user.photoURL || undefined,
      dailyGoalMinutes: 120,
      totalFocusMinutes: 0,
      completedSessions: 0,
      streakDays: 1
    };

    if (db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          profile = { ...profile, ...(userDoc.data() as Partial<UserProfile>) };
        } else {
          await setDoc(doc(db, 'users', user.uid), {
            ...profile,
            createdAt: serverTimestamp()
          });
        }
      } catch (err) {
        console.warn('Firestore user fetch failed, using auth profile:', err);
      }
    }

    return profile;
  },

  // Subscribe to Firebase Auth state
  subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
    if (!auth) {
      const demo = getStoredDemoUser();
      callback(demo);
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await this.fetchOrCreateProfile(firebaseUser);
        callback(profile);
      } else {
        const demo = getStoredDemoUser();
        callback(demo);
      }
    });
  }
};
