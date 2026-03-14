// ─────────────────────────────────────────────────────────────────────────────
// src/utils/firebase.js
//
// PURPOSE:
//   Initializes the Firebase app and exports the Firestore database instance.
//   This file is imported by store.js to perform all cloud database operations.
//
// SETUP INSTRUCTIONS:
//   1. Go to https://console.firebase.google.com
//   2. Create a new project named "FasalDost"
//   3. Click "Add App" → choose Web (</>)
//   4. Copy the firebaseConfig object and paste it below
//   5. In Firebase Console → Firestore → Create Database → Start in test mode
//
// DATABASE STRUCTURE:
//   /farmers/{farmerId}       — One document per farmer (profile data)
//   /scans/{scanId}           — One document per scan (disease detection result)
//
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore }           from 'firebase/firestore';

// ── Your Firebase project config ─────────────────────────────────────────────
// ⚠️  REPLACE ALL VALUES BELOW WITH YOUR OWN FROM FIREBASE CONSOLE
// ⚠️  NEVER share this file publicly or push to GitHub
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzVpHlQMV4TQNdQPC5LLVLwTY8ELXyqJc",
  authDomain: "fasaldost-f0e89.firebaseapp.com",
  projectId: "fasaldost-f0e89",
  storageBucket: "fasaldost-f0e89.firebasestorage.app",
  messagingSenderId: "1055596769924",
  appId: "1:1055596769924:web:c5308944a161d7037b88d1",
  measurementId: "G-XZKGPCZPDS"
};
// ── Initialize Firebase only once (prevents duplicate app error on hot reload) ─
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// ── Export Firestore database instance ───────────────────────────────────────
// Used by store.js for all read/write operations
export const db = getFirestore(app);
