// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/ScanScreen.tsx
// React Native Scan & Camera Screen matching exact web UI
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, Camera, Image as ImageIcon, Sparkles } from 'lucide-react-native';

export function ScanScreen({ lang, onPickImage, onCaptureImage, onBack, loading }: { lang: 'ur' | 'en'; onPickImage: () => void; onCaptureImage: () => void; onBack: () => void; loading: boolean }) {
  const isUrdu = lang === 'ur';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <ArrowLeft size={20} color="#0f172a" />
        <Text style={styles.backText}>{isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Camera size={36} color="#0f172a" />
        </View>
        <Text style={styles.title}>{isUrdu ? 'فصل کی بیماری کا اسکین' : 'Crop Disease Diagnosis'}</Text>
        <Text style={styles.subtitle}>
          {isUrdu
            ? 'پتے کی صاف تصویر کیمرے سے بنائیں یا گیلری سے منتخب کریں۔'
            : 'Capture a clear photo of the infected crop leaf or select from gallery for AI pathology.'}
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>{isUrdu ? 'اے آئی تجزیہ جاری ہے...' : 'Analyzing with Gemini AI...'}</Text>
          </View>
        ) : (
          <View style={styles.btnGroup}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onCaptureImage}>
              <Camera size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>{isUrdu ? 'تصویر بنائیں (کیمرہ)' : 'Capture Photo'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={onPickImage}>
              <ImageIcon size={18} color="#0f172a" style={{ marginRight: 8 }} />
              <Text style={styles.secondaryBtnText}>{isUrdu ? 'گیلری سے تصویر منتخب کریں' : 'Choose from Gallery'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 20, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  card: { backgroundColor: '#ffffff', borderRadius: 28, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  iconBox: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 18, paddingHorizontal: 10 },
  loadingBox: { alignItems: 'center', paddingVertical: 20 },
  loadingText: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 12 },
  btnGroup: { width: '100%', gap: 12 },
  primaryBtn: { backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  primaryBtnText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  secondaryBtn: { backgroundColor: '#f8fafc', paddingVertical: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  secondaryBtnText: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
});
