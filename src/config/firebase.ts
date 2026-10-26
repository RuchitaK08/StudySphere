import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes('YourFirebase') &&
  !firebaseConfig.apiKey.includes('YOUR_API_KEY') &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('your-project-id') &&
  !firebaseConfig.projectId.includes('YOUR_PROJECT_ID')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    googleProvider = new GoogleAuthProvider();
    console.log('✅ StudySphere: Firebase Cloud Services initialized successfully.');
  } catch (error) {
    console.warn('⚠️ StudySphere: Firebase initialization error, switching to interactive demo mode:', error);
  }
} else {
  console.info('ℹ️ StudySphere: Running in local interactive demo mode. To connect real Firebase Cloud Services, copy .env.example to .env and insert your project credentials.');
}

export { app, auth, db, storage, functions, googleProvider };

export interface CloudStatusReport {
  isConfigured: boolean;
  projectId: string;
  authStatus: 'connected' | 'demo';
  firestoreStatus: 'connected' | 'demo';
  storageStatus: 'connected' | 'demo';
  functionsStatus: 'connected' | 'demo';
}

export function getCloudStatusReport(): CloudStatusReport {
  return {
    isConfigured: isFirebaseConfigured,
    projectId: isFirebaseConfigured ? firebaseConfig.projectId : 'demo-local-studysphere',
    authStatus: auth ? 'connected' : 'demo',
    firestoreStatus: db ? 'connected' : 'demo',
    storageStatus: storage ? 'connected' : 'demo',
    functionsStatus: functions ? 'connected' : 'demo'
  };
}
