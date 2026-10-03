// ─────────────────────────────────────────────────────────────────────────────
// server/core/firebase-admin.ts
// Shared Firebase Admin SDK for Cross-Platform Auth (Web, Android, iOS)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
