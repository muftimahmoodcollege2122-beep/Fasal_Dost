// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/CreateListingScreen.tsx
// React Native Create Produce Listing Screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';

export function CreateListingScreen({ lang, onBack }: { lang: 'ur' | 'en'; onBack: () => void }) {
  const isUrdu = lang === 'ur';
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = () => {
    if (!cropName || !price) {
      Alert.alert('Error', 'Please fill in crop name and price.');
      return;
    }
    Alert.alert('Success', 'Produce listing posted successfully to marketplace!');
    onBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← {isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'نئی فصل کی لسٹنگ بنائیں' : 'Create Produce Listing'}</Text>
      <Text style={styles.subtitle}>{isUrdu ? 'اپنی فصل کو خریداروں کے لیے منڈی میں درج کریں' : 'List your harvest for local buyers and traders'}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{isUrdu ? 'فصل کا نام *' : 'Crop Name *'}</Text>
        <TextInput style={styles.input} placeholder="e.g. Wheat, Rice, Cotton" value={cropName} onChangeText={setCropName} />

        <Text style={styles.label}>{isUrdu ? 'مقدار (من / کلو)' : 'Quantity (Maund / Kg)'}</Text>
        <TextInput style={styles.input} placeholder="e.g. 100 Maunds" value={quantity} onChangeText={setQuantity} />

        <Text style={styles.label}>{isUrdu ? 'قیمت فی من (PKR) *' : 'Price per Unit (PKR) *'}</Text>
        <TextInput style={styles.input} placeholder="e.g. 3800" keyboardType="numeric" value={price} onChangeText={setPrice} />

        <Text style={styles.label}>{isUrdu ? 'مقام / شہر' : 'Location / City'}</Text>
        <TextInput style={styles.input} placeholder="e.g. Faisalabad" value={location} onChangeText={setLocation} />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
          <Text style={styles.btnText}>{isUrdu ? 'لسٹنگ شائع کریں' : 'Post Listing Now'}</Text>
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
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: 14, marginBottom: 16, color: '#0f172a' },
  btn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
});
