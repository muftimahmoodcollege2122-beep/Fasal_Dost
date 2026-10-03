// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/SettingsScreen.tsx
// React Native Settings & Preferences Screen (All 6 Languages Identical to Web)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ArrowLeft, Globe, Shield, LogOut, Info, Check } from 'lucide-react-native';
import { Language, SUPPORTED_LANGUAGES } from '../utils/i18n';

export function SettingsScreen({
  lang,
  onLanguageChange,
  onNavigate,
  onBack,
  onSignOut,
}: {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate?: (screen: string, params?: any) => void;
  onBack: () => void;
  onSignOut?: () => void;
}) {
  const isUrdu = lang === 'ur';

  const handleSignOut = () => {
    Alert.alert(
      isUrdu ? 'لاگ آؤٹ' : 'Sign Out',
      isUrdu ? 'کیا آپ اپنے اکاؤنٹ سے سائن آؤٹ کرنا چاہتے ہیں؟' : 'Are you sure you want to sign out?',
      [
        { text: isUrdu ? 'منسوخ' : 'Cancel', style: 'cancel' },
        {
          text: isUrdu ? 'سائن آؤٹ' : 'Sign Out',
          style: 'destructive',
          onPress: () => {
            if (onSignOut) onSignOut();
            else onBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <ArrowLeft size={18} color="#0f172a" />
        <Text style={styles.backText}>{isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'ترتیبات' : 'Settings & Preferences'}</Text>
      <Text style={styles.subtitle}>{isUrdu ? 'زبان اور اکاؤنٹ کا انتظام' : 'Configure app language, profile, and system'}</Text>

      {/* Language Selector (All 6 Languages) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Globe size={18} color="#0f172a" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>{isUrdu ? 'زبان کا انتخاب (Language)' : 'Select App Language'}</Text>
        </View>

        <View style={styles.langGrid}>
          {SUPPORTED_LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.langBtn, active && styles.langBtnActive]}
                onPress={() => onLanguageChange(l.code as Language)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langNative, active && styles.textWhite]}>{l.native}</Text>
                  <Text style={[styles.langName, active && styles.textWhiteSub]}>{l.name}</Text>
                </View>
                {active && <Check size={16} color="#ffffff" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Subscription Quick Link */}
      <TouchableOpacity style={styles.menuRow} onPress={() => onNavigate && onNavigate('Subscription')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Shield size={18} color="#059669" />
          <Text style={styles.menuText}>{isUrdu ? 'پریمیم پیکجز اور سبسکرپشن' : 'Subscription & Premium Plans'}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>Free 7/day</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.menuRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Info size={18} color="#64748b" />
          <Text style={styles.menuText}>FasalDost Mobile Build</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>v2.0.0 (Gemini 3.8)</Text>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <LogOut size={16} color="#dc2626" style={{ marginRight: 8 }} />
        <Text style={styles.signOutText}>{isUrdu ? 'اکاؤنٹ سے لاگ آؤٹ کریں' : 'Sign Out of Account'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingVertical: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#64748b', marginBottom: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  langGrid: { gap: 8 },
  langBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  langBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  langNative: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  langName: { fontSize: 11, color: '#64748b' },
  textWhite: { color: '#ffffff' },
  textWhiteSub: { color: '#94a3b8' },
  menuRow: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  menuText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  signOutBtn: { backgroundColor: '#fee2e2', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  signOutText: { fontSize: 13, fontWeight: '800', color: '#dc2626' },
});
