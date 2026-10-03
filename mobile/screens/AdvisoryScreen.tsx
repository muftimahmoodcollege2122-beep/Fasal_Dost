// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/AdvisoryScreen.tsx
// React Native Agronomist & Weather Advisory Screen
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export function AdvisoryScreen({ lang, onBack }: { lang: 'ur' | 'en'; onBack: () => void }) {
  const isUrdu = lang === 'ur';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← {isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'ماہرانہ زرعی مشورے (Advisory)' : 'Expert Agronomist Advisory'}</Text>
      <Text style={styles.subtitle}>{isUrdu ? 'فصلوں کی دیکھ بھال، کھاد اور موسم کی تازہ ترین معلومات' : 'Weather forecasts, fertilizer schedules, and expert tips'}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌤️ {isUrdu ? 'موسم اور آب و ہوا' : 'Weather & Climate Alert'}</Text>
        <Text style={styles.cardDesc}>
          {isUrdu ? 'آئندہ 3 دنوں میں بارش کا امکان ہے۔ گندم کی کٹائی کا مناسب انتظام کریں۔' : 'Rain expected in next 3 days. Plan harvesting accordingly.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧪 {isUrdu ? 'کھاد کا استعمال' : 'Fertilizer Advisory'}</Text>
        <Text style={styles.cardDesc}>
          {isUrdu ? 'ی یوریا کھاد کا دوسرا سپرے گندم کے پودوں پر وقت پر مکمل کریں۔' : 'Apply second dose of Urea fertilizer for optimal wheat grain filling.'}
        </Text>
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
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#475569', lineHeight: 18 },
});
