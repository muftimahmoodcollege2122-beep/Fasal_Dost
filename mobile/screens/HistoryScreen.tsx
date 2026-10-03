// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/HistoryScreen.tsx
// React Native Diagnostic Scan History Screen
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export function HistoryScreen({ lang, onBack }: { lang: 'ur' | 'en'; onBack: () => void }) {
  const isUrdu = lang === 'ur';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← {isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'اسکین ہسٹری (Scan History)' : 'Diagnostic Scan History'}</Text>
      <Text style={styles.subtitle}>{isUrdu ? 'ماضی کی تمام فصلوں کی تشخیص' : 'Your previous plant pathology scans'}</Text>

      <View style={styles.card}>
        <Text style={styles.crop}>🌾 Wheat (گندم)</Text>
        <Text style={styles.disease}>Yellow Rust (زرد کنگیری)</Text>
        <Text style={styles.date}>📅 Oct 2, 2026</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#64748b', marginBottom: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  crop: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 2 },
  disease: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  date: { fontSize: 11, color: '#94a3b8' },
});
