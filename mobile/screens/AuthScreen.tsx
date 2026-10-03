// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/AuthScreen.tsx
// React Native Farmer Sign In & OTP Screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';

export function AuthScreen({ onSuccess, onSkip }: { onSuccess: () => void; onSkip: () => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    setOtpSent(true);
    Alert.alert('OTP Sent', 'Verification code sent to your email.');
  };

  const handleVerify = () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }
    onSuccess();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>FasalDost Secure Login</Text>
        <Text style={styles.subtitle}>Sign in with email OTP or phone verification</Text>

        {!otpSent ? (
          <>
            <TextInput style={styles.input} placeholder="farmer@example.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <TouchableOpacity style={styles.btn} onPress={handleSendOtp}>
              <Text style={styles.btnText}>Send OTP Code</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput style={styles.input} placeholder="Enter 6-digit OTP" keyboardType="number-pad" value={otp} onChangeText={setOtp} />
            <TouchableOpacity style={styles.btn} onPress={handleVerify}>
              <Text style={styles.btnText}>Verify & Login</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#64748b', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: 14, marginBottom: 12, color: '#0f172a' },
  btn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  btnText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
});
