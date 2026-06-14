// src/services/authService.ts
import { auth } from '../firebase'; // Assuming auth is exported from firebase.ts
import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged, // Keep if you plan to use it directly here or in an AuthProvider
  User as FirebaseUser,
} from 'firebase/auth';

/**
 * Signs in the user with a custom token obtained from a backend (e.g., after Teams auth).
 * @param customToken - The Firebase custom token.
 */
export const signInWithFirebaseCustomToken = async (customToken: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithCustomToken(auth, customToken);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase custom token sign-in failed:', error);
    throw error;
  }
};

/**
 * Example function to exchange a Teams token for a Firebase custom token via your backend.
 * This is a placeholder and needs to be implemented with your actual backend endpoint.
 * @param teamsToken - The token obtained from Microsoft Teams.
 * @returns A promise that resolves to the Firebase custom token.
 */
export const exchangeTeamsTokenForFirebaseToken = async (teamsToken: string): Promise<string> => {
  // IMPORTANT: Replace 'YOUR_BACKEND_ENDPOINT/exchange-teams-token' with your actual backend URL
  const response = await fetch('YOUR_BACKEND_ENDPOINT/exchange-teams-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include Authorization header if your backend requires it for this endpoint
      // 'Authorization': `Bearer ${teamsToken}` // Or however your backend expects it
    },
    body: JSON.stringify({ token: teamsToken }), // Send the Teams token in the request body
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to exchange Teams token. Status:', response.status, 'Body:', errorBody);
    throw new Error('Failed to exchange Teams token with backend.');
  }

  const { customToken } = await response.json();
  if (!customToken) {
    throw new Error('Custom token not received from backend.');
  }
  return customToken;
};

/**
 * Signs in the user using a Microsoft Teams token.
 * It first exchanges the Teams token for a Firebase custom token via a backend service,
 * then uses that custom token to sign into Firebase.
 * @param teamsToken - The token obtained from Microsoft Teams.
 */
export const signInWithTeams = async (teamsToken: string): Promise<FirebaseUser> => {
  try {
    const firebaseCustomToken = await exchangeTeamsTokenForFirebaseToken(teamsToken);
    const firebaseUser = await signInWithFirebaseCustomToken(firebaseCustomToken);
    console.log('Successfully signed in with Teams token, Firebase User:', firebaseUser.uid);
    return firebaseUser;
  } catch (error) {
    console.error('Full Teams sign-in process failed:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * Signs out the current Firebase user.
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    console.log('User signed out successfully.');
  } catch (error) {
    console.error('Error signing out from Firebase:', error);
    throw error;
  }
};

/**
 * Attaches an observer for changes to the user's sign-in state.
 * @param callback - Function to call when the auth state changes, receiving the FirebaseUser or null.
 * @returns A function to unsubscribe the observer.
 */
export const onAuthUserChanged = (callback: (user: FirebaseUser | null) => void): (() => void) => {
    return onAuthStateChanged(auth, callback);
};
