// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/SubscriptionScreen.tsx
// React Native Subscription & Payment Screen (Executive Monochrome Slate Theme)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { ArrowLeft, Crown, Smartphone, Building2, CreditCard, Check, Sparkles } from 'lucide-react-native';

const API_BASE_URL = 'https://ais-dev-hexsq6a75nx3v7mukdbtq4-171051146732.asia-southeast1.run.app';

export function SubscriptionScreen({ lang, onBack }: { lang: 'ur' | 'en'; onBack: () => void }) {
  const isUrdu = lang === 'ur';
  const [selectedPlan, setSelectedPlan] = useState<'gold' | 'diamond' | 'unlimited'>('gold');
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank' | 'card'>('easypaisa');
  const [refId, setRefId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!refId || refId.trim().length < 6) {
      Alert.alert(
        isUrdu ? 'ضروری معلومات' : 'Verification Required',
        isUrdu ? 'براہ کرم ادائیگی کی تصدیق کے لیے درست ٹرانزیکشن حوالہ ID (کم از کم 6 ہندسے) درج کریں۔' : 'Please enter a valid Transaction Reference ID (min 6 chars) to authenticate payment.'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle: 'monthly',
          paymentMethod,
          paymentReference: refId.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert(
          isUrdu ? 'سبسکرپشن فعال ہو گئی!' : 'Subscription Activated!',
          isUrdu ? 'آپ کا پلان کامیابی سے فعال کر دیا گیا ہے۔' : 'Your subscription plan has been authenticated & activated successfully.'
        );
        onBack();
      } else {
        Alert.alert('Payment Error', data.error?.message || 'Payment authentication failed.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not connect to payment gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <ArrowLeft size={20} color="#0f172a" />
        <Text style={styles.backText}>{isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Crown size={22} color="#0f172a" />
        <Text style={styles.title}>{isUrdu ? 'فضل دوست پریمیم پیکجز' : 'Subscription Plans'}</Text>
      </View>
      <Text style={styles.subtitle}>{isUrdu ? 'لامحدود اسکینز اور ترجیحی اے آئی سروسز' : 'Unlock unlimited crop scans & priority AI features'}</Text>

      <TouchableOpacity
        style={[styles.planCard, selectedPlan === 'gold' && styles.planCardActive]}
        onPress={() => setSelectedPlan('gold')}
      >
        <View style={styles.planHeader}>
          <Text style={[styles.planTitle, selectedPlan === 'gold' && styles.textWhite]}>
            {isUrdu ? 'گولڈ پلان (250 اسکینز/ماہ)' : 'Gold Plan (250 scans/mo)'}
          </Text>
          {selectedPlan === 'gold' && <Check size={18} color="#ffffff" />}
        </View>
        <Text style={[styles.planPrice, selectedPlan === 'gold' && styles.textWhite]}>PKR 299 / {isUrdu ? 'ماہ' : 'mo'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.planCard, selectedPlan === 'diamond' && styles.planCardActive]}
        onPress={() => setSelectedPlan('diamond')}
      >
        <View style={styles.planHeader}>
          <Text style={[styles.planTitle, selectedPlan === 'diamond' && styles.textWhite]}>
            {isUrdu ? 'ڈائمنڈ پلان (500 اسکینز/ماہ)' : 'Diamond Plan (500 scans/mo)'}
          </Text>
          {selectedPlan === 'diamond' && <Check size={18} color="#ffffff" />}
        </View>
        <Text style={[styles.planPrice, selectedPlan === 'diamond' && styles.textWhite]}>PKR 599 / {isUrdu ? 'ماہ' : 'mo'}</Text>
      </TouchableOpacity>

      <div style={{}} />
      <View style={styles.payBox}>
        <Text style={styles.payLabel}>{isUrdu ? 'ادائیگی کا طریقہ منتخب کریں' : 'Select Payment Gateway'}</Text>
        <View style={styles.gatewayGrid}>
          {[
            { id: 'easypaisa', name: 'EasyPaisa', icon: Smartphone },
            { id: 'jazzcash', name: 'JazzCash', icon: Smartphone },
            { id: 'bank', name: 'Bank Transfer', icon: Building2 },
            { id: 'card', name: 'Debit Card', icon: CreditCard },
          ].map((m) => {
            const Icon = m.icon;
            const active = paymentMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.gatewayBtn, active && styles.gatewayBtnActive]}
                onPress={() => setPaymentMethod(m.id as any)}
              >
                <Icon size={16} color={active ? '#ffffff' : '#64748b'} />
                <Text style={[styles.gatewayText, active && styles.gatewayTextActive]}>{m.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.payLabel}>{isUrdu ? 'ٹرانزیکشن حوالہ ID (کم از کم 6 ہندسے)' : 'Transaction Reference ID (min 6 chars)'}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. TID-98273612"
          value={refId}
          onChangeText={setRefId}
        />

        <TouchableOpacity style={styles.subBtn} onPress={handleSubscribe} disabled={loading}>
          <Sparkles size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.subBtnText}>{loading ? (isUrdu ? 'پروسیسنگ...' : 'Verifying Payment...') : (isUrdu ? 'ادائیگی کی تصدیق کریں اور سبسکرائب کریں' : 'Verify Payment & Subscribe')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginBottom: 20 },
  planCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  planCardActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  planTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  planPrice: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  textWhite: { color: '#ffffff' },
  payBox: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginTop: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  payLabel: { fontSize: 12, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  gatewayGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  gatewayBtn: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  gatewayBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a', borderWidth: 2 },
  gatewayText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  gatewayTextActive: { color: '#ffffff' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: 14, marginBottom: 16, color: '#0f172a' },
  subBtn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  subBtnText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
});
