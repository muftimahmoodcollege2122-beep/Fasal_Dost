// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/ScanScreen.tsx
// Crop selector & AI disease detection trigger screen (Identical to Web App)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { ArrowLeft, Camera, Image as ImageIcon, Sparkles, RefreshCw, Sprout, Check } from 'lucide-react-native';
import { Language, t, CROPS } from '../utils/i18n';

export function ScanScreen({
  lang,
  imageUri,
  cropName,
  onCropChange,
  onPickImage,
  onCaptureImage,
  onDetect,
  onBack,
  loading,
}: {
  lang: Language;
  imageUri?: string | null;
  cropName?: string;
  onCropChange?: (crop: string) => void;
  onPickImage: () => void;
  onCaptureImage: () => void;
  onDetect?: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const isUrdu = lang === 'ur';
  const [selectedCrop, setSelectedCrop] = useState(cropName || 'Wheat');

  const handleSelectCrop = (crop: string) => {
    setSelectedCrop(crop);
    if (onCropChange) onCropChange(crop);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={18} color="#0f172a" />
          <Text style={styles.backText}>{isUrdu ? 'واپس' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isUrdu ? 'فصل کی تشخیص' : 'Crop Pathology Scan'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Daily Free Scans Notice */}
      <View style={styles.quotaBanner}>
        <Text style={styles.quotaText}>
          {isUrdu ? 'روزانہ مفت اسکینز دستیاب: 7 میں سے 7 باقی' : 'Daily Free Scans Remaining: 7 of 7'}
        </Text>
      </View>

      {/* Image Preview or Capture Hero */}
      {imageUri ? (
        <View style={styles.imageCard}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <View style={styles.changeBar}>
            <TouchableOpacity style={styles.retakeBtn} onPress={onCaptureImage}>
              <Camera size={14} color="#0f172a" style={{ marginRight: 6 }} />
              <Text style={styles.retakeText}>{isUrdu ? 'کیمرہ تبدیل' : 'Retake'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retakeBtn} onPress={onPickImage}>
              <RefreshCw size={14} color="#0f172a" style={{ marginRight: 6 }} />
              <Text style={styles.retakeText}>{t('tapToChange', lang)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.captureHero}>
          <View style={styles.iconBox}>
            <Camera size={36} color="#0f172a" />
          </View>
          <Text style={styles.heroTitle}>{t('selectCrop', lang)}</Text>
          <Text style={styles.heroSub}>{t('subtitle', lang)}</Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={onCaptureImage}>
              <Camera size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnPrimaryText}>{t('takePhoto', lang)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnSecondary} onPress={onPickImage}>
              <ImageIcon size={18} color="#0f172a" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnSecondaryText}>{t('uploadPhoto', lang)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Crop Selector Chips */}
      <View style={styles.sectionBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Sprout size={16} color="#0f172a" />
          <Text style={styles.sectionTitle}>{t('selectCrop', lang)}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropList}>
          {CROPS.map((c) => {
            const active = selectedCrop.toLowerCase() === c.en.toLowerCase();
            return (
              <TouchableOpacity
                key={c.en}
                style={[styles.cropChip, active && styles.cropChipActive]}
                onPress={() => handleSelectCrop(c.en)}
              >
                {active && <Check size={12} color="#ffffff" style={{ marginRight: 4 }} />}
                <Text style={[styles.cropText, active && styles.cropTextActive]}>{c.en}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Detect Disease CTA Button */}
      {imageUri && (
        <View style={{ marginTop: 20 }}>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#0f172a" />
              <Text style={styles.loadingTitle}>{t('analyzing', lang)}</Text>
              <Text style={styles.loadingSub}>
                {isUrdu ? 'گوگل جیمنائی 3.8 ویژن پیتھالوجی تجزیہ کر رہا ہے...' : 'Gemini 3.8 Vision running cellular plant pathology...'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.detectBtn}
              onPress={() => {
                if (onDetect) onDetect();
              }}
            >
              <Sparkles size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.detectBtnText}>{t('analyzeBtn', lang)}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  quotaBanner: { backgroundColor: '#f0fdf4', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 16, alignItems: 'center' },
  quotaText: { fontSize: 11, fontWeight: '800', color: '#166534' },
  imageCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  previewImage: { width: '100%', height: 240, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  changeBar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  retakeText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  captureHero: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  iconBox: { width: 68, height: 68, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  heroSub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  actionBtnPrimary: { flex: 1, backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionBtnPrimaryText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  actionBtnSecondary: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionBtnSecondaryText: { color: '#0f172a', fontSize: 13, fontWeight: '800' },
  sectionBox: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  cropList: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  cropChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', flexDirection: 'row', alignItems: 'center' },
  cropChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  cropText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  cropTextActive: { color: '#ffffff' },
  detectBtn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  detectBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  loadingCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  loadingTitle: { fontSize: 15, fontWeight: '900', color: '#0f172a', marginTop: 12, marginBottom: 4 },
  loadingSub: { fontSize: 11, color: '#64748b', textAlign: 'center' },
});
