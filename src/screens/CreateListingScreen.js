// ─────────────────────────────────────────────────────────────────────────────
// src/screens/CreateListingScreen.js
//
// PURPOSE:
//   Farmer fills crop name, quantity, price, quality, description.
//   Saves to Firestore /listings collection — visible to all buyers.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient }    from 'expo-linear-gradient';
import * as Haptics          from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../utils/theme';
import { textAlign }                        from '../utils/i18n';
import { tm, UNITS, QUALITY_OPTIONS, CROPS } from '../utils/i18n';
import { createListing }                    from '../utils/store';

export default function CreateListingScreen({ navigation, route }) {
  const lang   = route?.params?.lang || 'ur';
  const insets = useSafeAreaInsets();

  // ── Form state ────────────────────────────────────────────────────────────
  const [cropName,     setCropName]     = useState('');
  const [quantity,     setQuantity]     = useState('');
  const [unit,         setUnit]         = useState('Maund');
  const [price,        setPrice]        = useState('');
  const [quality,      setQuality]      = useState('medium');
  const [description,  setDescription]  = useState('');
  const [saving,       setSaving]       = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showCrops,    setShowCrops]    = useState(false);
  const [imageUri,     setImageUri]     = useState(null);
  const [imageBase64,  setImageBase64]  = useState(null);

  const inputStyle = (field) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    { textAlign: textAlign(lang) },
  ];

  // ── Pick image ───────────────────────────────────────────────────────────────
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!camPerm.granted) { Alert.alert('', lang === 'ur' ? 'تصویر کی اجازت درکار ہے' : 'Permission required'); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true, allowsEditing: true, aspect: [4, 3] });
      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64);
      }
      return;
    }
    Alert.alert(
      lang === 'ur' ? 'تصویر منتخب کریں' : 'Select Image',
      '',
      [
        { text: lang === 'ur' ? 'کیمرہ' : 'Camera', onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true, allowsEditing: true, aspect: [4,3] });
          if (!r.canceled && r.assets?.[0]) { setImageUri(r.assets[0].uri); setImageBase64(r.assets[0].base64); }
        }},
        { text: lang === 'ur' ? 'گیلری' : 'Gallery', onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true, allowsEditing: true, aspect: [4,3] });
          if (!r.canceled && r.assets?.[0]) { setImageUri(r.assets[0].uri); setImageBase64(r.assets[0].base64); }
        }},
        { text: lang === 'ur' ? 'منسوخ' : 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!cropName.trim()) {
      Alert.alert('', lang === 'ur' ? 'فصل کا نام ضروری ہے' : 'Crop name is required');
      return;
    }
    if (!quantity.trim()) {
      Alert.alert('', lang === 'ur' ? 'مقدار ضروری ہے' : 'Quantity is required');
      return;
    }
    if (!price.trim()) {
      Alert.alert('', lang === 'ur' ? 'قیمت ضروری ہے' : 'Price is required');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const id = await createListing({ cropName, quantity, unit, price, quality, description, imageBase64 });
    setSaving(false);

    if (id) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('', tm('listingPosted', lang), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert(lang === 'ur' ? 'خرابی' : 'Error', lang === 'ur' ? 'دوبارہ کوشش کریں' : 'Please try again');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#061206', '#0A1E0A', '#061206']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 {tm('createListing', lang)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Image Upload ── */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { textAlign: textAlign(lang) }]}>
              📷 {lang === 'ur' ? 'فصل کی تصویر (اختیاری)' : 'Produce Photo (Optional)'}
            </Text>
            <TouchableOpacity style={styles.imageUploadArea} onPress={pickImage} activeOpacity={0.8}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.uploadedImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                    <Text style={styles.changeImageText}>{lang === 'ur' ? '🔄 تبدیل کریں' : '🔄 Change'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={[styles.uploadText, { textAlign: 'center' }]}>
                  'تصویر لگائیں
                      Add a photo                      
                      Buyers trust listings with photos    
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Crop Name ── */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { textAlign: textAlign(lang) }]}>
              🌾 {lang === 'ur' ? 'فصل کا نام' : 'Crop Name'} *
            </Text>

            {/* Quick crop selector */}
            <TouchableOpacity
              style={styles.cropSelector}
              onPress={() => setShowCrops(!showCrops)}
            >
              <Text style={[styles.cropSelectorText, !cropName && { color: colors.textMuted }]}>
                {cropName || (lang === 'ur' ? 'فصل منتخب کریں یا لکھیں' : 'Select or type crop')}
              </Text>
              <Text style={styles.dropArrow}>{showCrops ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showCrops && (
              <View style={styles.cropDropdown}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {CROPS.map(crop => (
                    <TouchableOpacity
                      key={crop.en}
                      style={styles.cropOption}
                      onPress={() => { setCropName(lang === 'ur' ? crop.ur : crop.en); setShowCrops(false); }}
                    >
                      <Text style={[styles.cropOptionText, { textAlign: textAlign(lang) }]}>
                        {lang === 'ur' ? crop.ur : crop.en}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.orText, { textAlign: textAlign(lang) }]}>
              {lang === 'ur' ? 'یا خود لکھیں' : 'Or type manually'}
            </Text>
            <TextInput
              style={inputStyle('crop')}
              placeholder={lang === 'ur' ? 'مثلاً گندم' : 'e.g. Wheat'}
              placeholderTextColor={colors.textMuted}
              value={cropName}
              onChangeText={setCropName}
              onFocus={() => { setFocusedField('crop'); setShowCrops(false); }}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* ── Quantity + Unit ── */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { textAlign: textAlign(lang) }]}>
              ⚖️ {lang === 'ur' ? 'مقدار' : 'Quantity'} *
            </Text>
            <View style={styles.row}>
              <TextInput
                style={[inputStyle('qty'), { flex: 1 }]}
                placeholder={lang === 'ur' ? 'مثلاً 10' : 'e.g. 10'}
                placeholderTextColor={colors.textMuted}
                value={quantity}
                onChangeText={setQuantity}
                onFocus={() => setFocusedField('qty')}
                onBlur={() => setFocusedField(null)}
                keyboardType="numeric"
              />
              <View style={styles.unitRow}>
                {UNITS.map(u => (
                  <TouchableOpacity
                    key={u.en}
                    style={[styles.unitChip, unit === u.en && styles.unitChipActive]}
                    onPress={() => setUnit(u.en)}
                  >
                    <Text style={[styles.unitChipText, unit === u.en && styles.unitChipTextActive]}>
                      {lang === 'ur' ? u.ur : u.en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── Price ── */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { textAlign: textAlign(lang) }]}>
              💰 {lang === 'ur' ? 'قیمت (PKR)' : 'Price (PKR)'} *
            </Text>
            <View style={styles.priceRow}>
              <View style={styles.pkrBadge}>
                <Text style={styles.pkrText}>PKR</Text>
              </View>
              <TextInput
                style={[inputStyle('price'), { flex: 1 }]}
                placeholder={lang === 'ur' ? 'مثلاً 4000' : 'e.g. 4000'}
                placeholderTextColor={colors.textMuted}
                value={price}
                onChangeText={setPrice}
                onFocus={() => setFocusedField('price')}
                onBlur={() => setFocusedField(null)}
                keyboardType="numeric"
              />
              <View style={styles.perBadge}>
                <Text style={styles.perText}>{lang === 'ur' ? 'فی من' : `per ${unit}`}</Text>
              </View>
            </View>
            {quantity && price && (
              <View style={styles.totalBox}>
                <Text style={[styles.totalText, { textAlign: textAlign(lang) }]}>
                  {lang === 'ur'
                    ? `کل قیمت: PKR ${(parseFloat(quantity) * parseFloat(price)).toLocaleString()}`
                    : `Total: PKR ${(parseFloat(quantity) * parseFloat(price)).toLocaleString()}`}
                </Text>
              </View>
            )}
          </View>

          {/* ── Quality ── */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { textAlign: textAlign(lang) }]}>
              ⭐ {lang === 'ur' ? 'معیار' : 'Quality'}
            </Text>
            <View style={styles.qualityRow}>
              {QUALITY_OPTIONS.map(q => (
                <TouchableOpacity
                  key={q.value}
                  style={[styles.qualityChip, quality === q.value && styles.qualityChipActive]}
                  onPress={() => setQuality(q.value)}
                >
                  <Text style={[styles.qualityChipText, quality === q.value && styles.qualityChipTextActive]}>
                    {lang === 'ur' ? q.ur : q.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Description ── */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { textAlign: textAlign(lang) }]}>
              📝 {lang === 'ur' ? 'تفصیل (اختیاری)' : 'Description (Optional)'}
            </Text>
            <TextInput
              style={[inputStyle('desc'), { height: 100, textAlignVertical: 'top' }]}
              placeholder={lang === 'ur' ? 'فصل کے بارے میں مزید لکھیں' : 'Describe your produce'}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              onFocus={() => setFocusedField('desc')}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* ── Info note ── */}
          <View style={styles.noteBox}>
            <Text style={styles.noteIcon}>ℹ️</Text>
            <Text style={[styles.noteText, { textAlign: textAlign(lang) }]}>
              {lang === 'ur'
                ? 'آپ کا فون نمبر خریداروں کو دکھایا جائے گا تاکہ وہ WhatsApp پر رابطہ کر سکیں'
                : 'Your phone number will be shown to buyers so they can contact you on WhatsApp'}
            </Text>
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving} activeOpacity={0.85}>
            <LinearGradient
              colors={saving ? ['#1A3010', '#0D2008'] : [colors.gold, colors.goldDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.submitBtnInner}
            >
              {saving
                ? <ActivityIndicator color={colors.gold} />
                : <Text style={styles.submitBtnText}>
                    🚀 {lang === 'ur' ? 'اشتہار شائع کریں' : 'Post Listing'}
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forestDeep },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: 12 },
  backBtn:   { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backIcon:  { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },

  scroll: { padding: spacing.md, paddingBottom: 48 },

  card: { backgroundColor: colors.surfaceLight, borderRadius: radius.xl, padding: spacing.md, marginBottom: 12, borderWidth: 1, borderColor: colors.border, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.gold },

  // Crop selector
  cropSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: radius.md, padding: 13, borderWidth: 1.5, borderColor: colors.border },
  cropSelectorText: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  dropArrow: { color: colors.gold, fontSize: 12 },
  cropDropdown: { backgroundColor: '#0D2E0D', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  cropOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  cropOptionText: { fontSize: 15, color: colors.textPrimary },
  orText: { fontSize: 12, color: colors.textMuted },

  input: { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: radius.md, padding: 13, color: colors.textPrimary, fontSize: 15, borderWidth: 1.5, borderColor: colors.border },
  inputFocused: { borderColor: colors.gold, backgroundColor: 'rgba(244,185,66,0.04)' },

  // Quantity
  row:     { flexDirection: 'row', gap: 10, alignItems: 'center' },
  unitRow: { flexDirection: 'row', gap: 6 },
  unitChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceLight },
  unitChipActive: { backgroundColor: 'rgba(244,185,66,0.15)', borderColor: colors.gold },
  unitChipText:   { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  unitChipTextActive: { color: colors.gold },

  // Price
  priceRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pkrBadge: { paddingHorizontal: 10, paddingVertical: 13, backgroundColor: 'rgba(244,185,66,0.1)', borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  pkrText:  { fontSize: 13, fontWeight: '700', color: colors.gold },
  perBadge: { paddingHorizontal: 10, paddingVertical: 13, backgroundColor: colors.surfaceLight, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  perText:  { fontSize: 12, color: colors.textSecondary },
  totalBox: { backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)' },
  totalText:{ fontSize: 14, fontWeight: '700', color: '#4ADE80' },

  // Quality
  qualityRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  qualityChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceLight },
  qualityChipActive: { backgroundColor: 'rgba(244,185,66,0.15)', borderColor: colors.gold },
  qualityChipText:   { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  qualityChipTextActive: { color: colors.gold },

  // Note
  noteBox:  { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(244,185,66,0.06)', borderRadius: radius.md, padding: spacing.sm, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  noteIcon: { fontSize: 16 },
  noteText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

  // Submit
  // Image upload
  imageUploadArea:  { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed', minHeight: 140 },
  uploadedImage:    { width: '100%', height: 180 },
  changeImageBtn:   { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  changeImageText:  { fontSize: 12, color: colors.white, fontWeight: '600' },
  uploadPlaceholder:{ alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 8 },
  uploadIcon:       { fontSize: 36 },
  uploadText:       { fontSize: 13, color: colors.textMuted, lineHeight: 20 },

  submitBtn:      { borderRadius: radius.lg, overflow: 'hidden', ...shadows.glow },
  submitBtnInner: { padding: 17, alignItems: 'center' },
  submitBtnText:  { fontSize: 17, fontWeight: '800', color: colors.forestDeep },
});
