// ─────────────────────────────────────────────────────────────────────────────
// src/screens/HistoryScreen.js
//
// PURPOSE:
//   Shows the list of all past scan results stored locally on the device.
//   Each entry shows: crop image thumbnail, disease name, severity, crop, date.
//   Tapping an entry replays the result in ResultScreen.
//
// DATA SOURCE:
//   Local AsyncStorage only (getHistory from store.js).
//   Firestore records are write-only from this app — we do not query them here
//   because that would require internet and authentication.
//
// IMPORTANT:
//   When replaying a history item, we do NOT put the image URI into the
//   global image store. The image may no longer exist (OS clears temp cache).
//   ResultScreen handles null imageUri gracefully with a placeholder.
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect }    from '@react-navigation/native';
import { colors, spacing, radius } from '../utils/theme';
import { t, textAlign }            from '../utils/i18n';
import { getHistory, clearHistory, clearImage, deleteHistoryItem } from '../utils/store';

export default function HistoryScreen({ navigation, route }) {
  const lang   = route?.params?.lang || 'ur';
  const insets = useSafeAreaInsets();

  // ── State ─────────────────────────────────────────────────────────────────
  const [items,   setItems]   = useState([]);   // History entries array
  const [loading, setLoading] = useState(true); // True while loading from AsyncStorage

  // ── Load history on screen focus ─────────────────────────────────────────
  // Reloads every time screen gains focus, so new scans appear immediately.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const history = await getHistory();
        if (active) {
          setItems(history);
          setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  // ── Replay a history item ─────────────────────────────────────────────────
  // Clears the global image store (old image from a live scan shouldn't show)
  // then navigates to ResultScreen with the saved result.
  const openItem = (item) => {
    // Clear global image store — history items should not show stale scan images
    clearImage();

    // Pass fromHistory: true so ResultScreen skips auto-save (prevents duplicates)
    navigation.navigate('Result', {
      lang,
      result:      item.result   || {},
      cropName:    item.cropName || '',
      fromHistory: true,
    });
  };

  // ── Delete a single history item ──────────────────────────────────────────
  const handleDeleteItem = (item) => {
    Alert.alert(
      '',
      lang === 'ur' ? 'یہ اسکین حذف کریں؟' : 'Delete this scan?',
      [
        { text: lang === 'ur' ? 'منسوخ' : 'Cancel', style: 'cancel' },
        {
          text:  lang === 'ur' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteHistoryItem(item.id);
            if (ok) setItems(prev => prev.filter(i => i.id !== item.id));
          },
        },
      ]
    );
  };

  // ── Clear all history ─────────────────────────────────────────────────────
  const handleClear = () => {
    Alert.alert(
      '',
      t('clearConfirm', lang),
      [
        { text: t('cancel', lang), style: 'cancel' },
        {
          text:  t('yes', lang),
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setItems([]); // Update UI immediately
          },
        },
      ]
    );
  };

  // ── Severity color helper ─────────────────────────────────────────────────
  const severityColor = (sev) => {
    if (!sev) return colors.textSecondary;
    const s = sev.toLowerCase();
    if (s === 'high')   return colors.danger;
    if (s === 'medium') return colors.warning;
    return colors.success;
  };

  // ── Format date for display ───────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return iso.split('T')[0] || ''; // Fallback: just the date part
    }
  };

  // ── Render a single history card ──────────────────────────────────────────
  const renderItem = ({ item }) => {
    // Extract first disease for display (most scans will have 1 disease)
    const diseases    = Array.isArray(item.result?.diseases) ? item.result.diseases : [];
    const firstDisease = diseases[0];
    const isHealthy   = item.result?.is_healthy;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openItem(item)}
        activeOpacity={0.8}
      >
        {/* Thumbnail or placeholder */}
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={{ fontSize: 28 }}>🌿</Text>
          </View>
        )}

        {/* Text content */}
        <View style={styles.cardContent}>
          {/* Disease or healthy label */}
          <Text style={[styles.diseaseName, { textAlign: textAlign(lang) }]} numberOfLines={1}>
            {isHealthy
              ? `✅ ${t('healthy', lang)}`
              : firstDisease
                ? `🦠 ${lang === 'ur' ? firstDisease.disease_name_ur : firstDisease.disease_name_en}`
                : `🌿 ${t('diagnosis', lang)}`
            }
          </Text>

          {/* Severity badge */}
          {!isHealthy && firstDisease?.severity && (
            <Text style={[styles.severity, { color: severityColor(firstDisease.severity), textAlign: textAlign(lang) }]}>
              ● {t(firstDisease.severity, lang)}
            </Text>
          )}

          {/* Multiple diseases indicator */}
          {diseases.length > 1 && (
            <Text style={[styles.multiTag, { textAlign: textAlign(lang) }]}>
              +{diseases.length - 1} {t('multipleDetected', lang)}
            </Text>
          )}

          {/* Crop name */}
          {item.cropName ? (
            <Text style={[styles.cropTag, { textAlign: textAlign(lang) }]}>
              🌾 {item.cropName}
            </Text>
          ) : null}

          {/* Date */}
          <Text style={[styles.date, { textAlign: textAlign(lang) }]}>
            📅 {formatDate(item.date)}
          </Text>
        </View>

        {/* Right side: delete + chevron */}
        <View style={styles.cardRight}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteItem(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
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
        <Text style={styles.headerTitle}>📋 {t('history', lang)}</Text>
        {/* Clear button — only shown when history is not empty */}
        {items.length > 0 ? (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>🗑️</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* ── Content ── */}
      {loading ? (
        // Loading state
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      ) : items.length === 0 ? (
        // Empty state
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🌾</Text>
          <Text style={[styles.emptyTitle, { textAlign: 'center' }]}>{t('noHistory', lang)}</Text>
          <Text style={[styles.emptyDesc,  { textAlign: 'center' }]}>{t('noHistoryDesc', lang)}</Text>
        </View>
      ) : (
        // History list
        <FlatList
          data={items}
          keyExtractor={(item) => item.id || item.date || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forestDeep },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

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
  backIcon:    { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  clearBtn:    { width: 40, height: 40, borderRadius: radius.full, backgroundColor: 'rgba(248,113,113,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  clearText:   { fontSize: 20 },

  list: { padding: spacing.md, paddingBottom: 48 },

  // History card
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.surfaceLight,
    borderRadius:    radius.lg,
    marginBottom:    spacing.sm,
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        'hidden',
  },
  thumb:            { width: 80, height: 80 },
  thumbPlaceholder: { width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  cardContent:      { flex: 1, padding: 12, gap: 2 },
  diseaseName:      { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  severity:         { fontSize: 12, fontWeight: '600' },
  multiTag:         { fontSize: 11, color: colors.gold },
  cropTag:          { fontSize: 12, color: colors.textSecondary },
  date:             { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardRight:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteBtn:        { padding: 8 },
  deleteIcon:       { fontSize: 16 },
  arrow:            { fontSize: 22, color: colors.textMuted, paddingRight: 12 },

  // Empty state
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  emptyDesc:  { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});