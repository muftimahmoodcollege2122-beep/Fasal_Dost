// ─────────────────────────────────────────────────────────────────────────────
// src/screens/ResultScreen.js
//
// PURPOSE:
//   Displays the AI disease detection result in a clear, actionable format.
//   Shows: detected disease(s), severity, symptoms, step-by-step treatment,
//   prevention advice, and confidence score.
//
// MULTIPLE DISEASE SUPPORT:
//   A single plant can have more than one disease.
//   If result.diseases has 2+ items, tabs appear at the top to switch between them.
//   The safeArr() helper and index clamping prevent crashes on empty arrays.
//
// HISTORY AUTO-SAVE:
//   On first render, saves the result to local + cloud history.
//   savedRef prevents duplicate saves if screen re-renders.
//
// READING THE IMAGE:
//   ResultScreen reads the crop image from global store (store.js).
//   This is intentional — passing base64 through navigation params corrupts it.
//   If image is null (came from history), it shows a placeholder instead.
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Share, Alert,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import * as Haptics          from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../utils/theme';
import { t, textAlign }     from '../utils/i18n';
import { getImage }         from '../utils/store';
import { saveToHistory }    from '../utils/store';
import * as Speech            from 'expo-speech'; // Urdu voice reader for illiterate farmers
import { Audio } from 'expo-audio';
export default function ResultScreen({ navigation, route }) {
  const lang        = route?.params?.lang        || 'ur';
  const result      = route?.params?.result      || {};
  const cropName    = route?.params?.cropName    || '';
  // fromHistory: true when opened from HistoryScreen — must NOT save again
  const fromHistory = route?.params?.fromHistory || false;

  const insets = useSafeAreaInsets();

  // ── Read image from global store ─────────────────────────────────────────
  // ScanScreen stored it here. If coming from History, uri may be null.
  const { uri: imageUri } = getImage();

  // ── State ─────────────────────────────────────────────────────────────────
  // activeIndex: which disease tab is currently shown (0 = first disease)
  const [activeIndex, setActiveIndex] = useState(0);

  // isSpeaking: true while voice is reading the result aloud
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Ref: prevent double-save ──────────────────────────────────────────────
  // React can re-render this screen multiple times. We only want to save once.
  const savedRef = useRef(false);

  // ── Auto-save to history on mount ─────────────────────────────────────────
  useEffect(() => {
    if (savedRef.current) return; // Already saved in this render cycle
    savedRef.current = true;

    // CRITICAL: Skip save if opened from HistoryScreen — this is a replay.
    // Saving again would create a duplicate entry in history.
    if (fromHistory) return;

    // Only save scans that came directly from the Scan screen
    if (result && typeof result === 'object' && Object.keys(result).length > 0) {
      saveToHistory({ imageUri, cropName, result })
        .catch(err => console.warn('ResultScreen auto-save error:', err.message));
    }
  }, []); // Empty deps — runs once on mount only

  // ── Stop speech if farmer navigates away ─────────────────────────────────
  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Safely return diseases array.
   * @returns {Array} Always an array, never undefined/null
   */
  const safeArr = () =>
    Array.isArray(result?.diseases) ? result.diseases : [];

  /**
   * Get current disease, clamped to array bounds.
   * Prevents crash if activeIndex is out of range.
   * @returns {Object|null}
   */
  const currentDisease = () => {
    const arr = safeArr();
    if (!arr.length) return null;
    const idx = Math.min(activeIndex, arr.length - 1); // Clamp index
    return arr[idx];
  };

  /**
   * Map severity string to display color.
   * @param {'low'|'medium'|'high'} severity
   * @returns {string} Hex color
   */
  const severityColor = (severity) => {
    if (!severity) return colors.textSecondary;
    const s = severity.toLowerCase();
    if (s === 'high')   return colors.danger;
    if (s === 'medium') return colors.warning;
    return colors.success;
  };

  /**
   * Build a plain-text share message from the result.
   * Respects the current language.
   * @returns {string}
   */
  const buildShareText = () => {
    const d = currentDisease();
    if (!d) return `FasalDost: ${lang === 'ur' ? 'فصل صحت مند ہے' : 'Crop is healthy'}`;

    const lines = [
      `🌾 FasalDost — ${lang === 'ur' ? 'فصل کی تشخیص' : 'Crop Diagnosis'}`,
      '',
      `${t('diagnosis', lang)}: ${lang === 'ur' ? d.disease_name_ur : d.disease_name_en}`,
      `${t('severity',  lang)}: ${lang === 'ur' ? t(d.severity, lang) : d.severity}`,
      '',
      `${t('treatment', lang)}:`,
      ...(lang === 'ur' ? (d.treatment_ur || []) : (d.treatment_en || [])).map(s => `• ${s}`),
      '',
      `${t('prevention', lang)}: ${lang === 'ur' ? result.prevention_ur : result.prevention_en}`,
      '',
      '— FasalDost App',
    ];
    return lines.join('\n');
  };

  // ── Voice reader — reads full result in Urdu for illiterate farmers ────────
  // Farmer taps 🔊 → hears full diagnosis in Urdu
  // Tap again while speaking → stops immediately
 const handleSpeak = async () => {
  // If already speaking — stop
  if (isSpeaking) {
    setIsSpeaking(false);
    return;
  }

  const d = currentDisease();

  // Build simple clean Urdu text — short sentences work best
  let text = '';

  if (result.is_healthy) {
    text = 'آپ کی فصل بالکل صحت مند ہے۔ کوئی بیماری نہیں ملی۔';
  } else if (d) {
    const parts = [];

    if (d.disease_name_ur) parts.push(`بیماری: ${d.disease_name_ur}`);

    const sevMap = {
      low:    'خطرہ کم ہے',
      medium: 'خطرہ درمیانہ ہے',
      high:   'خطرہ زیادہ ہے، فوری اقدام کریں',
    };
    if (d.severity) parts.push(sevMap[d.severity] || '');

    if (d.treatment_ur?.length) {
      parts.push('علاج کا طریقہ:');
      d.treatment_ur.forEach((step, i) => parts.push(`${i + 1}: ${step}`));
    }

    if (d.urgency_ur) parts.push(d.urgency_ur);
    if (result.prevention_ur) parts.push(`احتیاط: ${result.prevention_ur}`);

    text = parts.join('۔ ');
  }

  if (!text) return;

  try {
    setIsSpeaking(true);

    // Set audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS:   false,
      playsInSilentModeIOS: true,
    });

    // Google Translate TTS — real natural Urdu voice
    // Splits into chunks of 100 chars max (Google limit)
    const chunks = splitText(text, 100);

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=ur&client=tw-ob&ttsspeed=0.8`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      // Wait for chunk to finish before playing next
      await new Promise(resolve => {
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.didJustFinish) {
            sound.unloadAsync();
            resolve();
          }
        });
      });
    }
  } catch (err) {
    console.warn('Voice error:', err.message);
  } finally {
    setIsSpeaking(false);
  }
};

// Split long text into chunks for Google TTS limit
const splitText = (text, maxLen) => {
  const sentences = text.split('۔');
  const chunks = [];
  let current = '';

  sentences.forEach(sentence => {
    if ((current + sentence).length > maxLen) {
      if (current) chunks.push(current);
      current = sentence;
    } else {
      current += (current ? '۔' : '') + sentence;
    }
  });

  if (current) chunks.push(current);
  return chunks;
};
  // ── Share handler ─────────────────────────────────────────────────────────
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: buildShareText() });
    } catch (err) {
      console.warn('Share error:', err.message);
    }
  };

  // ── Get active disease data ───────────────────────────────────────────────
  const disease = currentDisease();
  const diseases = safeArr();

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
        <Text style={styles.headerTitle}>📋 {t('diagnosis', lang)}</Text>
        {/* Speaker + Share buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* 🔊 Voice reader — for farmers who cannot read */}
          <TouchableOpacity
            style={[styles.shareBtn, isSpeaking && styles.speakerActive]}
            onPress={handleSpeak}
          >
            <Text style={styles.shareBtnText}>{isSpeaking ? '⏹️' : '🔊'}</Text>
          </TouchableOpacity>
          {/* 📤 Share result */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Crop image thumbnail ── */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={{ fontSize: 40 }}>🌿</Text>
          </View>
        )}

        {/* ── Confidence badge ── */}
        {typeof result.overall_confidence === 'number' && (
          <View style={[styles.badge, { alignSelf: textAlign(lang) === 'right' ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.badgeText}>
              🎯 {t('confidence', lang)}: {result.overall_confidence}%
            </Text>
          </View>
        )}

        {/* ── Healthy crop result ── */}
        {result.is_healthy ? (
          <View style={styles.healthyCard}>
            <Text style={styles.healthyEmoji}>✅</Text>
            <Text style={[styles.healthyText, { textAlign: textAlign(lang) }]}>
              {t('healthy', lang)}
            </Text>
            {/* Show prevention advice even for healthy crops */}
            {(result.prevention_ur || result.prevention_en) ? (
              <>
                <Text style={[styles.sectionLabel, { textAlign: textAlign(lang) }]}>
                  🛡️ {t('prevention', lang)}
                </Text>
                <Text style={[styles.bodyText, { textAlign: textAlign(lang) }]}>
                  {lang === 'ur' ? result.prevention_ur : result.prevention_en}
                </Text>
              </>
            ) : null}
          </View>
        ) : (
          <>
            {/* ── Disease tabs (shown if 2+ diseases detected) ── */}
            {diseases.length > 1 && (
              <View style={styles.tabBar}>
                <Text style={[styles.multiLabel, { textAlign: textAlign(lang) }]}>
                  {t('multipleDetected', lang)} ({diseases.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tabs}>
                    {diseases.map((d, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.tab, activeIndex === i && styles.tabActive]}
                        onPress={() => setActiveIndex(i)}
                      >
                        <Text style={[styles.tabText, activeIndex === i && styles.tabTextActive]}>
                          {t('disease', lang)} {i + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ── Disease detail card ── */}
            {disease ? (
              <View style={styles.diseaseCard}>

                {/* Disease name + severity */}
                <View style={styles.diseaseHeader}>
                  <Text style={[styles.diseaseName, { textAlign: textAlign(lang) }]}>
                    🦠 {lang === 'ur' ? disease.disease_name_ur : disease.disease_name_en}
                  </Text>
                  <View style={[styles.severityBadge, { backgroundColor: `${severityColor(disease.severity)}20` }]}>
                    <Text style={[styles.severityText, { color: severityColor(disease.severity) }]}>
                      {t(disease.severity || 'low', lang)}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {(disease.description_en || disease.description_ur) && (
                  <Text style={[styles.bodyText, { textAlign: textAlign(lang) }]}>
                    {lang === 'ur' ? disease.description_ur : disease.description_en}
                  </Text>
                )}

                {/* Symptoms */}
                {((lang === 'ur' ? disease.symptoms_ur : disease.symptoms_en) || []).length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { textAlign: textAlign(lang) }]}>
                      🔍 {t('symptoms', lang)}
                    </Text>
                    {(lang === 'ur' ? disease.symptoms_ur : disease.symptoms_en).map((s, i) => (
                      <Text key={i} style={[styles.listItem, { textAlign: textAlign(lang) }]}>
                        • {s}
                      </Text>
                    ))}
                  </>
                )}

                {/* Treatment steps */}
                {((lang === 'ur' ? disease.treatment_ur : disease.treatment_en) || []).length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { textAlign: textAlign(lang) }]}>
                      💊 {t('treatment', lang)}
                    </Text>
                    {(lang === 'ur' ? disease.treatment_ur : disease.treatment_en).map((step, i) => (
                      <View key={i} style={styles.treatmentStep}>
                        <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                        <Text style={[styles.stepText, { textAlign: textAlign(lang), flex: 1 }]}>{step}</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Urgency notice */}
                {(disease.urgency_en || disease.urgency_ur) && (
                  <View style={styles.urgencyBox}>
                    <Text style={[styles.urgencyText, { textAlign: textAlign(lang) }]}>
                      ⚡ {lang === 'ur' ? disease.urgency_ur : disease.urgency_en}
                    </Text>
                  </View>
                )}

              </View>
            ) : (
              // Fallback if diseases array was unexpectedly empty
              <View style={styles.noDataBox}>
                <Text style={styles.noDataText}>{t('error', lang)}</Text>
              </View>
            )}

            {/* ── Prevention advice ── */}
            {(result.prevention_en || result.prevention_ur) && (
              <View style={styles.preventionCard}>
                <Text style={[styles.sectionLabel, { textAlign: textAlign(lang) }]}>
                  🛡️ {t('prevention', lang)}
                </Text>
                <Text style={[styles.bodyText, { textAlign: textAlign(lang) }]}>
                  {lang === 'ur' ? result.prevention_ur : result.prevention_en}
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── Scan Again button ── */}
        <TouchableOpacity
          style={styles.scanAgainBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.gold, colors.goldDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.scanAgainInner}
          >
            <Text style={styles.scanAgainText}>🔁 {t('scanAgain', lang)}</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forestDeep },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surfaceMid,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  backIcon:     { fontSize: 20, color: colors.textPrimary },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  shareBtn:     { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surfaceMid, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  shareBtnText:  { fontSize: 20 },
  speakerActive: { backgroundColor: 'rgba(244,185,66,0.2)', borderColor: colors.gold },

  scroll:     { padding: spacing.md, paddingBottom: 48 },

  thumbnail:           { width: '100%', height: 200, borderRadius: radius.xl, marginBottom: spacing.sm, ...shadows.card },
  thumbnailPlaceholder:{ height: 100, borderRadius: radius.xl, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },

  badge: { backgroundColor: 'rgba(244,185,66,0.12)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  badgeText: { color: colors.gold, fontSize: 13, fontWeight: '700' },

  // Healthy
  healthyCard:  { backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: radius.xl, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', marginBottom: spacing.md },
  healthyEmoji: { fontSize: 48, marginBottom: 8 },
  healthyText:  { fontSize: 20, fontWeight: '800', color: colors.success, marginBottom: spacing.md },

  // Tabs
  tabBar:      { marginBottom: spacing.sm },
  multiLabel:  { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  tabs:        { flexDirection: 'row', gap: 8 },
  tab:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  tabActive:   { backgroundColor: 'rgba(244,185,66,0.2)', borderColor: colors.gold },
  tabText:     { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  tabTextActive:{ color: colors.gold },

  // Disease card
  diseaseCard:   { backgroundColor: colors.surfaceLight, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  diseaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  diseaseName:   { flex: 1, fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginRight: 8 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  severityText:  { fontSize: 12, fontWeight: '700' },
  bodyText:      { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.sm },
  sectionLabel:  { fontSize: 13, fontWeight: '700', color: colors.gold, marginTop: spacing.sm, marginBottom: 6 },
  listItem:      { fontSize: 14, color: colors.textSecondary, lineHeight: 22, paddingLeft: 8 },
  treatmentStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepNum:       { width: 24, height: 24, borderRadius: radius.full, backgroundColor: 'rgba(244,185,66,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText:   { color: colors.gold, fontSize: 12, fontWeight: '700' },
  stepText:      { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  urgencyBox:    { backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  urgencyText:   { color: colors.danger, fontSize: 13, fontWeight: '600', lineHeight: 20 },

  // Prevention
  preventionCard: { backgroundColor: 'rgba(74,222,128,0.06)', borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(74,222,128,0.15)' },

  noDataBox: { padding: spacing.xl, alignItems: 'center' },
  noDataText: { color: colors.textMuted, fontSize: 14 },

  // Scan Again
  scanAgainBtn:   { borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing.sm, ...shadows.glow },
  scanAgainInner: { padding: 17, alignItems: 'center' },
  scanAgainText:  { fontSize: 17, fontWeight: '800', color: colors.forestDeep },
});
