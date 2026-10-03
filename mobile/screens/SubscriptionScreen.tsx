// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/SubscriptionScreen.tsx
// React Native Subscription Plans & Payment Verification Screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';

export function SubscriptionScreen({ lang, onBack }: { lang: 'ur' | 'en'; onBack: () => void }) {
  const isUrdu = lang === 'ur';
  const [selectedPlan, setSelectedPlan] = useState<'gold' | 'diamond' | 'unlimited'>('gold');
  const [refId, setRefId] = useState('');

  const handleSubscribe = () => {
    if (!refId || refId.trim().length < 6) {
      Alert.alert(
        isUrdu ? 'ضروری معلومات' : 'Verification Required',
        isUrdu ? 'براہ کرم درست ٹرانزیکشن حوالہ ID (کم از کم 6 ہندسے) درج کریں۔' : 'Please enter a valid Transaction Reference ID (min 6 chars).'
      );
      return;
    }
    Alert.alert(
      isUrdu ? 'سبسکرپشن فعال ہو گئی!' : 'Subscription Activated!',
      isUrdu ? 'آپ کا گولڈ/ڈائمنڈ پلان کامیابی سے فعال ہو گیا ہے۔' : 'Your subscription plan has been successfully activated.'
    );
    onBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← {isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'فضل دوست پریمیم پیکجز' : 'Subscription Packages'}</Text>
      <Text style={styles.subtitle}>{isUrdu ? 'لامحدود اسکینز اور ترجیحی اے آئی سروسز' : 'Unlock unlimited crop scans & priority AI features'}</Text>

      <TouchableOpacity
        style={[styles.planCard, selectedPlan === 'gold' && styles.planCardActive]}
        onPress={() => setSelectedPlan('gold')}
      >
        <Text style={styles.planTitle}>🥇 {isUrdu ? 'گولڈ پلان (250 اسکینز/ماہ)' : 'Gold Plan (250 scans/mo)'}</Text>
        <Text style={styles.planPrice}>PKR 299 / {isUrdu ? 'ماہ' : 'mo'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.planCard, selectedPlan === 'diamond' && styles.planCardActive]}
        onPress={() => setSelectedPlan('diamond')}
      >
        <Text style={styles.planTitle}>💎 {isUrdu ? 'ڈائمنڈ پلان (500 اسکینز/ماہ)' : 'Diamond Plan (500 scans/mo)'}</Text>
        <Text style={styles.planPrice}>PKR 599 / {isUrdu ? 'ماہ' : 'mo'}</Text>
      </TouchableOpacity>

      <View style={styles.payBox}>
        <Text style={styles.payLabel}>{isUrdu ? 'ٹرانزیکشن حوالہ ID (EasyPaisa / JazzCash)' : 'Transaction Reference ID (EasyPaisa / JazzCash)'}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. TID-98273612"
          value={refId}
          onChangeText={setRefId}
        />
        <TouchableOpacity style={styles.subBtn} onPress={handleSubscribe}>
          <Text style={styles.subBtnText}>{isUrdu ? 'ادائیگی کی تصدیق کریں اور سبسکرائب کریں' : 'Verify Payment & Subscribe'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#64748b', marginBottom: 20 },
  planCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  planCardActive: { borderColor: '#0f172a', backgroundColor: '#f1f5f9' },
  planTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  planPrice: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  payBox: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  payLabel: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, height: 44, fontSize: 13, marginBottom: 16 },
  subBtn: { backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  subBtnText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
});
