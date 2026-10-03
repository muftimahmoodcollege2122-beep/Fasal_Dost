// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/SettingsScreen.tsx
// React Native Settings & Preferences Screen
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export function SettingsScreen({ lang, onLanguageChange, onBack }: { lang: 'ur' | 'en'; onLanguageChange: (lang: 'ur' | 'en') => void; onBack: () => void }) {
  const isUrdu = lang === 'ur';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← {isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'ترتیبات (Settings)' : 'App Settings & Preferences'}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{isUrdu ? 'زبان کا انتخاب (Language)' : 'Language Selection'}</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.langBtn, lang === 'ur' && styles.langBtnActive]} onPress={() => onLanguageChange('ur')}>
            <Text style={[styles.langText, lang === 'ur' && styles.langTextActive]}>اردو</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.langBtn, lang === 'en' && styles.langBtnActive]} onPress={() => onLanguageChange('en')}>
            <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>English</Text>
          </TouchableOpacity>
        </View>
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
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', backgroundColor: '#f8fafc' },
  langBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  langText: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  langTextActive: { color: '#ffffff' },
});
