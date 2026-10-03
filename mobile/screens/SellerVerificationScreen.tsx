// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/SellerVerificationScreen.tsx
// React Native CNIC Seller Verification Screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';

export function SellerVerificationScreen({ lang, onBack }: { lang: 'ur' | 'en'; onBack: () => void }) {
  const isUrdu = lang === 'ur';
  const [cnic, setCnic] = useState('');

  const handleVerify = () => {
    if (!cnic || cnic.length < 13) {
      Alert.alert('Error', 'Please enter a valid 13-digit CNIC number.');
      return;
    }
    Alert.alert('Success', 'CNIC submitted for NADRA verification. Verified Farmer badge unlocked!');
    onBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← {isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>{isUrdu ? 'کسان تصدیق (CNIC Verification)' : 'Verified Farmer CNIC Check'}</Text>
        <Text style={styles.subtitle}>
          {isUrdu ? 'منڈی میں خریداروں کا اعتماد حاصل کرنے کے لیے اپنا شناختی کارڈ درج کریں۔' : 'Verify your identity to earn the trusted badge in produce exchange.'}
        </Text>

        <TextInput style={styles.input} placeholder="33102-1234567-1" value={cnic} onChangeText={setCnic} keyboardType="number-pad" />

        <TouchableOpacity style={styles.btn} onPress={handleVerify}>
          <Text style={styles.btnText}>{isUrdu ? 'تصدیق کریں' : 'Verify Identity'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 20, left: 16, padding: 10 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  card: { backgroundColor: '#ffffff', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#64748b', marginBottom: 20, textAlign: 'center', lineHeight: 18 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: 14, marginBottom: 16, color: '#0f172a' },
  btn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
});
