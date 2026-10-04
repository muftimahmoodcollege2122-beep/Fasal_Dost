// Over-the-air updates (EAS Update / expo-updates).
// Checks on launch and every time the app returns to the foreground, downloads silently,
// then offers "Restart" — so store-installed apps pick up new JS/screens without a store release.
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import * as Updates from 'expo-updates';

const MIN_GAP_MS = 5 * 60 * 1000; // don't hammer the update server

export function OtaUpdateBanner() {
  const { isUpdateAvailable, isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const lastCheck = useRef(0);

  const check = async () => {
    // Disabled in Expo Go / dev builds — only real store/preview builds can receive OTA updates.
    if (!Updates.isEnabled || __DEV__) return;
    if (Date.now() - lastCheck.current < MIN_GAP_MS) return;
    lastCheck.current = Date.now();
    try {
      await Updates.checkForUpdateAsync();
    } catch (e) {
      console.warn('[OTA] check failed', e);
    }
  };

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, []);

  // Update found -> download it in the background
  useEffect(() => {
    if (!isUpdateAvailable || isUpdatePending) return;
    Updates.fetchUpdateAsync().catch((e) => console.warn('[OTA] download failed', e));
  }, [isUpdateAvailable, isUpdatePending]);

  if (!isUpdatePending || dismissed) return null;
  return (
    <View
      style={{ position: 'absolute', top: 8, left: 12, right: 12, zIndex: 100, backgroundColor: '#0f172a', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 12 }}
    >
      <Text style={{ flex: 1, color: '#fff', fontSize: 12, fontWeight: '700' }}>A new version of FasalDost is ready.</Text>
      <Pressable onPress={() => setDismissed(true)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700' }}>Later</Text>
      </Pressable>
      <Pressable onPress={() => Updates.reloadAsync()} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#fff' }}>
        <Text style={{ color: '#0f172a', fontSize: 12, fontWeight: '800' }}>Restart</Text>
      </Pressable>
    </View>
  );
}
