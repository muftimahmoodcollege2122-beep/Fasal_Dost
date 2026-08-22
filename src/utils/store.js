// ─────────────────────────────────────────────────────────────────────────────
// src/utils/store.js
//
// PURPOSE:
//   Central state and persistence layer for FasalDost.
//   Handles three types of storage:
//
//   1. IN-MEMORY  — Image (URI + base64). Never navigated — too large.
//   2. LOCAL      — AsyncStorage on device. Works offline. Fast.
//   3. CLOUD      — Firebase Firestore. Syncs to database. Business data.
//
// DUAL-WRITE STRATEGY:
//   Every save writes to AsyncStorage FIRST (guaranteed, instant),
//   then attempts Firestore (best effort, requires internet).
//   If Firestore fails (no internet, quota, etc.) the app keeps working.
//   Data is NOT lost — it stays local until the next successful cloud write.
//
// FIRESTORE COLLECTIONS:
//   /farmers/{farmerId}  — Farmer profile (name, phone, location, crops)
//   /scans/{scanId}      — Each disease detection result with farmer reference
//
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage       from '@react-native-async-storage/async-storage';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db }             from './firebase';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — IMAGE STORE (in-memory only)
//
// Base64 strings are 1–3 MB. Passing them through React Navigation params
// silently corrupts data. We store them in a plain JS object instead.
// ScanScreen writes here. ResultScreen reads from here.
// ─────────────────────────────────────────────────────────────────────────────

/** In-memory image store — never persisted */
const _image = { uri: null, base64: null };

/**
 * Store an image in memory.
 * @param {string} uri    - Local file URI from ImagePicker
 * @param {string} base64 - Base64 encoded image string (for API call)
 */
export const setImage = (uri, base64) => {
  _image.uri    = uri    || null;
  _image.base64 = base64 || null;
};

/**
 * Read the stored image.
 * @returns {{ uri: string|null, base64: string|null }}
 */
export const getImage = () => ({
  uri:    _image.uri,
  base64: _image.base64,
});

