// ─────────────────────────────────────────────────────────────────────────────
// src/utils/firebase.ts
// Firebase initialization and Authentication client for FasalDost
// Direct synchronization with Cloud SQL PostgreSQL Database
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { apiClient } from '../shared/services/apiClient';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
/* CRITICAL: Must pass databaseId according to Firebase skill */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection on boot
(async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline check:', error);
    }
  }
})();

export type { User, ConfirmationResult };

// Sync user account directly to PostgreSQL Database and Firestore
export const syncUserToDatabase = async (
  user: User,
  additionalData?: { name?: string; phone?: string; province?: string; password?: string }
) => {
  try {
    const displayName = additionalData?.name || user.displayName || 'Farmer';
    const phone = additionalData?.phone || user.phoneNumber || '';
    const email = user.email || '';

    // 1. Sync to PostgreSQL Users & Farmer Profiles
    await apiClient.auth.syncUser({
      uid: user.uid,
      email: email || undefined,
      phone: phone || undefined,
      displayName: displayName || undefined,
      photoUrl: user.photoURL || undefined,
    });

    if (additionalData?.name || additionalData?.phone || additionalData?.province) {
      await apiClient.farmers.updateProfile(user.uid, {
        fullName: displayName,
        phoneNumber: phone,
        province: additionalData.province || 'Punjab',
      });
    }

    // 2. Sync to Firestore (Dual persistence)
    const userRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userRef);

    const payload: Record<string, any> = {
      uid: user.uid,
      name: displayName,
      phone: phone,
      email: email,
      updatedAt: new Date().toISOString(),
    };

    if (!existingSnap.exists()) {
      payload.createdAt = new Date().toISOString();
      payload.province = additionalData?.province || 'Punjab';
    }

    await setDoc(userRef, payload, { merge: true });
  } catch (e) {
    console.warn('[Firebase] Database user sync warning:', e);
  }
};

export const syncUserToFirestore = syncUserToDatabase;

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user) {
    await syncUserToDatabase(result.user);
  }
  return result.user;
};

// Sign up with Email & Password and send genuine Firebase verification email
export const signUpWithEmail = async (
  email: string,
  password: string,
  name?: string,
  phone?: string
): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (result.user) {
    if (name) {
      try {
        await updateProfile(result.user, { displayName: name });
      } catch (e) {
        console.warn('Update profile error:', e);
      }
    }
    // Send genuine email verification from Firebase to user's real email inbox
    try {
      await sendEmailVerification(result.user);
    } catch (e) {
      console.warn('Email verification send error:', e);
    }

    await syncUserToDatabase(result.user, { name, phone });
  }
  return result.user;
};

// Send / Resend genuine verification email to currently signed-in user
export const sendVerificationEmailToUser = async (user: User): Promise<void> => {
  await sendEmailVerification(user);
};

// Sign in with Email & Password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (result.user) {
    await syncUserToDatabase(result.user);
  }
  return result.user;
};

// Reset Password
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Sign out
export const logOutUser = async (): Promise<void> => {
  await fbSignOut(auth);
};

// Setup or reuse RecaptchaVerifier safely without duplicate element errors
export const getOrSetupRecaptcha = (containerId: string): RecaptchaVerifier => {
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.warn('Error clearing existing recaptcha verifier:', e);
    }
    (window as any).recaptchaVerifier = null;
  }

  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved automatically
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired');
    },
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
};

// Send Phone OTP via SMS
export const sendPhoneOtp = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  return await signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export { onAuthStateChanged };
