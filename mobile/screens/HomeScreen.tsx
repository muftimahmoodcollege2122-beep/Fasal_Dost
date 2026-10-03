// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/HomeScreen.tsx
// React Native Home Screen matching web UI (Professional Slate & White Edition)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Camera, Store, Clock, Crown, User, Settings, Sparkles, ChevronRight, ShieldCheck, CloudRain } from 'lucide-react-native';

export function HomeScreen({ lang, onNavigate }: { lang: 'ur' | 'en'; onNavigate: (screen: string, params?: any) => void }) {
  const isUrdu = lang === 'ur';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarBox}>
            <Text style={{ fontSize: 18 }}>🌱</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{isUrdu ? 'سلام کسان بھائی! 👋' : 'Hello Farmer! 👋'}</Text>
            <Text style={styles.subGreeting}>{isUrdu ? 'فضل دوست اے آئی زرعی پورٹل' : 'FasalDost Agritech Dashboard'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsBtn} onPress={() => onNavigate('Settings')}>
          <Settings size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Subscription Banner */}
      <TouchableOpacity style={styles.subBanner} onPress={() => onNavigate('Subscription')}>
        <View style={styles.subBannerLeft}>
          <div style={{}} />
          <View style={styles.crownIconBox}>
            <Crown size={18} color="#10b981" />
          </View>
          <View>
            <Text style={styles.subBannerTitle}>{isUrdu ? 'فضل دوست پریمیم پیکجز' : 'FasalDost Subscription Plans'}</Text>
            <Text style={styles.subBannerSub}>{isUrdu ? '7 مفت اسکینز | گولڈ، ڈائمنڈ اور لامحدود' : 'Free 7 Scans | Gold, Diamond & Unlimited'}</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#94a3b8" />
      </TouchableOpacity>

      {/* Main Scan Hero Card */}
      <TouchableOpacity style={styles.scanHeroCard} onPress={() => onNavigate('Scan')}>
        <View style={styles.scanIconBox}>
          <Camera size={32} color="#ffffff" />
        </View>
        <Text style={styles.scanTitle}>{isUrdu ? 'فصل کے پتے کی تصویر بنائیں' : 'Scan Crop Leaf & Diagnose'}</Text>
        <Text style={styles.scanDesc}>
          {isUrdu ? 'اے آئی کیمرہ سے بیماری فوراً شناخت کریں اور فوری علاج پائیں۔' : 'Instant AI pathology scan for plant diseases, severity & cures.'}
        </Text>
        <View style={styles.scanBtn}>
          <Sparkles size={16} color="#0f172a" style={{ marginRight: 6 }} />
          <Text style={styles.scanBtnText}>{isUrdu ? 'ابھی اسکین کریں' : 'Start Scan Now'}</Text>
        </View>
      </TouchableOpacity>

      {/* Quick Action Grid */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('Marketplace')}>
          <View style={[styles.gridIconBox, { backgroundColor: '#ecfdf5' }]}>
            <Store size={22} color="#059669" />
          </View>
          <Text style={styles.gridTitle}>{isUrdu ? 'کسان منڈی' : 'Produce Exchange'}</Text>
          <Text style={styles.gridSub}>{isUrdu ? 'فصل خریدیں یا بیچیں' : 'Buy & Sell Crops'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('History')}>
          <View style={[styles.gridIconBox, { backgroundColor: '#eff6ff' }]}>
            <Clock size={22} color="#2563eb" />
          </View>
          <Text style={styles.gridTitle}>{isUrdu ? 'اسکین ہسٹری' : 'Scan History'}</Text>
          <Text style={styles.gridSub}>{isUrdu ? 'ماضی کی رپورٹس' : 'Past Diagnostics'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('Subscription')}>
          <View style={[styles.gridIconBox, { backgroundColor: '#fef3c7' }]}>
            <Crown size={22} color="#d97706" />
          </View>
          <Text style={styles.gridTitle}>{isUrdu ? 'پریمیم پیکجز' : 'Subscription'}</Text>
          <Text style={styles.gridSub}>{isUrdu ? 'گولڈ اور ڈائمنڈ پلان' : 'Gold & Diamond Plans'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('FarmerProfile')}>
          <View style={[styles.gridIconBox, { backgroundColor: '#f1f5f9' }]}>
            <User size={22} color="#0f172a" />
          </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  greeting: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  subGreeting: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 1 },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  subBanner: { backgroundColor: '#0f172a', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'between', marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  subBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  crownIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  subBannerTitle: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  subBannerSub: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 1 },
  scanHeroCard: { backgroundColor: '#0f172a', borderRadius: 28, padding: 22, alignItems: 'center', marginBottom: 16, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 },
  scanIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  scanTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: 6 },
  scanDesc: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 18, paddingHorizontal: 10, lineHeight: 18 },
  scanBtn: { backgroundColor: '#ffffff', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  scanBtnText: { fontSize: 13, fontWeight: '900', color: '#0f172a' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  gridIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  gridTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  gridSub: { fontSize: 11, fontWeight: '600', color: '#64748b' },
});
