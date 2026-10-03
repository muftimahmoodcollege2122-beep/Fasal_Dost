// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/ResultScreen.tsx
// React Native Diagnostic Result & Voice Narration Screen matching exact web UI
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ArrowLeft, Volume2, Square, Check, Sparkles } from 'lucide-react-native';

export function ResultScreen({ lang, result, imageUri, onPlayAudio, playingAudio, onBack }: { lang: 'ur' | 'en'; result: any; imageUri: string | null; onPlayAudio: () => void; playingAudio: boolean; onBack: () => void }) {
  const isUrdu = lang === 'ur';
  const disease = result?.diseases?.[0] || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <ArrowLeft size={20} color="#0f172a" />
        <Text style={styles.backText}>{isUrdu ? 'نیا اسکین' : 'New Scan'}</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{result?.severity_en || 'Moderate'}</Text>
        </View>

        <Text style={styles.cropName}>{result?.crop_detected_en || 'Crop'}</Text>
        <Text style={styles.diseaseName}>{disease.disease_name_en || 'Plant Disease'}</Text>

        <TouchableOpacity style={[styles.audioBtn, playingAudio && styles.audioBtnActive]} onPress={onPlayAudio}>
          {playingAudio ? <Square size={16} color="#ffffff" style={{ marginRight: 8 }} /> : <Volume2 size={16} color="#ffffff" style={{ marginRight: 8 }} />}
          <Text style={styles.audioBtnText}>
            {playingAudio ? 'Stop Voice Narration' : 'Listen to AI Voice Cure'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{isUrdu ? 'تشخیص اور علامات' : 'Pathological Assessment'}</Text>
        <Text style={styles.desc}>{disease.description_en || 'No description available.'}</Text>

        <Text style={styles.sectionTitle}>{isUrdu ? 'تجویز کردہ علاج' : 'Recommended Treatments'}</Text>
        {disease.treatment_en?.map((t: string, i: number) => (
          <View key={i} style={styles.bulletRow}>
            <Check size={14} color="#059669" style={{ marginTop: 3, marginRight: 8 }} />
            <Text style={styles.bulletText}>{t}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingVertical: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  image: { width: '100%', height: 210, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#fde68a' },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#b45309', textTransform: 'uppercase' },
  cropName: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  diseaseName: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 16 },
  audioBtn: { backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  audioBtnActive: { backgroundColor: '#dc2626' },
  audioBtnText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 16, marginBottom: 6 },
  desc: { fontSize: 13, color: '#475569', lineHeight: 20 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  bulletText: { fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 },
});
