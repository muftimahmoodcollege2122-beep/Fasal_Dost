// ─────────────────────────────────────────────────────────────────────────────
// src/screens/ScanScreen.js
//
// PURPOSE:
//   Shows the selected/captured crop image, lets farmer select crop type,
//   and triggers the AI disease detection API call.
//
// FLOW:
//   1. Reads image from global store (set by HomeScreen)
//   2. Farmer selects/types crop name
//   3. Farmer taps "Detect Disease"
//   4. API call is made with image (base64) + crop name
//   5. On success → navigates to ResultScreen with result JSON
//   6. On LOW_CONFIDENCE → shows "retake photo" message
//   7. On NETWORK_ERROR → shows connectivity message
//
// IMAGE PASSING:
//   Images are NEVER passed through navigation params (too large, causes corruption).
//   They are stored in the global in-memory store (store.js) and read by ResultScreen.
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Modal, FlatList,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import * as Haptics          from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../utils/theme';
import { t, textAlign, CROPS }  from '../utils/i18n';
import { getImage, checkDailyLimit, incrementDailyCount } from '../utils/store';
import { detectDisease }        from '../utils/api';

export default function ScanScreen({ navigation, route }) {
  const lang   = route?.params?.lang || 'ur';
  const insets = useSafeAreaInsets();

  // ── Read image from global store ─────────────────────────────────────────
  // HomeScreen stored the image here before navigating.
  const { uri: imageUri, base64: imageBase64 } = getImage();

  // ── State ─────────────────────────────────────────────────────────────────
  const [cropInput,       setCropInput]       = useState(''); // Typed or selected crop name
  const [cropModalVisible,setCropModalVisible] = useState(false); // Crop picker modal
  const [loading,         setLoading]         = useState(false);  // API call in progress
  const [errorMsg,        setErrorMsg]        = useState('');     // Error to show below button
  const [scansRemaining,  setScansRemaining]  = useState(10);     // Daily scans left

  // ── Load daily scan count on mount ────────────────────────────────────────
  useEffect(() => {
    checkDailyLimit().then(status => setScansRemaining(status.remaining));
  }, []);

  // ── Prevent duplicate API calls ───────────────────────────────────────────
  // If farmer taps the button twice quickly, only one API call should run.
  const isAnalyzing = useRef(false);

  // ── Crop selector: select from list ──────────────────────────────────────
  const selectCrop = (crop) => {
    setCropInput(lang === 'ur' ? crop.ur : crop.en);
    setCropModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── Main detection handler ────────────────────────────────────────────────
  const handleDetect = async () => {
    // Guard: no image loaded
    if (!imageUri || !imageBase64) {
      Alert.alert('', t('noImage', lang));
      return;
    }

    // Guard: already running an API call
    if (isAnalyzing.current) return;
    isAnalyzing.current = true;

    setLoading(true);
    setErrorMsg(''); // Clear any previous error

    try {
      // ── Check daily scan limit BEFORE calling API ───────────────────────
      // If farmer has used all 10 scans today, block and show message.
      // We check BEFORE the API call so we don't waste API credits.
      const limitStatus = await checkDailyLimit();
      if (!limitStatus.allowed) {
        const msg = lang === 'ur'
          ? `آج کی 10 اسکین مکمل ہو گئی ہیں۔ کل دوبارہ کوشش کریں۔`
          : `Daily limit reached (${limitStatus.limit} scans/day). Try again tomorrow.`;
        setErrorMsg(msg);
        setLoading(false);
        isAnalyzing.current = false;
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Call the AI API — tries up to 3 providers automatically
      const result = await detectDisease(imageBase64, cropInput);

      // ── Increment daily counter AFTER successful scan only ──────────────
      // Failed scans (bad image, network error) do NOT count against limit
      await incrementDailyCount();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to result — pass only result JSON + small params
      // Image is already in global store — ResultScreen reads it from there
      navigation.navigate('Result', { lang, result, cropName: cropInput });

    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Handle known error types with user-friendly messages
      if (err.message === 'LOW_CONFIDENCE') {
        setErrorMsg(t('unclearImage', lang));
      } else if (err.message === 'NETWORK_ERROR') {
        setErrorMsg(t('networkError', lang));
      } else {
        // Unknown error — show generic message + log for debugging
        console.warn('ScanScreen detectDisease error:', err.message);
        setErrorMsg(`${t('error', lang)}: ${err.message}`);
      }
    } finally {
      setLoading(false);
      isAnalyzing.current = false; // Allow future API calls
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#061206', '#0D2E0D', '#1A4A1A']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔬 {t('analyzeBtn', lang)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Daily scan counter badge ── */}
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {lang === 'ur'
              ? `آج کی اسکین: ${scansRemaining}/10 باقی`
              : `Today's scans: ${scansRemaining}/10 remaining`}
          </Text>
        </View>

        {/* ── Crop Image preview ── */}
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            {/* Tap to go back and pick a different image */}
            <TouchableOpacity style={styles.changeOverlay} onPress={() => navigation.goBack()}>
              <Text style={styles.changeText}>🔄 {t('tapToChange', lang)}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Fallback if image was lost (shouldn't happen in normal flow) */
          <View style={styles.noImageBox}>
            <Text style={styles.noImageText}>📷 {t('noImage', lang)}</Text>
          </View>
        )}

        {/* ── Crop selector ── */}
        <View style={styles.section}>
          <Text style={[styles.label, { textAlign: textAlign(lang) }]}>
            🌾 {t('selectCrop', lang)}
          </Text>

          {/* Tap to open modal picker */}
          <TouchableOpacity
            style={styles.cropSelector}
            onPress={() => setCropModalVisible(true)}
          >
            <Text style={[
              styles.cropSelectorText,
              !cropInput && styles.placeholder,
              { textAlign: textAlign(lang) },
            ]}>
              {cropInput || t('cropHint', lang)}
            </Text>
            <Text style={styles.dropArrow}>▼</Text>
          </TouchableOpacity>

          {/* Manual text input — farmer can type if their crop isn't in the list */}
          <Text style={[styles.orText, { textAlign: textAlign(lang) }]}>
            {t('typeManually', lang)}
          </Text>
          <TextInput
            style={[styles.input, { textAlign: textAlign(lang) }]}
            placeholder={t('cropHint', lang)}
            placeholderTextColor={colors.textMuted}
            value={cropInput}
            onChangeText={setCropInput}
          />
        </View>

        {/* ── Error message ── */}
        {!!errorMsg && (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { textAlign: textAlign(lang) }]}>
              ⚠️ {errorMsg}
            </Text>
          </View>
        )}

        {/* ── Detect button ── */}
        <TouchableOpacity
          style={styles.detectBtn}
          onPress={handleDetect}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={loading ? ['#1A3010', '#0D2008'] : [colors.gold, colors.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.detectBtnInner}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.gold} />
                <Text style={styles.loadingText}> {t('analyzing', lang)}...</Text>
              </View>
            ) : (
              <Text style={styles.detectBtnText}>🔍 {t('analyzeBtn', lang)}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Crop picker modal ── */}
      <Modal
        visible={cropModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCropModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🌾 {t('selectCrop', lang)}</Text>
              <TouchableOpacity onPress={() => setCropModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {/* Crop list */}
            <FlatList
              data={CROPS}
              keyExtractor={(item) => item.en}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cropItem}
                  onPress={() => selectCrop(item)}
                >
                  <Text style={[styles.cropItemText, { textAlign: textAlign(lang) }]}>
                    {lang === 'ur' ? item.ur : item.en}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forestDeep },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom:     spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surfaceMid,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  backIcon:    { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },

  scroll: { padding: spacing.md, paddingBottom: 48 },

  // Daily scan counter badge
  counterBadge: {
    backgroundColor: 'rgba(244,185,66,0.1)',
    borderRadius:    radius.full,
    paddingHorizontal: 14,
    paddingVertical:   6,
    alignSelf:       'flex-end',
    marginBottom:    spacing.sm,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  counterText: { fontSize: 12, color: colors.gold, fontWeight: '600' },

  // Image preview
  imageContainer: {
    borderRadius: radius.xl, overflow: 'hidden',
    marginBottom: spacing.md, ...shadows.card,
  },
  image: { width: '100%', height: 240 },
  changeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 10, alignItems: 'center',
  },
  changeText: { color: colors.textPrimary, fontSize: 13 },
  noImageBox: {
    height: 160, borderRadius: radius.xl,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  noImageText: { color: colors.textSecondary, fontSize: 15 },

  // Crop selector
  section: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  label: { fontSize: 13, fontWeight: '700', color: colors.gold, marginBottom: spacing.sm },
  cropSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  cropSelectorText: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  placeholder:      { color: colors.textMuted },
  dropArrow:        { color: colors.gold, fontSize: 12 },
  orText: { fontSize: 12, color: colors.textMuted, marginVertical: 6 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.md, padding: 12,
    color: colors.textPrimary, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 22 },

  // Detect button
  detectBtn:      { borderRadius: radius.lg, overflow: 'hidden', ...shadows.glow },
  detectBtnInner: { padding: 18, alignItems: 'center', justifyContent: 'center' },
  detectBtnText:  { fontSize: 18, fontWeight: '800', color: colors.forestDeep },
  loadingRow:     { flexDirection: 'row', alignItems: 'center' },
  loadingText:    { color: colors.gold, fontSize: 16, fontWeight: '700' },

  // Crop modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0D2E0D',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%',
    borderWidth: 1, borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle:    { fontSize: 16, fontWeight: '700', color: colors.gold },
  modalClose:    { fontSize: 20, color: colors.textSecondary, padding: 4 },
  cropItem: {
    padding: 15,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  cropItemText: { fontSize: 16, color: colors.textPrimary },
});