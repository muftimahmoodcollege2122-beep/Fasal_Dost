// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/HomeScreen.tsx
// React Native Home Screen for FasalDost
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export function HomeScreen({ lang, onNavigate }: { lang: 'ur' | 'en'; onNavigate: (screen: string, params?: any) => void }) {
  const isUrdu = lang === 'ur';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{isUrdu ? 'سلام کسان بھائی! 👋' : 'Hello Farmer! 👋'}</Text>
          <Text style={styles.subGreeting}>{isUrdu ? 'فضل دوست زرعی پورٹل' : 'FasalDost Agritech Dashboard'}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => onNavigate('Settings')}>
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Main Scan Banner */}
      <TouchableOpacity style={styles.scanHeroCard} onPress={() => onNavigate('Scan')}>
        <View style={styles.scanIconBox}>
          <Text style={{ fontSize: 32 }}>📸</Text>
        </View>
        <Text style={styles.scanTitle}>{isUrdu ? 'فصل کے پتے کی تصویر بنائیں' : 'Scan Crop Leaf & Diagnose'}</Text>
        <Text style={styles.scanDesc}>
          {isUrdu ? 'اے آئی کیمرہ سے بیماری فوراً شناخت کریں اور علاج پائیں۔' : 'Instant AI pathology scan for plant diseases & cures.'}
        </Text>
        <View style={styles.scanBtn}>
          <Text style={styles.scanBtnText}>{isUrdu ? 'ابھی اسکین کریں' : 'Start Scan Now'}</Text>
        </View>
      </TouchableOpacity>

      {/* Quick Action Grid */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('Marketplace')}>
          <Text style={{ fontSize: 24, marginBottom: 8 }}>🌾</Text>
          <Text style={styles.gridTitle}>{isUrdu ? 'کسان منڈی' : 'Produce Exchange'}</Text>
          <Text style={styles.gridSub}>{isUrdu ? 'فصل خریدیں یا بیچیں' : 'Buy & Sell Crops'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('History')}>
          <Text style={{ fontSize: 24, marginBottom: 8 }}>📋</Text>
          <Text style={styles.gridTitle}>{isUrdu ? 'اسکین ہسٹری' : 'Scan History'}</Text>
          <Text style={styles.gridSub}>{isUrdu ? 'ماضی کی رپورٹس' : 'Past Diagnostics'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('Subscription')}>
          <Text style={{ fontSize: 24, marginBottom: 8 }}>👑</Text>
          <Text style={styles.gridTitle}>{isUrdu ? 'پریمیم پیکجز' : 'Subscription'}</Text>
          <Text style={styles.gridSub}>{isUrdu ? 'گولڈ اور ڈائمنڈ پلان' : 'Gold & Diamond Plans'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('FarmerProfile')}>
          <Text style={{ fontSize: 24, marginBottom: 8 }}>👤</Text>
          <Text style={styles.gridTitle}>{isUrdu ? 'کسان پروفائل' : 'Farmer Profile'}</Text>
          <Text style={styles.gridSub}>{isUrdu ? 'ذاتی تفصیلات' : 'Identity & Land'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  subGreeting: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 2 },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  scanHeroCard: { backgroundColor: '#0f172a', borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 20, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  scanIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  scanTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: 6 },
  scanDesc: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 16, paddingHorizontal: 10 },
  scanBtn: { backgroundColor: '#ffffff', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14 },
  scanBtnText: { fontSize: 13, fontWeight: '900', color: '#0f172a' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  gridTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  gridSub: { fontSize: 11, fontWeight: '600', color: '#64748b' },
});
