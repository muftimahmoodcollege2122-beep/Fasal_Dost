// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/FarmerProfileScreen.tsx
// React Native Farmer Profile & Identity Screen
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export function FarmerProfileScreen({ lang, onBack }: { lang: 'ur' | 'en'; onBack: () => void }) {
  const isUrdu = lang === 'ur';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← {isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'کسان پروفائل (Farmer Profile)' : 'Farmer Profile & Identity'}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{isUrdu ? 'نام:' : 'Name:'}</Text>
        <Text style={styles.val}>Muhammad Tariq Khan</Text>

        <Text style={styles.label}>{isUrdu ? 'موبائل نمبر:' : 'Mobile Number:'}</Text>
        <Text style={styles.val}>0300 1234567</Text>

        <Text style={styles.label}>{isUrdu ? 'علاقہ:' : 'Location:'}</Text>
        <Text style={styles.val}>Chak 204 RB, Faisalabad</Text>

        <Text style={styles.label}>{isUrdu ? 'تصدیق شدہ بیج:' : 'Verified Seller Badge:'}</Text>
        <Text style={[styles.val, { color: '#059669' }]}>✓ Verified Farmer</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 12, textTransform: 'uppercase' },
  val: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 2 },
});
