import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'fd_mobile_uid';
let cached: string | null = null;

/** Stable per-install user id (until Firebase sign-in is added to mobile). */
export async function getDeviceUid(): Promise<string> {
  if (cached) return cached;
  let uid = await AsyncStorage.getItem(KEY);
  if (!uid) {
    uid = 'mob_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    await AsyncStorage.setItem(KEY, uid);
  }
  cached = uid;
  return uid;
}
