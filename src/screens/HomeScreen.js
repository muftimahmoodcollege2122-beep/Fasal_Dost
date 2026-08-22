// ─────────────────────────────────────────────────────────────────────────────
// src/screens/HomeScreen.js
//
// PURPOSE:
//   Main landing screen of FasalDost.
//   Shows farmer greeting, language toggle, and two action buttons:
//   Take Photo (camera) and Upload from Gallery.
//
// FIRST LAUNCH BEHAVIOUR:
//   On first open, checks if farmer profile is complete.
//   If not → redirects to FarmerProfileScreen (onboarding mode).
//   Uses a `profileChecked` ref so the check only runs ONCE per mount,
//   preventing an infinite redirect loop.
//
// NAVIGATION:
//   → FarmerProfile (onboarding)  — first launch, profile incomplete
//   → FarmerProfile (edit)        — profile icon tapped
//   → History                     — history icon tapped
//   → Scan                        — photo taken or selected from gallery
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Animated, ScrollView,
} from 'react-native';
import * as ImagePicker           from 'expo-image-picker';
import { LinearGradient }         from 'expo-linear-gradient';
import * as Haptics               from 'expo-haptics';
import { useSafeAreaInsets }      from 'react-native-safe-area-context';
import { useFocusEffect }         from '@react-navigation/native';
import { colors, spacing, radius, shadows } from '../utils/theme';
import { t, textAlign }           from '../utils/i18n';
import { setImage, getFarmerProfile, isProfileComplete } from '../utils/store';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // ── State ─────────────────────────────────────────────────────────────────
  const [lang,         setLang]         = useState('ur');    // 'ur' or 'en'
  const [farmerName,   setFarmerName]   = useState('');      // Displayed in greeting
  const [profileReady, setProfileReady] = useState(false);   // Show UI after profile check

  // ── Refs ──────────────────────────────────────────────────────────────────
  // profileChecked: prevents the onboarding redirect from running multiple times
  const profileChecked = useRef(false);

  // ── Animation values ──────────────────────────────────────────────────────
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ── Profile check on every focus ─────────────────────────────────────────
  // Runs when screen comes into focus (e.g. returning from Profile edit screen)
  // to refresh the farmer's name in the greeting.
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false; // Prevent state update after unmount

      (async () => {
        // First-ever launch: redirect to onboarding if profile is incomplete
        if (!profileChecked.current) {
          profileChecked.current = true;
          const complete = await isProfileComplete();
          if (!complete && !cancelled) {
            navigation.replace('FarmerProfile', { lang, onboarding: true });
            return;
          }
        }

        // Load farmer name for greeting display
        const profile = await getFarmerProfile();
        if (!cancelled) {
          setFarmerName(profile?.name || '');
          setProfileReady(true);
        }
      })();

      return () => { cancelled = true; };
    }, [lang])
  );

  // ── Entrance animation ────────────────────────────────────────────────────
  // Runs once when profileReady becomes true (profile check complete)
  useEffect(() => {
    if (!profileReady) return;

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [profileReady]);

  // ── Language toggle ───────────────────────────────────────────────────────
  const toggleLang = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLang(prev => prev === 'ur' ? 'en' : 'ur');
  };

  // ── Handle image selection ────────────────────────────────────────────────
  // Shared logic for both camera and gallery flows.
  // Stores image in memory store (not navigation params) to avoid corruption.
  const handleImageResult = (result) => {
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (!asset.uri) return;

    // Store image in global memory store — ResultScreen reads from here
    setImage(asset.uri, asset.base64 || '');

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate to Scan screen with small params only (no image data)
    navigation.navigate('Scan', { lang });
  };

  // ── Take Photo (camera) ───────────────────────────────────────────────────
  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Request camera permission
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('', lang === 'ur'
        ? 'کیمرے کی اجازت درکار ہے'
        : 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes:        ImagePicker.MediaTypeOptions.Images,
      quality:           0.7,    // Balance quality vs upload size
      base64:            true,   // Required for API call
      allowsEditing:     true,
      aspect:            [4, 3], // Crop to landscape
    });

    handleImageResult(result);
  };

  // ── Upload from Gallery ───────────────────────────────────────────────────
  const uploadPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.7,
      base64:     true,
    });

    handleImageResult(result);
  };

  // ── Loading state (while checking profile) ────────────────────────────────
  if (!profileReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.forestDeep }}>
        <LinearGradient
          colors={['#061206', '#0D2E0D']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#061206', '#0D2E0D', '#1A4A1A']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar: Language toggle + History + Profile icons ── */}
        <View style={styles.topBar}>
          {/* Language toggle button */}
          <TouchableOpacity style={styles.langBtn} onPress={toggleLang}>
            <Text style={styles.langText}>{lang === 'ur' ? 'EN' : 'اردو'}</Text>
          </TouchableOpacity>

          <View style={styles.topRight}>
            {/* Marketplace icon */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Marketplace', { lang })}
            >
              <Text style={styles.iconText}>🛒</Text>
            </TouchableOpacity>

            {/* History icon */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('History', { lang })}
            >
              <Text style={styles.iconText}>📋</Text>
            </TouchableOpacity>

            {/* Profile icon */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('FarmerProfile', { lang, onboarding: false })}
            >
              <Text style={styles.iconText}>👨‍🌾</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero section ── */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.heroEmoji}>🌾</Text>
          <Text style={styles.appName}>{t('appName', lang)}</Text>

          {/* Personalised greeting — shows farmer name if available */}
          {farmerName ? (
            <Text style={[styles.greeting, { textAlign: textAlign(lang) }]}>
              {lang === 'ur' ? `السلام علیکم، ${farmerName}` : `Welcome, ${farmerName}`}
            </Text>
          ) : null}

          <Text style={[styles.subtitle, { textAlign: textAlign(lang) }]}>
            {t('subtitle', lang)}
          </Text>
        </Animated.View>

        {/* ── Primary action buttons ── */}
        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          {/* Take Photo — camera */}
          <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.gold, colors.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtnInner}
            >
              <Text style={styles.primaryBtnEmoji}>📷</Text>
              <Text style={[styles.primaryBtnText, { textAlign: textAlign(lang) }]}>
                {t('takePhoto', lang)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Upload from Gallery */}
          <TouchableOpacity style={styles.secondaryBtn} onPress={uploadPhoto} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnEmoji}>🖼️</Text>
            <Text style={[styles.secondaryBtnText, { textAlign: textAlign(lang) }]}>
              {t('uploadPhoto', lang)}
            </Text>
          </TouchableOpacity>

          {/* Marketplace button */}
          <TouchableOpacity
            style={styles.marketplaceBtn}
            onPress={() => navigation.navigate('Marketplace', { lang })}
            activeOpacity={0.85}
          >
            <Text style={styles.marketplaceBtnEmoji}>🛒</Text>
            <View style={styles.marketplaceBtnText}>
              <Text style={[styles.marketplaceBtnTitle, { textAlign: textAlign(lang) }]}>
                {lang === 'ur' ? 'کسان بازار' : 'Kisan Market'}
              </Text>
              <Text style={[styles.marketplaceBtnSub, { textAlign: textAlign(lang) }]}>
                {lang === 'ur' ? 'فصل بیچیں یا خریدیں' : 'Buy or sell produce directly'}
              </Text>
            </View>
            <Text style={styles.marketplaceArrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── How It Works section ── */}
        <Animated.View style={[styles.howSection, { opacity: fadeAnim }]}>
          <Text style={[styles.howTitle, { textAlign: textAlign(lang) }]}>
            {t('howItWorks', lang)}
          </Text>
          <View style={styles.stepsRow}>
            {[
              { emoji: '📸', title: t('step1Title', lang), desc: t('step1Desc', lang) },
              { emoji: '🤖', title: t('step2Title', lang), desc: t('step2Desc', lang) },
              { emoji: '💊', title: t('step3Title', lang), desc: t('step3Desc', lang) },
            ].map((step, i) => (
              <View key={i} style={styles.step}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <Text style={[styles.stepTitle, { textAlign: 'center' }]}>{step.title}</Text>
                <Text style={[styles.stepDesc,  { textAlign: 'center' }]}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forestDeep },
  scroll:    { paddingHorizontal: spacing.md, paddingBottom: 48 },

  // Top bar
  topBar: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing.xl,
  },
  topRight: { flexDirection: 'row', gap: 8 },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical:   8,
    borderRadius:      radius.full,
    borderWidth:       1,
    borderColor:       colors.border,
    backgroundColor:   colors.surfaceLight,
  },
  langText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  iconBtn: {
    width:           44,
    height:          44,
    borderRadius:    radius.full,
    backgroundColor: colors.surfaceLight,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  iconText: { fontSize: 20 },

  // Hero
  hero:      { alignItems: 'center', marginBottom: spacing.xl },
  heroEmoji: { fontSize: 64, marginBottom: 8 },
  appName:   { fontSize: 34, fontWeight: '900', color: colors.gold, letterSpacing: 1, marginBottom: 8 },
  greeting:  { fontSize: 15, color: colors.textSecondary, marginBottom: 4 },
  subtitle:  { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

  // Actions
  actions:        { gap: 12, marginBottom: spacing.xl },
  primaryBtn:     { borderRadius: radius.lg, overflow: 'hidden', ...shadows.glow },
  primaryBtnInner:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 10 },
  primaryBtnEmoji:{ fontSize: 24 },
  primaryBtnText: { fontSize: 18, fontWeight: '800', color: colors.forestDeep },
  secondaryBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             10,
    padding:         16,
    borderRadius:    radius.lg,
    backgroundColor: colors.surfaceLight,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  secondaryBtnEmoji: { fontSize: 22 },
  secondaryBtnText:  { fontSize: 16, fontWeight: '700', color: colors.textPrimary },

  // Marketplace button
  marketplaceBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    padding:         16,
    borderRadius:    radius.lg,
    backgroundColor: 'rgba(244,185,66,0.06)',
    borderWidth:     1,
    borderColor:     'rgba(244,185,66,0.25)',
  },
  marketplaceBtnEmoji: { fontSize: 28 },
  marketplaceBtnText:  { flex: 1 },
  marketplaceBtnTitle: { fontSize: 16, fontWeight: '800', color: colors.gold },
  marketplaceBtnSub:   { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  marketplaceArrow:    { fontSize: 22, color: colors.gold },

  // How It Works
  howSection: {
    backgroundColor: colors.surfaceLight,
    borderRadius:    radius.xl,
    padding:         spacing.md,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  howTitle:  { fontSize: 14, fontWeight: '700', color: colors.gold, marginBottom: spacing.md },
  stepsRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  step:      { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  stepEmoji: { fontSize: 28, marginBottom: 4 },
  stepTitle: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  stepDesc:  { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
});
