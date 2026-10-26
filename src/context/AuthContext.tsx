import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile } from '../types';
import { authService, getStoredDemoUser, saveDemoUser } from '../services/authService';
import { isFirebaseConfigured, db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  demoSignIn: (name?: string, email?: string) => void;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateGoal: (minutes: number) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If not configured, load stored demo user or auto-login default demo student
    if (!isFirebaseConfigured) {
      const stored = getStoredDemoUser();
      if (stored) {
        setUser(stored);
      } else {
        const defaultStudent = authService.demoSignIn('Alex Chen', 'alex.student@studysphere.internal');
        setUser(defaultStudent);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = authService.subscribeToAuth((profile) => {
      setUser(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const profile = await authService.signIn(email, pass);
    setUser(profile);
  };

  const signUp = async (email: string, pass: string, displayName: string) => {
    const profile = await authService.signUp(email, pass, displayName);
    setUser(profile);
  };

  const signInWithGoogle = async () => {
    const profile = await authService.signInWithGoogle();
    setUser(profile);
  };

  const demoSignIn = (name = 'Alex Chen', email = 'alex.student@university.edu') => {
    const profile = authService.demoSignIn(name, email);
    setUser(profile);
  };

  const logOut = async () => {
    await authService.logOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const updateGoal = async (minutes: number) => {
    if (!user) return;
    const updated = { ...user, dailyGoalMinutes: minutes };
    setUser(updated);

    if (user.isDemo || !isFirebaseConfigured || !db) {
      saveDemoUser(updated);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        dailyGoalMinutes: minutes
      });
    } catch (err) {
      console.warn('Failed to update goal in Firestore:', err);
    }
  };

  const updateProfileName = async (displayName: string) => {
    if (!user) return;
    const updated = { ...user, displayName };
    setUser(updated);

    if (user.isDemo || !isFirebaseConfigured || !db) {
      saveDemoUser(updated);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName
      });
    } catch (err) {
      console.warn('Failed to update name in Firestore:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConnected: isFirebaseConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        demoSignIn,
        logOut,
        resetPassword,
        updateGoal,
        updateProfileName
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
