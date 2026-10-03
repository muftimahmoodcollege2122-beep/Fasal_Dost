// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/SplashScreen.tsx
// React Native Splash Screen for FasalDost
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function SplashScreen({ onFinish, durationMs = 2500 }: { onFinish: () => void; durationMs?: number }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, durationMs);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>🌱</Text>
      </View>
      <Text style={styles.title}>FasalDost</Text>
      <Text style={styles.subtitle}>Guardian of Your Harvest</Text>
      <ActivityIndicator size="small" color="#0f172a" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  logoText: {
    fontSize: 42,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 6,
    marginBottom: 30,
  },
  loader: {
    marginTop: 10,
  },
});
