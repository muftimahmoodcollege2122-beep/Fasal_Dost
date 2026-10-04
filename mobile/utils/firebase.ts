// Firebase (React Native) — same project/config as the web app, AsyncStorage persistence.
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  // @ts-ignore - exported from the react-native build of firebase/auth
  getReactNativePersistence,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  ConfirmationResult,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from '../firebase-applet-config.json';
import { apiClient } from '../shared/apiClient';

const isNew = !getApps().length;
const app = isNew ? initializeApp(firebaseConfig) : getApp();

export const auth = isNew
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export type { User, ConfirmationResult };

export const syncUserToDatabase = async (
  user: User,
  additionalData?: { name?: string; phone?: string; province?: string; password?: string }
) => {
  try {
    const displayName = additionalData?.name || user.displayName || 'Farmer';
    const phone = additionalData?.phone || user.phoneNumber || '';
    const email = user.email || '';

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

    const userRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userRef);
    const payload: Record<string, any> = {
      uid: user.uid,
      name: displayName,
      phone,
      email,
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

export const signUpWithEmail = async (email: string, password: string, name?: string, phone?: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (result.user) {
    if (name) {
      try { await updateProfile(result.user, { displayName: name }); } catch (e) { console.warn('Update profile error:', e); }
    }
    try { await sendEmailVerification(result.user); } catch (e) { console.warn('Email verification send error:', e); }
    await syncUserToDatabase(result.user, { name, phone });
  }
  return result.user;
};

export const sendVerificationEmailToUser = async (user: User): Promise<void> => { await sendEmailVerification(user); };

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (result.user) await syncUserToDatabase(result.user);
  return result.user;
};

export const resetPassword = async (email: string): Promise<void> => { await sendPasswordResetEmail(auth, email); };
export const logOutUser = async (): Promise<void> => { await fbSignOut(auth); };

// Google popup and web reCAPTCHA phone-OTP are browser-only flows.
export const signInWithGoogle = async (): Promise<User> => {
  throw new Error('Google sign-in is not available in the mobile app yet. Please use email.');
};
export const getOrSetupRecaptcha = (_containerId: string): any => ({ clear() {} });
export const sendPhoneOtp = async (): Promise<ConfirmationResult> => {
  throw new Error('Phone OTP is not available in the mobile app yet. Please use email.');
};

export { onAuthStateChanged };
