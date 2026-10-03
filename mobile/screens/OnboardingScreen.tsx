// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/OnboardingScreen.tsx
// React Native 5-Point Farmer Onboarding Screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';

export function OnboardingScreen({ lang, onComplete }: { lang: 'ur' | 'en'; onComplete: (profile: any) => void }) {
  const isUrdu = lang === 'ur';
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [cnic, setCnic] = useState('');

  const handleNext = () => {
    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      if (!name || !phone) {
        Alert.alert('Error', 'Please enter your name and phone number.');
        return;
      }
      onComplete({ name, phone, village, district, cnic });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isUrdu ? `کسان سیٹ اپ (${step}/5)` : `Farmer Setup (${step}/5)`}</Text>
      </View>

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>{isUrdu ? 'زبان کا انتخاب' : 'Language Preference'}</Text>
          <Text style={styles.stepSub}>{isUrdu ? 'آپ نے اردو منتخب کی ہے۔' : 'English selected.'}</Text>
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>{isUrdu ? 'آپ کا نام کیا ہے؟' : 'What is your Name?'}</Text>
          <TextInput style={styles.input} placeholder="e.g. Muhammad Tariq" value={name} onChangeText={setName} />
        </View>
      )}

      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>{isUrdu ? 'آپ کا موبائل نمبر' : 'Your Mobile Number'}</Text>
          <TextInput style={styles.input} placeholder="0300 1234567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        </View>
      )}

      {step === 4 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>{isUrdu ? 'گاؤں اور ضلع' : 'Village & District'}</Text>
          <TextInput style={styles.input} placeholder="Village / Chak" value={village} onChangeText={setVillage} />
          <TextInput style={styles.input} placeholder="District e.g. Faisalabad" value={district} onChangeText={setDistrict} />
        </View>
      )}

      {step === 5 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>{isUrdu ? 'شناختی کارڈ نمبر (CNIC)' : 'CNIC Verification'}</Text>
          <TextInput style={styles.input} placeholder="33102-1234567-1" value={cnic} onChangeText={setCnic} />
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleNext}>
        <Text style={styles.btnText}>{step === 5 ? (isUrdu ? 'سیٹ اپ مکمل کریں' : 'Complete Setup') : (isUrdu ? 'آگے بڑھیں' : 'Continue')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40, justifyContent: 'center', flexGrow: 1 },
  header: { marginBottom: 20, alignItems: 'center' },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  stepTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  stepSub: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: 14, marginBottom: 12, color: '#0f172a' },
  btn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
});
