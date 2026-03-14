// ─────────────────────────────────────────────────────────────────────────────
// src/screens/FarmerProfileScreen.js
//
// PURPOSE:
//   Collects farmer's personal and agricultural profile data.
//   This data is the core of FasalDost's business value — it is stored
//   both locally (AsyncStorage) and in the cloud (Firestore).
//
// FIELDS COLLECTED:
//   - Name, Phone                      → Identity
//   - Province, Division, District, Tehsil → Location (tehsil = most precise)
//   - Land Size                        → Scale of farming operation
//   - Main Crops                       → Targeted disease alerts
//
// MODES:
//   - Onboarding (isOnboarding=true):  First launch. Back button disabled.
//                                      After save, uses navigation.replace() so
//                                      user cannot return to this screen.
//   - Edit (isOnboarding=false):       Accessed from Home screen profile icon.
//                                      Back button enabled. Shows alert on save.
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect }    from '@react-navigation/native';
import { colors, spacing, radius, shadows } from '../utils/theme';
import { t, textAlign, PROVINCES, CROPS }   from '../utils/i18n';
import { saveFarmerProfile, getFarmerProfile } from '../utils/store';

export default function FarmerProfileScreen({ navigation, route }) {
  // ── Route params ──────────────────────────────────────────────────────────
  const lang         = route?.params?.lang        || 'ur';
  const isOnboarding = route?.params?.onboarding  || false;

  const insets = useSafeAreaInsets();

  // ── Form state — one state variable per field ─────────────────────────────
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [province,      setProvince]      = useState('');
  const [division,      setDivision]      = useState(''); // ← NEW: Division level
  const [district,      setDistrict]      = useState('');
  const [tehsil,        setTehsil]        = useState(''); // ← NEW: Tehsil level (most precise)
  const [landSize,      setLandSize]      = useState('');
  const [selectedCrops, setSelectedCrops] = useState([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving,  setSaving]  = useState(false); // true while saving to DB
  const [loading, setLoading] = useState(true);  // true while loading existing profile

  // ── Block Android back button during onboarding ───────────────────────────
  // During onboarding, the farmer MUST fill the profile before using the app.
  // We block the hardware back button to enforce this.
  useFocusEffect(
    useCallback(() => {
      if (!isOnboarding) return; // Only block during onboarding

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        return true; // returning true = back press is handled (blocked)
      });

      return () => subscription.remove(); // Cleanup on screen blur
    }, [isOnboarding])
  );

  // ── Load existing profile on mount ───────────────────────────────────────
  // If farmer already saved a profile before, pre-fill all fields.
  useEffect(() => {
    let mounted = true; // Prevent state update if component unmounts during async

    (async () => {
      const profile = await getFarmerProfile();
      if (mounted && profile) {
        setName(          profile.name     || '');
        setPhone(         profile.phone    || '');
        setProvince(      profile.province || '');
        setDivision(      profile.division || ''); // ← Load division
        setDistrict(      profile.district || '');
        setTehsil(        profile.tehsil   || ''); // ← Load tehsil
        setLandSize(      profile.landSize || '');
        setSelectedCrops( Array.isArray(profile.crops) ? profile.crops : []);
      }
      if (mounted) setLoading(false);
    })();

    return () => { mounted = false; }; // Cleanup
  }, []);

  // ── Toggle crop chip selection ────────────────────────────────────────────
  // If crop already selected — deselect it. If not — add it.
  const toggleCrop = (cropEn) => {
    setSelectedCrops(prev =>
      prev.includes(cropEn)
        ? prev.filter(c => c !== cropEn)
        : [...prev, cropEn]
    );
  };

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Validate required fields before saving
    if (!name.trim()) {
      Alert.alert('', t('nameRequired', lang));
      return;
    }
    if (!province) {
      Alert.alert('', t('provinceRequired', lang));
      return;
    }

    setSaving(true);

    // Build the profile object — this goes to both AsyncStorage and Firestore
    const profile = {
      name:     name.trim(),
      phone:    phone.trim(),
      province,
      division: division.trim(), // ← Division
      district: district.trim(),
      tehsil:   tehsil.trim(),   // ← Tehsil (most granular location field)
      landSize: landSize.trim(),
      crops:    selectedCrops,
      savedAt:  new Date().toISOString(),
    };

    const ok = await saveFarmerProfile(profile);
    setSaving(false);

    if (ok) {
      if (isOnboarding) {
        // Replace navigation stack — user cannot go back to onboarding
        navigation.replace('Home');
      } else {
        // Normal edit mode — show confirmation then go back
        Alert.alert('', t('profileSaved', lang), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } else {
      Alert.alert(t('error', lang), t('tryAgain', lang));
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#061206', '#0D2E0D']}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#061206', '#0D2E0D', '#1A4A1A']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header bar ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* Hide back button during onboarding — farmer must complete the form */}
        {!isOnboarding ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerTitle}>👨‍🌾 {t('farmerProfile', lang)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Keep keyboard open when tapping chips
      >
        {/* ── Onboarding welcome banner (first launch only) ── */}
        {isOnboarding && (
          <View style={styles.welcomeBanner}>
            <Text style={styles.welcomeEmoji}>🌾</Text>
            <Text style={[styles.welcomeTitle, { textAlign: textAlign(lang) }]}>
              {t('welcomeTitle', lang)}
            </Text>
            <Text style={[styles.welcomeDesc, { textAlign: textAlign(lang) }]}>
              {t('welcomeDesc', lang)}
            </Text>
          </View>
        )}

        {/* ── Full Name (required) ── */}
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: textAlign(lang) }]}>
            👤 {t('farmerName', lang)} *
          </Text>
          <TextInput
            style={[styles.input, { textAlign: textAlign(lang) }]}
            placeholder={t('namePH', lang)}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>

        {/* ── Mobile Number ── */}
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: textAlign(lang) }]}>
            📱 {t('farmerPhone', lang)}
          </Text>
          <TextInput
            style={[styles.input, { textAlign: textAlign(lang) }]}
            placeholder={t('phonePH', lang)}
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>

        {/* ── Province (required) — chip selector ── */}
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: textAlign(lang) }]}>
            🗺️ {t('farmerProvince', lang)} *
          </Text>
          <View style={styles.chipRow}>
            {PROVINCES.map((prov) => (
              <TouchableOpacity
                key={prov}
                style={[styles.chip, province === prov && styles.chipActive]}
                onPress={() => setProvince(prov)}
              >
                <Text style={[styles.chipText, province === prov && styles.chipTextActive]}>
                  {prov}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Division (NEW) ── */}
        {/* Division is one level below province and above district in Pakistan's admin hierarchy */}
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: textAlign(lang) }]}>
            🏛️ {t('farmerDivision', lang)}
          </Text>
          <TextInput
            style={[styles.input, { textAlign: textAlign(lang) }]}
            placeholder={t('divisionPH', lang)}
            placeholderTextColor={colors.textMuted}
            value={division}
            onChangeText={setDivision}
            returnKeyType="next"
          />
        </View>

        {/* ── District ── */}
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: textAlign(lang) }]}>
            📍 {t('farmerDistrict', lang)}
          </Text>
          <TextInput
            style={[styles.input, { textAlign: textAlign(lang) }]}
            placeholder={t('districtPH', lang)}
            placeholderTextColor={colors.textMuted}
            value={district}
            onChangeText={setDistrict}
            returnKeyType="next"
          />
        </View>

        {/* ── Tehsil (NEW) ── */}
        {/* Tehsil is the most granular administrative level — critical for our data business */}
        {/* Pakistan has 500+ tehsils — too many for a dropdown, so text input is used */}
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: textAlign(lang) }]}>
            📌 {t('farmerTehsil', lang)}
          </Text>
          <TextInput
            style={[styles.input, { textAlign: textAlign(lang) }]}
            placeholder={t('tehsilPH', lang)}
            placeholderTextColor={colors.textMuted}
            value={tehsil}
            onChangeText={setTehsil}
            returnKeyType="next"
          />
          {/* Helper text explaining why this field is useful */}
          <Text style={[styles.fieldHint, { textAlign: textAlign(lang) }]}>
            {lang === 'ur'
              ? 'تحصیل کا نام آپ کے علاقے کی بیماریوں کی معلومات دیتا ہے'
              : 'Tehsil name helps us show disease alerts specific to your area'}
          </Text>
        </View>

        {/* ── Land Size ── */}
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: textAlign(lang) }]}>
            🌱 {t('farmerLand', lang)}
          </Text>
          <TextInput
            style={[styles.input, { textAlign: textAlign(lang) }]}
            placeholder={t('landPH', lang)}
            placeholderTextColor={colors.textMuted}
            value={landSize}
            onChangeText={setLandSize}
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>

        {/* ── Main Crops — multi-select chips ── */}
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: textAlign(lang) }]}>
            🌾 {t('farmerCrops', lang)}
          </Text>
          <View style={styles.chipRow}>
            {CROPS.map((crop) => (
              <TouchableOpacity
                key={crop.en}
                style={[styles.chip, selectedCrops.includes(crop.en) && styles.chipActive]}
                onPress={() => toggleCrop(crop.en)}
              >
                <Text style={[
                  styles.chipText,
                  selectedCrops.includes(crop.en) && styles.chipTextActive,
                ]}>
                  {lang === 'ur' ? crop.ur : crop.en}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Save button ── */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={saving ? ['#1A3010', '#0D2008'] : [colors.gold, colors.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtnInner}
          >
            {saving
              ? <ActivityIndicator color={colors.gold} />
              : <Text style={styles.saveBtnText}>✅ {t('saveProfile', lang)}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.forestDeep,
  },
  loadingContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom:     spacing.sm,
  },
  backBtn: {
    width:           40,
    height:          40,
    borderRadius:    radius.full,
    backgroundColor: colors.surfaceMid,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.border,
  },
  backIcon:    { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  scroll: { padding: spacing.md, paddingBottom: 48 },

  // Onboarding welcome
  welcomeBanner: {
    backgroundColor: 'rgba(244,185,66,0.08)',
    borderRadius:    radius.lg,
    padding:         spacing.md,
    marginBottom:    spacing.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    alignItems:      'center',
  },
  welcomeEmoji: { fontSize: 40, marginBottom: 8 },
  welcomeTitle: { fontSize: 16, fontWeight: '800', color: colors.gold,          marginBottom: 6  },
  welcomeDesc:  { fontSize: 13, color:            colors.textSecondary, lineHeight: 20 },

  // Form fields
  field: {
    backgroundColor: colors.surfaceLight,
    borderRadius:    radius.lg,
    padding:         spacing.md,
    marginBottom:    spacing.sm,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  label: {
    fontSize:      12,
    fontWeight:    '700',
    color:         colors.textSecondary,
    marginBottom:  spacing.sm,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius:    radius.md,
    padding:         12,
    color:           colors.textPrimary,
    fontSize:        15,
    borderWidth:     1,
    borderColor:     colors.border,
  },
  fieldHint: {
    fontSize:   11,
    color:      colors.textMuted,
    marginTop:  6,
    lineHeight: 16,
  },

  // Chips (Province + Crop selectors)
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      radius.full,
    borderWidth:       1,
    borderColor:       colors.border,
    backgroundColor:   colors.surfaceLight,
  },
  chipActive: {
    backgroundColor: 'rgba(244,185,66,0.18)',
    borderColor:     colors.gold,
  },
  chipText:       { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.gold },

  // Save button
  saveBtn:      { borderRadius: radius.lg, overflow: 'hidden', marginTop: spacing.md, ...shadows.glow },
  saveBtnInner: { padding: 17, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:  { fontSize: 17, fontWeight: '800', color: colors.forestDeep },
});