/** Clear the stored image (call after navigation to Result screen) */
export const clearImage = () => {
  _image.uri    = null;
  _image.base64 = null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — LANGUAGE (in-memory)
// ─────────────────────────────────────────────────────────────────────────────

/** Current app language — 'ur' (Urdu) or 'en' (English) */
let _lang = 'ur';

/** Set app language globally */
export const setLang = (lang) => { _lang = lang; };

/** Get current app language */
export const getLang = () => _lang;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — FARMER UNIQUE ID
//
// Each farmer gets a permanent random ID on first app install.
// This ID links their profile and scans in Firestore.
// Stored in AsyncStorage so it survives app restarts.
// ─────────────────────────────────────────────────────────────────────────────

const FARMER_ID_KEY = 'fd_farmer_id_v1';

/**
 * Get or create a permanent unique ID for this farmer's device.
 * Format: fd_{timestamp}_{random9chars}
 * @returns {Promise<string>} The farmer's unique ID
 */
export const getFarmerUniqueId = async () => {
  try {
    let id = await AsyncStorage.getItem(FARMER_ID_KEY);
    if (!id) {
      // First install — generate a new unique ID
      id = `fd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(FARMER_ID_KEY, id);
    }
    return id;
  } catch (e) {
    // Fallback — generate without persisting (edge case)
    console.warn('getFarmerUniqueId error:', e.message);
    return `fd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — FARMER PROFILE
//
// Stores: name, phone, province, division, district, tehsil, landSize, crops
//
// LOCAL:  AsyncStorage key 'fd_farmer_v1'
// CLOUD:  Firestore /farmers/{farmerId}
// ─────────────────────────────────────────────────────────────────────────────

const FARMER_LOCAL_KEY = 'fd_farmer_v1';

/**
 * Save farmer profile to both AsyncStorage and Firestore.
 * AsyncStorage write is guaranteed. Firestore write is best-effort.
 *
 * @param {Object} profile - Farmer profile object
 * @param {string} profile.name       - Full name
 * @param {string} profile.phone      - Mobile number
 * @param {string} profile.province   - Province (e.g. Punjab)
 * @param {string} profile.division   - Division (e.g. Faisalabad Division)
 * @param {string} profile.district   - District (e.g. Faisalabad)
 * @param {string} profile.tehsil     - Tehsil (e.g. Samundri)
 * @param {string} profile.landSize   - Land size in acres
 * @param {string[]} profile.crops    - Array of crop names
 * @returns {Promise<boolean>} true if local save succeeded
 */
export const saveFarmerProfile = async (profile) => {
  // ── Step 1: Save locally (always works, even offline) ──────────────────
  try {
    await AsyncStorage.setItem(FARMER_LOCAL_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('saveFarmerProfile local error:', e.message);
    return false; // Local save failed — do not proceed
  }

  // ── Step 2: Save to Firestore (best effort — skip if offline) ──────────
  try {
    const farmerId = await getFarmerUniqueId();

    // Firestore document structure — this is what becomes our data asset
    await setDoc(doc(db, 'farmers', farmerId), {
      farmerId,
      name:       profile.name      || '',
      phone:      profile.phone     || '',
      province:   profile.province  || '',
      division:   profile.division  || '',
      district:   profile.district  || '',
      tehsil:     profile.tehsil    || '',    // ← New field for precise location
      landSize:   profile.landSize  || '',
      crops:      profile.crops     || [],
      appVersion: '2.0',
      updatedAt:  serverTimestamp(),          // Firestore server time (not device time)
    }, { merge: true }); // merge: true — updates existing fields, does not delete others

  } catch (e) {
    // Firestore failed (no internet, config not set yet, etc.)
    // This is NOT a critical error — data is safe in AsyncStorage
    console.warn('saveFarmerProfile Firestore error (non-critical):', e.message);
  }

  return true; // Local save succeeded
};

/**
 * Load farmer profile from local AsyncStorage.
 * @returns {Promise<Object|null>} Profile object or null if not set
 */
export const getFarmerProfile = async () => {
  try {
    const raw = await AsyncStorage.getItem(FARMER_LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('getFarmerProfile error:', e.message);
    return null;
  }
};

/**
 * Check if farmer has completed the minimum required profile fields.
 * Minimum required: name + province.
 * @returns {Promise<boolean>}
 */
export const isProfileComplete = async () => {
  const p = await getFarmerProfile();
  return !!(p && p.name && p.name.trim() && p.province);
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — SCAN HISTORY
//
// Each scan = one disease detection result with the image URI and crop name.
//
// LOCAL:  AsyncStorage key 'fd_history_v1' (max 50 entries, newest first)
// CLOUD:  Firestore /scans/{autoId} with farmer reference and location data
//
// NOTE: imageUri is stored locally only — it's a device file path.
//       The cloud record stores all other data but NOT the raw image.
// ─────────────────────────────────────────────────────────────────────────────

const HISTORY_LOCAL_KEY = 'fd_history_v1';
const HISTORY_MAX       = 50; // Maximum local history entries

/**
 * Save a scan result to local history and Firestore.
 * The local entry includes imageUri for display in HistoryScreen.
 * The Firestore entry includes farmer location data for analytics.
 *
 * @param {Object} params
 * @param {string|null} params.imageUri  - Local image file path (local only)
 * @param {string}      params.cropName  - Crop name entered by farmer
 * @param {Object}      params.result    - Full AI detection result object
 * @returns {Promise<string|null>} The scan entry ID or null on failure
 */
export const saveToHistory = async ({ imageUri, cropName, result }) => {
  // Validate — do not save empty or malformed results
  if (!result || typeof result !== 'object') {
    console.warn('saveToHistory: invalid result, skipping save');
    return null;
  }

  const entryId = Date.now().toString();

  // ── Step 1: Save to local AsyncStorage ───────────────────────────────────
  try {
    const existing = await getHistory();
    const entry = {
      id:        entryId,
      date:      new Date().toISOString(),
      imageUri:  imageUri || null, // Device path — may expire if OS clears cache
      cropName:  cropName || '',
      result,
    };
    // Keep only the most recent HISTORY_MAX entries
    const updated = [entry, ...existing].slice(0, HISTORY_MAX);
    await AsyncStorage.setItem(HISTORY_LOCAL_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('saveToHistory local error:', e.message);
    return null;
  }

  // ── Step 2: Save to Firestore (best effort) ───────────────────────────────
  try {
    const farmerId = await getFarmerUniqueId();
    const profile  = await getFarmerProfile();

    // Extract disease names array for easy querying in Firestore
    const diseases = Array.isArray(result.diseases) ? result.diseases : [];
    const diseaseNames = diseases.map(d => d.disease_name_en).filter(Boolean);

    // Firestore scan document — the core of our data business
    await addDoc(collection(db, 'scans'), {
      scanId:         entryId,
      farmerId,

      // ── Farmer location (for regional analytics) ──────────────────────
      farmerName:     profile?.name     || '',
      farmerPhone:    profile?.phone    || '',
      province:       profile?.province || '',
      division:       profile?.division || '',
      district:       profile?.district || '',
      tehsil:         profile?.tehsil   || '', // ← Tehsil-level precision

      // ── Crop and disease data ─────────────────────────────────────────
      cropName:       cropName || result.crop_detected_en || '',
      isHealthy:      result.is_healthy === true,
      confidence:     result.overall_confidence || 0,
      diseaseCount:   diseases.length,
      diseaseNames,   // Array — useful for Firestore queries

      // ── Timestamps ────────────────────────────────────────────────────
      scannedAt:      serverTimestamp(),
      appVersion:     '2.0',
    });

  } catch (e) {
    // Firestore failure is non-critical — local history is already saved
    console.warn('saveToHistory Firestore error (non-critical):', e.message);
  }

  return entryId;
};

/**
 * Get all local scan history entries (newest first).
 * @returns {Promise<Array>} Array of scan history entries
 */
export const getHistory = async () => {
  try {
    const raw  = await AsyncStorage.getItem(HISTORY_LOCAL_KEY);
    const data = raw ? JSON.parse(raw) : [];
    // Guard against corrupted data — ensure it's always an array
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('getHistory error:', e.message);
    return [];
  }
};

/**
 * Delete all local scan history.
 * Note: This only deletes local data. Firestore records are kept.
 * @returns {Promise<boolean>}
 */
export const clearHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_LOCAL_KEY);
    return true;
  } catch (e) {
    console.warn('clearHistory error:', e.message);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — DAILY SCAN LIMIT
//
// Each farmer gets a maximum of 10 free scans per day.
// This controls API costs and prevents abuse.
//
// How it works:
//   - AsyncStorage stores { date: 'YYYY-MM-DD', count: N }
//   - On each scan attempt, we check today's date and count
//   - If count >= DAILY_LIMIT, we block the scan and show a message
//   - At midnight the date changes, count resets automatically
//
// ─────────────────────────────────────────────────────────────────────────────

const DAILY_LIMIT_KEY = 'fd_daily_limit_v1'; // AsyncStorage key
const DAILY_LIMIT     = 10;                   // Maximum scans per day per device

/**
 * Get today's date as a string in YYYY-MM-DD format.
 * Used to detect when a new day starts and reset the counter.
 * @returns {string} e.g. '2026-03-14'
 */
const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Check if the farmer has scans remaining today.
 * Also returns how many scans they have used and how many remain.
 *
 * @returns {Promise<{ allowed: boolean, used: number, remaining: number, limit: number }>}
 */
export const checkDailyLimit = async () => {
  try {
    const today = getTodayString();
    const raw   = await AsyncStorage.getItem(DAILY_LIMIT_KEY);
    const data  = raw ? JSON.parse(raw) : null;

    // If no record exists or record is from a previous day — reset to 0
    if (!data || data.date !== today) {
      return { allowed: true, used: 0, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
    }

    const used = data.count || 0;
    return {
      allowed:   used < DAILY_LIMIT,
      used,
      remaining: Math.max(0, DAILY_LIMIT - used),
      limit:     DAILY_LIMIT,
    };
  } catch (e) {
    console.warn('checkDailyLimit error:', e.message);
    // On error, always allow the scan — never block farmer due to our storage bug
    return { allowed: true, used: 0, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }
};

/**
 * Increment the daily scan counter by 1.
 * Called AFTER a successful scan only — failed scans do not count.
 *
 * @returns {Promise<void>}
 */
export const incrementDailyCount = async () => {
  try {
    const today = getTodayString();
    const raw   = await AsyncStorage.getItem(DAILY_LIMIT_KEY);
    const data  = raw ? JSON.parse(raw) : null;

    // If record is from a previous day, start fresh from 1
    if (!data || data.date !== today) {
      await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify({ date: today, count: 1 }));
    } else {
      // Same day — increment existing count
      await AsyncStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify({ date: today, count: (data.count || 0) + 1 }));
    }
  } catch (e) {
    console.warn('incrementDailyCount error:', e.message);
    // Non-critical — if this fails, farmer just gets one extra scan
  }
};

/**
 * Delete a single scan from local history by its ID.
 * Note: Only deletes locally — Firestore record is kept for data business.
 *
 * @param {string} id - The scan entry ID to delete
 * @returns {Promise<boolean>} true if deleted successfully
 */
export const deleteHistoryItem = async (id) => {
  try {
    const existing = await getHistory();
    const updated  = existing.filter(item => item.id !== id);
    await AsyncStorage.setItem(HISTORY_LOCAL_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.warn('deleteHistoryItem error:', e.message);
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — MARKETPLACE LISTINGS
//
// Farmers post produce for sale. Buyers browse and contact via WhatsApp.
//
// Firestore: /listings/{listingId}
// ─────────────────────────────────────────────────────────────────────────────

const LISTINGS_LOCAL_KEY = 'fd_listings_v1';

/**
 * Create a new produce listing.
 * Saves to Firestore so all users can see it.
 *
 * @param {Object} listing - Listing data
 * @returns {Promise<string|null>} listing ID or null on failure
 */
export const createListing = async (listing) => {
  try {
    const profile  = await getFarmerProfile();
    const farmerId = await getFarmerUniqueId();

    const doc = {
      farmerId,
      farmerName:  profile?.name     || '',
      farmerPhone: profile?.phone    || '',
      province:    profile?.province || '',
      district:    profile?.district || '',
      tehsil:      profile?.tehsil   || '',
      cropName:    listing.cropName  || '',
      quantity:    listing.quantity  || '',
      unit:        listing.unit      || 'Maund',
      price:       listing.price     || '',
      quality:     listing.quality   || 'medium',
      description: listing.description || '',
      status:      'active',
      createdAt:   serverTimestamp(),
    };

    const ref = await addDoc(collection(db, 'listings'), doc);
    return ref.id;
  } catch (e) {
    console.warn('createListing error:', e.message);
    return null;
  }
};

/**
 * Get all active listings from Firestore.
 * @returns {Promise<Array>}
 */
export const getListings = async () => {
  try {
    const { getDocs, query, where, limit, collection: col } = await import('firebase/firestore');
    const q = query(col(db, 'listings'), where('status', '==', 'active'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('getListings error:', e.message);
    return [];
  }
};

/**
 * Get listings posted by current farmer.
 * @returns {Promise<Array>}
 */
export const getMyListings = async () => {
  try {
    const farmerId = await getFarmerUniqueId();
    const { getDocs, query, where, collection: col } = await import('firebase/firestore');
    const q = query(col(db, 'listings'), where('farmerId', '==', farmerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('getMyListings error:', e.message);
    return [];
  }
};

/**
 * Mark a listing as sold or delete it.
 * @param {string} listingId
 * @param {'sold'|'deleted'} newStatus
 */
export const updateListingStatus = async (listingId, newStatus) => {
  try {
    const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
    await updateDoc(firestoreDoc(db, 'listings', listingId), { status: newStatus });
    return true;
  } catch (e) {
    console.warn('updateListingStatus error:', e.message);
    return false;
  }
};
