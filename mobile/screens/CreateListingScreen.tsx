// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/CreateListingScreen.tsx
// React Native Create Produce Listing Screen (Identical to Web Experience)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { ArrowLeft, Camera, Plus, Check, Store } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Language, CROPS } from '../utils/i18n';
import { mobileApi } from '../utils/api';

const UNITS = ['Maund', 'Kg', 'Ton', 'Bag', 'Crate'];
const QUALITY_LIST = ['Premium Quality', 'Grade A', 'Standard'];

export function CreateListingScreen({
  lang,
  onBack,
}: {
  lang: 'ur' | 'en' | string;
  onBack: () => void;
}) {
  const isUrdu = lang === 'ur';

  const [cropName, setCropName] = useState('Wheat');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Maund');
  const [price, setPrice] = useState('');
  const [quality, setQuality] = useState('Premium Quality');
  const [district, setDistrict] = useState('Faisalabad');
  const [province, setProvince] = useState('Punjab');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (!res.canceled && res.assets[0]?.base64) {
        const dataUrl = `data:image/jpeg;base64,${res.assets[0].base64}`;
        setImages((prev) => [...prev, dataUrl]);
      }
    } catch {}
  };

  const handleCapturePhoto = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (!res.canceled && res.assets[0]?.base64) {
        const dataUrl = `data:image/jpeg;base64,${res.assets[0].base64}`;
        setImages((prev) => [...prev, dataUrl]);
      }
    } catch {}
  };

  const handleSubmit = async () => {
    if (!cropName || !price || !quantity) {
      Alert.alert(
        isUrdu ? 'ضروری معلومات' : 'Required Information',
        isUrdu ? 'براہ کرم فصل کا نام، مقدار اور قیمت درج کریں۔' : 'Please specify crop name, quantity, and price.'
      );
      return;
    }

    setLoading(true);
    try {
      await mobileApi.marketplace.createListing({
        cropName,
        variety,
        quantity,
        unit,
        price,
        quality,
        province,
        district,
        description,
        images,
        farmerName: 'Muhammad Tariq',
        farmerPhone: '03001234567',
      });

      Alert.alert(
        isUrdu ? 'کامیابی' : 'Success',
        isUrdu ? 'آپ کا اشتہار کامیابی سے منڈی میں شائع ہو گیا ہے۔' : 'Your produce listing has been published to FasalDost Marketplace!'
      );
      onBack();
    } catch (err: any) {
      Alert.alert('Listing Error', err.message || 'Could not post listing. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <ArrowLeft size={18} color="#0f172a" />
        <Text style={styles.backText}>{isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'نئی فصل کا اشتہار' : 'Create Produce Listing'}</Text>
      <Text style={styles.subtitle}>
        {isUrdu ? 'اپنی فصل کو پاکستان بھر کے خریداروں کے لیے منڈی میں درج کریں' : 'Post your harvested produce directly for nationwide buyers & traders'}
      </Text>

      <View style={styles.card}>
        {/* Crop Selection */}
        <Text style={styles.label}>{isUrdu ? 'فصل کا انتخاب *' : 'Select Crop *'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CROPS.slice(0, 10).map((c) => {
            const active = cropName.toLowerCase() === c.en.toLowerCase();
            return (
              <TouchableOpacity
                key={c.en}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCropName(c.en)}
              >
                {active && <Check size={12} color="#ffffff" style={{ marginRight: 4 }} />}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.en}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Variety */}
        <Text style={styles.label}>{isUrdu ? 'فصل کی قسم / ورائٹی' : 'Crop Variety / Cultivar'}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Akbar 2019, Basmati 515, Super"
          value={variety}
          onChangeText={setVariety}
        />

        {/* Quantity & Unit */}
        <View style={styles.row}>
          <View style={{ flex: 2, marginRight: 8 }}>
            <Text style={styles.label}>{isUrdu ? 'مقدار *' : 'Quantity *'}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>
          <View style={{ flex: 1.5 }}>
            <Text style={styles.label}>{isUrdu ? 'اکائی' : 'Unit'}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {UNITS.slice(0, 3).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, unit === u && styles.unitChipActive]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.unitChipText, unit === u && styles.textWhite]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Price */}
        <Text style={styles.label}>{isUrdu ? 'قیمت فی اکائی (PKR) *' : 'Price per Unit (PKR) *'}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 3850"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        {/* Quality Grade */}
        <Text style={styles.label}>{isUrdu ? 'معیار' : 'Quality Grade'}</Text>
        <View style={styles.chipRow}>
          {QUALITY_LIST.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.chip, quality === q && styles.chipActive]}
              onPress={() => setQuality(q)}
            >
              <Text style={[styles.chipText, quality === q && styles.chipTextActive]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>{isUrdu ? 'ضلع' : 'District'}</Text>
            <TextInput style={styles.input} value={district} onChangeText={setDistrict} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{isUrdu ? 'صوبہ' : 'Province'}</Text>
            <TextInput style={styles.input} value={province} onChangeText={setProvince} />
          </View>
        </View>

        {/* Description */}
        <Text style={styles.label}>{isUrdu ? 'تفصیلات' : 'Produce Description'}</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Add details about harvest condition, moisture, storage..."
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Images */}
        <Text style={styles.label}>{isUrdu ? 'فصل کی تصاویر' : 'Produce Photos'}</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.addPhotoBtn} onPress={handleCapturePhoto}>
            <Camera size={20} color="#0f172a" />
            <Text style={styles.addPhotoText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickPhoto}>
            <Plus size={20} color="#0f172a" />
            <Text style={styles.addPhotoText}>Gallery</Text>
          </TouchableOpacity>
          {images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.uploadedThumb} />
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Store size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>{isUrdu ? 'اشتہار شائع کریں' : 'Post Listing Now'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, height: 44, fontSize: 13, color: '#0f172a' },
  chipRow: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
  chipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#ffffff' },
  row: { flexDirection: 'row' },
  unitChip: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  unitChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  unitChipText: { fontSize: 11, fontWeight: '700', color: '#0f172a' },
  textWhite: { color: '#ffffff' },
  photoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  addPhotoBtn: { width: 70, height: 70, borderRadius: 14, backgroundColor: '#f8fafc', borderWidth: 1, borderStyle: 'dashed', borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  addPhotoText: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 2 },
  uploadedThumb: { width: 70, height: 70, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  submitBtn: { backgroundColor: '#0f172a', paddingVertical: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
