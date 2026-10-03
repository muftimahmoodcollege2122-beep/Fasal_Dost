// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/FarmerProfileScreen.tsx
// React Native Farmer Profile & Identity Screen (Matching Web Profile)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { ArrowLeft, User, ShieldCheck, Save, LogOut } from 'lucide-react-native';

export function FarmerProfileScreen({
  lang,
  onNavigate,
  onBack,
  onSignOut,
}: {
  lang: 'ur' | 'en' | string;
  onNavigate?: (screen: string, params?: any) => void;
  onBack: () => void;
  onSignOut?: () => void;
}) {
  const isUrdu = lang === 'ur';

  const [name, setName] = useState('Muhammad Tariq Khan');
  const [phone, setPhone] = useState('0300 1234567');
  const [province, setProvince] = useState('Punjab');
  const [district, setDistrict] = useState('Faisalabad');
  const [village, setVillage] = useState('Chak 204 RB');
  const [landSize, setLandSize] = useState('12.5');
  const [crops, setCrops] = useState('Wheat, Cotton, Sugarcane');

  const handleSave = () => {
    Alert.alert(
      isUrdu ? 'کامیابی' : 'Saved',
      isUrdu ? 'کسان پروفائل کامیابی کے ساتھ محفوظ ہو گئی ہے۔' : 'Farmer profile updated successfully!'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <ArrowLeft size={18} color="#0f172a" />
        <Text style={styles.backText}>{isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'کسان پروفائل' : 'Farmer Profile & Farm'}</Text>
      <Text style={styles.subtitle}>{isUrdu ? 'اپنی زرعی زمین اور ذاتی معلومات کا انتظام' : 'Manage your agricultural identity, crops & verification'}</Text>

      {/* Verified Badge Header */}
      <View style={styles.badgeBox}>
        <ShieldCheck size={20} color="#059669" style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.badgeTitle}>{isUrdu ? 'تصدیق شدہ کسان' : 'Verified Genuine Farmer'}</Text>
          <Text style={styles.badgeSub}>{isUrdu ? 'نادرا اور فضل دوست سیکیورٹی سے تصدیق شدہ' : 'NADRA & FasalDost verified seller badge'}</Text>
        </View>
      </View>

      {/* Editable Fields Card */}
      <View style={styles.card}>
        <Text style={styles.label}>{isUrdu ? 'کسان کا پورا نام *' : 'Farmer Full Name *'}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>{isUrdu ? 'موبائل نمبر *' : 'Contact Phone Number *'}</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>{isUrdu ? 'صوبہ' : 'Province'}</Text>
            <TextInput style={styles.input} value={province} onChangeText={setProvince} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{isUrdu ? 'ضلع' : 'District'}</Text>
            <TextInput style={styles.input} value={district} onChangeText={setDistrict} />
          </View>
        </View>

        <Text style={styles.label}>{isUrdu ? 'گاؤں / چک نمبر' : 'Village / Chak Number'}</Text>
        <TextInput style={styles.input} value={village} onChangeText={setVillage} />

        <Text style={styles.label}>{isUrdu ? 'کل زرعی رقبہ (ایکڑ)' : 'Total Farm Area (Acres)'}</Text>
        <TextInput style={styles.input} value={landSize} onChangeText={setLandSize} keyboardType="numeric" />

        <Text style={styles.label}>{isUrdu ? 'اہم فصلیں' : 'Primary Cultivated Crops'}</Text>
        <TextInput style={styles.input} value={crops} onChangeText={setCrops} />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Save size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.saveBtnText}>{isUrdu ? 'پروفائل محفوظ کریں' : 'Save Profile Changes'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Seller Verification Link */}
      {onNavigate && (
        <TouchableOpacity style={styles.verifyLink} onPress={() => onNavigate('SellerVerification')}>
          <Text style={styles.verifyLinkText}>{isUrdu ? 'شناختی کارڈ (CNIC) تصدیق کا جائزہ لیں →' : 'Review CNIC Seller Verification →'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingVertical: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  badgeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', borderRadius: 18, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#a7f3d0' },
  badgeTitle: { fontSize: 13, fontWeight: '800', color: '#065f46' },
  badgeSub: { fontSize: 11, color: '#047857' },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 10, marginBottom: 4, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, height: 44, fontSize: 13, color: '#0f172a' },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  saveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  verifyLink: { padding: 14, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  verifyLinkText: { fontSize: 12, fontWeight: '700', color: '#059669' },
});
