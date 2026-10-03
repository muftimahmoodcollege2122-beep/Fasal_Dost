// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/ResultScreen.tsx
// React Native Diagnostic Result & Voice Narration Screen matching exact web UI
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Share } from 'react-native';
import { ArrowLeft, Volume2, Square, Check, AlertTriangle, ShieldCheck, Share2, Sparkles } from 'lucide-react-native';

export function ResultScreen({
  lang,
  result,
  imageUri,
  onPlayAudio,
  playingAudio,
  onBack,
}: {
  lang: 'ur' | 'en' | string;
  result: any;
  imageUri: string | null;
  onPlayAudio: () => void;
  playingAudio: boolean;
  onBack: () => void;
}) {
  const isUrdu = lang === 'ur';
  const isRejected = result?.rejection_code && result.rejection_code !== 'NONE';
  const isHealthy = !isRejected && result?.is_healthy;
  const diseases = result?.diseases || [];
  const primaryDisease = diseases[0] || {};

  const handleShare = async () => {
    try {
      const title = `FasalDost Diagnosis: ${result?.crop_detected_en || 'Crop'}`;
      const message = `${title}\nStatus: ${isHealthy ? 'Healthy' : primaryDisease.disease_name_en || 'Diagnosed'}\nConfidence: ${result?.overall_confidence || 95}%\n\nDiagnosed with FasalDost AI Agronomist`;
      await Share.share({ title, message });
    } catch {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={18} color="#0f172a" />
          <Text style={styles.backText}>{isUrdu ? 'نیا اسکین' : 'New Scan'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Share2 size={16} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      {/* Case 1: Rejection (Blurry, Non-plant, or Unclear Specimen) */}
      {isRejected ? (
        <View style={[styles.card, styles.rejectCard]}>
          <View style={styles.rejectIconBox}>
            <AlertTriangle size={32} color="#dc2626" />
          </View>
          <Text style={styles.rejectTitle}>
            {result?.rejection_code === 'NON_PLANT_IMAGE'
              ? isUrdu
                ? 'پودے کی تصویر نہیں ہے'
                : 'Non-Plant Image Detected'
              : isUrdu
              ? 'تصویر واضح نہیں ہے'
              : 'Unclear Photograph'}
          </Text>
          <Text style={styles.rejectDesc}>
            {isUrdu
              ? result?.rejection_reason_ur || 'براہ کرم کسی زندہ پودے یا فصل کے پتے کی صاف تصویر لیں۔'
              : result?.rejection_reason_en || 'Please take a clear close-up photograph of an authentic live crop leaf.'}
          </Text>
          <TouchableOpacity style={styles.reScanBtn} onPress={onBack}>
            <Sparkles size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.reScanBtnText}>{isUrdu ? 'دوبارہ صاف تصویر لیں' : 'Retake Clear Photo'}</Text>
          </TouchableOpacity>
        </View>
      ) : isHealthy ? (
        /* Case 2: Healthy Crop */
        <View style={styles.card}>
          <View style={styles.healthyBadge}>
            <ShieldCheck size={16} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.healthyBadgeText}>{isUrdu ? 'فصل بالکل صحت مند ہے' : '100% Healthy Crop'}</Text>
          </View>

          <Text style={styles.cropName}>{result?.crop_detected_en || 'Crop'}</Text>
          <Text style={styles.healthyTitle}>{isUrdu ? 'کوئی بیماری نہیں پائی گئی' : 'No Pathological Disease Detected'}</Text>

          <View style={styles.confidenceBarContainer}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>{isUrdu ? 'اے آئی اعتماد' : 'AI Confidence'}</Text>
              <Text style={styles.confidenceVal}>{result?.overall_confidence || 98}%</Text>
            </View>
            <View style={styles.confidenceTrack}>
              <View style={[styles.confidenceFill, { width: `${result?.overall_confidence || 98}%`, backgroundColor: '#10b981' }]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>{isUrdu ? 'حفاظتی تدابیر اور دیکھ بھال' : 'Preventative Care Advice'}</Text>
          <Text style={styles.desc}>
            {isUrdu
              ? result?.prevention_ur || 'فصل کو مناسب وقت پر پانی دیں اور متوازن کھاد کا استعمال جاری رکھیں۔'
              : result?.prevention_en || 'Maintain optimal irrigation schedules, balanced fertilization, and monitor periodically for pests.'}
          </Text>
        </View>
      ) : (
        /* Case 3: Diagnosed Plant Disease */
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{primaryDisease.severity?.toUpperCase() || 'MODERATE'} RISK</Text>
          </View>

          <Text style={styles.cropName}>{result?.crop_detected_en || 'Crop'}</Text>
          <Text style={styles.diseaseName}>{primaryDisease.disease_name_en || 'Identified Plant Disease'}</Text>

          {/* AI Audio Narration Button */}
          <TouchableOpacity style={[styles.audioBtn, playingAudio && styles.audioBtnActive]} onPress={onPlayAudio}>
            {playingAudio ? <Square size={16} color="#ffffff" style={{ marginRight: 8 }} /> : <Volume2 size={16} color="#ffffff" style={{ marginRight: 8 }} />}
            <Text style={styles.audioBtnText}>
              {playingAudio ? (isUrdu ? 'آواز بند کریں' : 'Stop Narration') : (isUrdu ? 'طبی علاج سنیں (آڈیو)' : 'Listen to AI Voice Cure')}
            </Text>
          </TouchableOpacity>

          {/* Confidence Score Bar */}
          <View style={styles.confidenceBarContainer}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>{isUrdu ? 'اے آئی اعتماد' : 'AI Pathology Confidence'}</Text>
              <Text style={styles.confidenceVal}>{result?.overall_confidence || primaryDisease.confidence || 92}%</Text>
            </View>
            <View style={styles.confidenceTrack}>
              <View style={[styles.confidenceFill, { width: `${result?.overall_confidence || primaryDisease.confidence || 92}%` }]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>{isUrdu ? 'تشخیص اور علامات' : 'Pathological Symptoms'}</Text>
          <Text style={styles.desc}>{primaryDisease.description_en || 'Visual pathology detected in leaf tissue.'}</Text>

          <Text style={styles.sectionTitle}>{isUrdu ? 'تجویز کردہ علاج (کیمیکل اور نامیاتی)' : 'Prescribed Treatments & Remedies'}</Text>
          {primaryDisease.treatment_en?.map((t: string, i: number) => (
            <View key={i} style={styles.bulletRow}>
              <Check size={14} color="#059669" style={{ marginTop: 3, marginRight: 8 }} />
              <Text style={styles.bulletText}>{t}</Text>
            </View>
          ))}
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
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  image: { width: '100%', height: 220, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fde68a' },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#b45309', textTransform: 'uppercase' },
  cropName: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  diseaseName: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 16 },
  audioBtn: { backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  audioBtnActive: { backgroundColor: '#dc2626' },
  audioBtnText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  confidenceBarContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confidenceLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  confidenceVal: { fontSize: 11, fontWeight: '900', color: '#0f172a' },
  confidenceTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: '100%', backgroundColor: '#0f172a', borderRadius: 3 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 14, marginBottom: 6 },
  desc: { fontSize: 13, color: '#475569', lineHeight: 20 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  bulletText: { fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 },
  rejectCard: { alignItems: 'center', paddingVertical: 32 },
  rejectIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  rejectTitle: { fontSize: 18, fontWeight: '900', color: '#991b1b', marginBottom: 8, textAlign: 'center' },
  rejectDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20, paddingHorizontal: 10 },
  reScanBtn: { backgroundColor: '#0f172a', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  reScanBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  healthyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 12 },
  healthyBadgeText: { fontSize: 12, fontWeight: '800', color: '#065f46' },
  healthyTitle: { fontSize: 20, fontWeight: '900', color: '#059669', marginBottom: 16 },
});
