// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';

// Firebase configuration loaded from environment variables
// Use a `.env` file with `REACT_APP_`-prefixed variables for CRA
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY as string,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.REACT_APP_FIREBASE_APP_ID as string,
  // Optional; only needed if using Analytics
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID as string | undefined,
};

// Basic runtime validation to help catch missing env vars early in development
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(`Missing Firebase env vars: ${missingEnvVars.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app, analytics };
