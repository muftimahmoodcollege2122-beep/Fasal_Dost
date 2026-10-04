// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/HomeScreen.tsx
// Main Landing Screen for FasalDost (Identical to Web Experience)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  Camera,
  Image as ImageIcon,
  Store,
  Clock,
  Settings,
  Sprout,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Crown,
  CloudRain,
  User,
} from 'lucide-react-native';
import { Language, t } from '../utils/i18n';
import { mobileApi } from '../utils/api';

export function HomeScreen({
  lang,
  onNavigate,
  onPickImage,
  onCaptureImage,
}: {
  lang: Language;
  onNavigate: (screen: string, params?: any) => void;
  onPickImage?: () => void;
  onCaptureImage?: () => void;
}) {
  const isUrdu = lang === 'ur';
  const [farmerName, setFarmerName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const profile = await mobileApi.farmers.getProfile('current');
        if (profile?.fullName) {
          setFarmerName(profile.fullName);
        }
      } catch {}
    })();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Bar: Clean Action Icons matching Web */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.fdBadge}>
            <Text style={styles.fdBadgeText}>FD</Text>
          </View>
          <Text style={styles.brandLabel}>{t('agritechAi', lang)}</Text>
        </View>

        <View style={styles.headerActions}>
          {/* History Icon */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onNavigate('History')}
            accessibilityLabel="Scan History"
          >
            <Clock size={18} color="#334155" />
          </TouchableOpacity>

          {/* Marketplace Icon */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onNavigate('Marketplace')}
            accessibilityLabel="Marketplace"
          >
            <Store size={18} color="#334155" />
          </TouchableOpacity>

          {/* Settings Icon */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onNavigate('Settings')}
            accessibilityLabel="Settings"
          >
            <Settings size={18} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.sproutBox}>
          <Sprout size={32} color="#0f172a" />
        </View>
        <Text style={styles.appTitle}>{t('appName', lang)}</Text>

        {farmerName ? (
          <Text style={styles.welcomeText}>
            {t('welcomeBack', lang)}, {farmerName}
          </Text>
        ) : null}

        <Text style={styles.subtitleText}>{t('subtitle', lang)}</Text>
      </View>

      {/* Primary Actions */}
      <View style={styles.actionGroup}>
        {/* Take Photo Button - Solid Dark CTA */}
        <TouchableOpacity
          style={styles.takePhotoBtn}
          onPress={() => {
            if (onCaptureImage) onCaptureImage();
            else onNavigate('Scan');
          }}
        >
          <Camera size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.takePhotoText}>{t('takePhoto', lang)}</Text>
        </TouchableOpacity>

        {/* Upload from Gallery Button */}
        <TouchableOpacity
          style={styles.galleryBtn}
          onPress={() => {
            if (onPickImage) onPickImage();
            else onNavigate('Scan');
          }}
        >
          <ImageIcon size={18} color="#1e293b" style={{ marginRight: 8 }} />
          <Text style={styles.galleryText}>{t('uploadPhoto', lang)}</Text>
        </TouchableOpacity>

        {/* Marketplace Promo Card */}
        <TouchableOpacity
          style={styles.marketplaceBanner}
          onPress={() => onNavigate('Marketplace')}
        >
          <View style={styles.marketBannerLeft}>
            <View style={styles.marketIconBox}>
              <Store size={20} color="#0f172a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.marketTitle}>{t('marketplace', lang)}</Text>
              <Text style={styles.marketSub}>{t('marketplaceSubtitle', lang)}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* How It Works Section */}
      <View style={styles.howItWorksCard}>
        <Text style={styles.howItWorksHeader}>{t('howItWorks', lang)}</Text>
        <View style={styles.stepsRow}>
          <View style={styles.stepCol}>
            <View style={styles.stepCircle}>
              <Camera size={16} color="#334155" />
            </View>
            <Text style={styles.stepTitle}>{t('step1Title', lang)}</Text>
            <Text style={styles.stepDesc}>{t('step1Desc', lang)}</Text>
          </View>

          <View style={styles.stepCol}>
            <View style={styles.stepCircle}>
              <Sparkles size={16} color="#334155" />
            </View>
            <Text style={styles.stepTitle}>{t('step2Title', lang)}</Text>
            <Text style={styles.stepDesc}>{t('step2Desc', lang)}</Text>
          </View>

          <View style={styles.stepCol}>
            <View style={styles.stepCircle}>
              <ShieldCheck size={16} color="#334155" />
            </View>
            <Text style={styles.stepTitle}>{t('step3Title', lang)}</Text>
            <Text style={styles.stepDesc}>{t('step3Desc', lang)}</Text>
          </View>
        </View>
      </View>

      {/* Quick Services Row */}
      <View style={styles.servicesGrid}>
        <TouchableOpacity style={styles.serviceCard} onPress={() => onNavigate('Subscription')}>
          <View style={[styles.serviceIconBox, { backgroundColor: '#fef3c7' }]}>
            <Crown size={18} color="#b45309" />
          </View>
          <Text style={styles.serviceTitle}>{isUrdu ? 'سبسکرپشن' : 'Subscription'}</Text>
          <Text style={styles.serviceSub}>Free 7 Scans</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.serviceCard} onPress={() => onNavigate('FarmerProfile')}>
          <View style={[styles.serviceIconBox, { backgroundColor: '#f1f5f9' }]}>
            <User size={18} color="#0f172a" />
          </View>
          <Text style={styles.serviceTitle}>{isUrdu ? 'پروفائل' : 'Profile'}</Text>
          <Text style={styles.serviceSub}>{isUrdu ? 'تصدیق کارڈ' : 'Farmer ID'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fdBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  fdBadgeText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  brandLabel: { fontSize: 11, fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  heroSection: { alignItems: 'center', marginVertical: 10, paddingHorizontal: 16 },
  sproutBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  appTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  welcomeText: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 2 },
  subtitleText: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  actionGroup: { gap: 10, marginVertical: 14 },
  takePhotoBtn: { backgroundColor: '#0f172a', borderRadius: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  takePhotoText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  galleryBtn: { backgroundColor: '#ffffff', borderRadius: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  galleryText: { color: '#1e293b', fontSize: 14, fontWeight: '800' },
  marketplaceBanner: { backgroundColor: '#ffffff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  marketBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  marketIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  marketTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  marketSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  howItWorksCard: { backgroundColor: '#f8fafc', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginVertical: 12 },
  howItWorksHeader: { fontSize: 11, fontWeight: '800', color: '#475569', textTransform: 'uppercase', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepCol: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepTitle: { fontSize: 11, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 2 },
  stepDesc: { fontSize: 10, color: '#64748b', textAlign: 'center', lineHeight: 13 },
  servicesGrid: { flexDirection: 'row', gap: 8, marginTop: 4 },
  serviceCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  serviceIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  serviceTitle: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  serviceSub: { fontSize: 10, color: '#64748b', marginTop: 1 },
});
