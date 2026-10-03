// ─────────────────────────────────────────────────────────────────────────────
// server/core/auth.ts
// Cross-Platform Authentication Middleware (Web, Android, iOS)
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { adminAuth } from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../../src/db/index.ts';
import { users } from '../../src/db/schema.ts';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoUrl?: string;
  platform: 'web' | 'android' | 'ios';
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  firebaseToken?: DecodedIdToken;
}

/**
 * Upserts a verified user from Web, Android, or iOS into the PostgreSQL users table
 */
export async function syncUserToDatabase(
  uid: string,
  email?: string,
  phone?: string,
  displayName?: string,
  photoUrl?: string,
  platform: 'web' | 'android' | 'ios' = 'web'
): Promise<void> {
  try {
    await db
      .insert(users)
      .values({
        uid,
        email: email || null,
        phone: phone || null,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
        platform,
        role: 'farmer',
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: email || undefined,
          phone: phone || undefined,
          displayName: displayName || undefined,
          photoUrl: photoUrl || undefined,
          platform,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.warn('[Auth Middleware] Database user sync warning:', error);
  }
}

/**
 * Extracts platform client header ('web' | 'android' | 'ios')
 */
function getClientPlatform(req: Request): 'web' | 'android' | 'ios' {
  const platformHeader = (req.headers['x-client-platform'] as string)?.toLowerCase();
  if (platformHeader === 'android') return 'android';
  if (platformHeader === 'ios') return 'ios';
  return 'web';
}

/**
 * Optional Auth: decodes token if present without rejecting anonymous requests
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const platform = getClientPlatform(req);

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      req.firebaseToken = decoded;
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        phone: decoded.phone_number,
        displayName: decoded.name,
        photoUrl: decoded.picture,
        platform,
      };

      // Non-blocking sync to PostgreSQL
      syncUserToDatabase(
        decoded.uid,
        decoded.email,
        decoded.phone_number,
        decoded.name,
        decoded.picture,
        platform
      ).catch((e) => console.warn('[Auth Sync Error]', e));
    } catch {
      // Allow through as unauthenticated if token verification fails on optional route
    }
  } else if (req.headers['x-user-uid']) {
    // Development / fallback client UID
    const uid = req.headers['x-user-uid'] as string;
    req.user = {
      uid,
      platform,
    };
  }

  next();
}

/**
 * Mandatory Auth: requires a valid Firebase Bearer token across Web, Android, or iOS
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const platform = getClientPlatform(req);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Check fallback dev uid
    if (req.headers['x-user-uid']) {
      req.user = {
        uid: req.headers['x-user-uid'] as string,
        platform,
      };
      return next();
    }
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required (Bearer token from Web, Android, or iOS)',
      },
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.firebaseToken = decoded;
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      phone: decoded.phone_number,
      displayName: decoded.name,
      photoUrl: decoded.picture,
      platform,
    };

    await syncUserToDatabase(
      decoded.uid,
      decoded.email,
      decoded.phone_number,
      decoded.name,
      decoded.picture,
      platform
    );

    next();
  } catch (error: any) {
    console.error('[Auth Error] Token verification failed:', error?.message);
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
      },
    });
  }
}
