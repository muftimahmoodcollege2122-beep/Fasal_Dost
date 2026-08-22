// ─────────────────────────────────────────────────────────────────────────────
// src/screens/FarmerProfileScreen.js
// Version 4.0 — Premium animated registration screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, BackHandler,
  Animated, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import * as Haptics          from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect }    from '@react-navigation/native';
import { colors, spacing, radius, shadows } from '../utils/theme';
import { t, textAlign, PROVINCES, CROPS }   from '../utils/i18n';
import { saveFarmerProfile, getFarmerProfile } from '../utils/store';

export default function FarmerProfileScreen({ navigation, route }) {
  const lang         = route?.params?.lang        || 'ur';
  const isOnboarding = route?.params?.onboarding  || false;
  const insets       = useSafeAreaInsets();

  // ── Form fields ───────────────────────────────────────────────────────────
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [province,      setProvince]      = useState('');
  const [division,      setDivision]      = useState('');
  const [district,      setDistrict]      = useState('');
  const [tehsil,        setTehsil]        = useState('');
  const [landSize,      setLandSize]      = useState('');
  const [selectedCrops, setSelectedCrops] = useState([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [currentStep,  setCurrentStep]  = useState(1);
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [focusedField, setFocusedField] = useState(null);

  // ── Animations ────────────────────────────────────────────────────────────
  const fadeAnim     = useRef(new Animated.Value(0)).current;
  const slideAnim    = useRef(new Animated.Value(40)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stepScale    = useRef(new Animated.Value(0.95)).current;

  // ── Block back on onboarding ──────────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    if (!isOnboarding) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [isOnboarding]));

  // ── Load profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      const p = await getFarmerProfile();
      if (mounted && p) {
        setName(p.name || ''); setPhone(p.phone || '');
        setProvince(p.province || ''); setDivision(p.division || '');
        setDistrict(p.district || ''); setTehsil(p.tehsil || '');
        setLandSize(p.landSize || '');
        setSelectedCrops(Array.isArray(p.crops) ? p.crops : []);
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // ── Entrance animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [loading]);

  // ── Progress animation ────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(progressAnim, { toValue: currentStep / 3, tension: 50, friction: 8, useNativeDriver: false }).start();
    Animated.sequence([
      Animated.timing(stepScale, { toValue: 0.97, duration: 100, useNativeDriver: true }),
      Animated.spring(stepScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [currentStep]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => {
    if (currentStep === 1 && !name.trim()) { Alert.alert('', t('nameRequired', lang)); return; }
    if (currentStep === 1 && !province)    { Alert.alert('', t('provinceRequired', lang)); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < 3) setCurrentStep(s => s + 1);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) setCurrentStep(s => s - 1);
    else if (!isOnboarding) navigation.goBack();
  };

  const toggleCrop = (cropEn) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCrops(prev => prev.includes(cropEn) ? prev.filter(c => c !== cropEn) : [...prev, cropEn]);
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    const ok = await saveFarmerProfile({
      name: name.trim(), phone: phone.trim(), province,
      division: division.trim(), district: district.trim(),
      tehsil: tehsil.trim(), landSize: landSize.trim(),
      crops: selectedCrops, savedAt: new Date().toISOString(),
    });
    setSaving(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isOnboarding) navigation.replace('Home');
      else Alert.alert('', t('profileSaved', lang), [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } else {
      Alert.alert(t('error', lang), t('tryAgain', lang));
    }
  };

  const inputStyle = (field) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    { textAlign: textAlign(lang) },
  ];

  if (loading) return (
    <View style={styles.loadingWrap}>
      <LinearGradient colors={['#061206','#0D2E0D']} style={StyleSheet.absoluteFillObject} />
      <ActivityIndicator color={colors.gold} size="large" />
    </View>
  );

  const steps = [
    { icon: '👤', ur: 'ذاتی معلومات',   en: 'Personal Info'  },
    { icon: '📍', ur: 'آپ کا مقام',     en: 'Your Location'  },
    { icon: '🌾', ur: 'زمین اور فصلیں', en: 'Land & Crops'   },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#061206','#0A1E0A','#061206']} style={StyleSheet.absoluteFillObject} />

      {/* Gold orb decoration */}
      <View style={styles.orb} />

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={goBack}>
            <Text style={styles.headerBtnIcon}>{currentStep===1&&isOnboarding?'✕':'←'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🌾 فصل دوست</Text>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>{currentStep}/3</Text>
          </View>
        </View>

        {/* ── Progress bar ── */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {
            width: progressAnim.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }),
          }]} />
        </View>

        {/* ── Step indicators ── */}
        <View style={styles.stepRow}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <View style={styles.stepDot}>
                <View style={[styles.stepCircle, (i+1) <= currentStep && styles.stepCircleActive]}>
                  <Text style={styles.stepCircleText}>{(i+1) < currentStep ? '✓' : s.icon}</Text>
                </View>
                <Text style={[styles.stepLabel, (i+1) === currentStep && styles.stepLabelActive]}>
                  {lang === 'ur' ? s.ur : s.en}
                </Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, (i+1) < currentStep && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim, transform:[{translateY:slideAnim},{scale:stepScale}] }}>

            {/* ── STEP 1 ── */}
            {currentStep === 1 && (
              <View style={styles.card}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label,{textAlign:textAlign(lang)}]}>{t('farmerName',lang)} *</Text>
                  <TextInput style={inputStyle('name')} placeholder={t('namePH',lang)} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} onFocus={()=>setFocusedField('name')} onBlur={()=>setFocusedField(null)} returnKeyType="next" autoCapitalize="words" />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label,{textAlign:textAlign(lang)}]}>{t('farmerPhone',lang)}</Text>
                  <TextInput style={inputStyle('phone')} placeholder={t('phonePH',lang)} placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} onFocus={()=>setFocusedField('phone')} onBlur={()=>setFocusedField(null)} keyboardType="phone-pad" />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label,{textAlign:textAlign(lang)}]}>{t('farmerProvince',lang)} *</Text>
                  <View style={styles.chipRow}>
                    {PROVINCES.map(prov => (
                      <TouchableOpacity key={prov} style={[styles.chip, province===prov && styles.chipActive]} onPress={()=>{ setProvince(prov); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                        <Text style={[styles.chipText, province===prov && styles.chipTextActive]}>{prov}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ── STEP 2 ── */}
            {currentStep === 2 && (
              <View style={styles.card}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxIcon}>🗺️</Text>
                  <Text style={[styles.infoBoxText,{textAlign:textAlign(lang)}]}>
                    {lang==='ur' ? 'آپ کے علاقے کی معلومات سے مخصوص بیماری الرٹ ملتے ہیں' : 'Location data gives you disease alerts specific to your area'}
                  </Text>
                </View>

                {[
                  { key:'division', label:t('farmerDivision',lang), ph:t('divisionPH',lang), val:division, set:setDivision },
                  { key:'district', label:t('farmerDistrict',lang), ph:t('districtPH',lang), val:district, set:setDistrict },
                  { key:'tehsil',   label:t('farmerTehsil',lang),   ph:t('tehsilPH',lang),   val:tehsil,   set:setTehsil   },
                ].map(f => (
                  <View key={f.key} style={styles.fieldGroup}>
                    <Text style={[styles.label,{textAlign:textAlign(lang)}]}>{f.label}</Text>
                    <TextInput style={inputStyle(f.key)} placeholder={f.ph} placeholderTextColor={colors.textMuted} value={f.val} onChangeText={f.set} onFocus={()=>setFocusedField(f.key)} onBlur={()=>setFocusedField(null)} returnKeyType="next" />
                  </View>
                ))}
                <Text style={[styles.hint,{textAlign:textAlign(lang)}]}>
                  {lang==='ur' ? '📌 تحصیل سطح کا ڈیٹا سب سے زیادہ مددگار ہوتا ہے' : '📌 Tehsil-level data gives the most precise alerts'}
                </Text>
              </View>
            )}

            {/* ── STEP 3 ── */}
            {currentStep === 3 && (
              <View style={styles.card}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label,{textAlign:textAlign(lang)}]}>{t('farmerLand',lang)}</Text>
                  <View style={styles.inputRow}>
                    <TextInput style={[inputStyle('land'),{flex:1}]} placeholder={t('landPH',lang)} placeholderTextColor={colors.textMuted} value={landSize} onChangeText={setLandSize} onFocus={()=>setFocusedField('land')} onBlur={()=>setFocusedField(null)} keyboardType="numeric" />
                    <View style={styles.unitBox}>
                      <Text style={styles.unitText}>{lang==='ur'?'ایکڑ':'Acres'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.label,{textAlign:textAlign(lang)}]}>{t('farmerCrops',lang)}</Text>
                  <Text style={[styles.hint,{textAlign:textAlign(lang)}]}>{lang==='ur'?'ایک یا زیادہ فصلیں منتخب کریں':'Select one or more'}</Text>
                  <View style={styles.cropGrid}>
                    {CROPS.map(crop => (
                      <TouchableOpacity key={crop.en} style={[styles.cropChip, selectedCrops.includes(crop.en) && styles.cropChipActive]} onPress={()=>toggleCrop(crop.en)}>
                        <Text style={[styles.cropChipText, selectedCrops.includes(crop.en) && styles.cropChipTextActive]}>
                          {lang==='ur'?crop.ur:crop.en}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Summary */}
                {name && province && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>{lang==='ur'?'✅ پروفائل خلاصہ':'✅ Profile Summary'}</Text>
                    <Text style={[styles.summaryRow,{textAlign:textAlign(lang)}]}>👤 {name}</Text>
                    {phone?<Text style={[styles.summaryRow,{textAlign:textAlign(lang)}]}>📱 {phone}</Text>:null}
                    <Text style={[styles.summaryRow,{textAlign:textAlign(lang)}]}>🗺️ {province}{district?` — ${district}`:''}{tehsil?` — ${tehsil}`:''}</Text>
                    {selectedCrops.length>0&&<Text style={[styles.summaryRow,{textAlign:textAlign(lang)}]}>🌾 {selectedCrops.join(', ')}</Text>}
                  </View>
                )}
              </View>
            )}

          </Animated.View>
        </ScrollView>

        {/* ── Bottom bar ── */}
        <View style={[styles.bottomBar,{paddingBottom:insets.bottom+16}]}>
          <TouchableOpacity style={styles.actionBtn} onPress={currentStep<3?goNext:handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient
              colors={saving?['#1A3010','#0D2008']:[colors.gold,colors.goldDark]}
              start={{x:0,y:0}} end={{x:1,y:1}}
              style={styles.actionBtnInner}
            >
              {saving
                ? <ActivityIndicator color={colors.gold} />
                : <Text style={styles.actionBtnText}>
                    {currentStep<3 ? (lang==='ur'?'اگلا ←':'Next →') : `✅ ${t('saveProfile',lang)}`}
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.dots}>
            {[1,2,3].map(s=>(
              <View key={s} style={[styles.dot, currentStep===s&&styles.dotActive]} />
            ))}
          </View>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:colors.forestDeep },
  loadingWrap:  { flex:1, alignItems:'center', justifyContent:'center' },
  orb:          { position:'absolute', top:-80, right:-80, width:240, height:240, borderRadius:120, backgroundColor:'rgba(244,185,66,0.05)' },

  // Header
  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:spacing.md, paddingBottom:12 },
  headerBtn:     { width:40, height:40, borderRadius:radius.full, backgroundColor:colors.surfaceLight, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.border },
  headerBtnIcon: { fontSize:18, color:colors.textPrimary },
  headerTitle:   { fontSize:16, fontWeight:'800', color:colors.gold },
  stepPill:      { paddingHorizontal:12, paddingVertical:5, backgroundColor:colors.surfaceLight, borderRadius:radius.full, borderWidth:1, borderColor:colors.border },
  stepPillText:  { fontSize:12, fontWeight:'700', color:colors.textSecondary },

  // Progress
  progressTrack: { height:3, backgroundColor:'rgba(245,237,214,0.08)', marginHorizontal:spacing.md, marginBottom:16, borderRadius:999 },
  progressFill:  { height:'100%', borderRadius:999, backgroundColor:colors.gold },

  // Step row
  stepRow:        { flexDirection:'row', alignItems:'center', justifyContent:'center', paddingHorizontal:spacing.md, marginBottom:20 },
  stepDot:        { alignItems:'center', gap:4 },
  stepCircle:     { width:36, height:36, borderRadius:18, backgroundColor:colors.surfaceLight, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:colors.border },
  stepCircleActive:{ backgroundColor:'rgba(244,185,66,0.15)', borderColor:colors.gold },
  stepCircleText: { fontSize:16 },
  stepLabel:      { fontSize:10, color:colors.textMuted, fontWeight:'600', textAlign:'center', maxWidth:60 },
  stepLabelActive:{ color:colors.gold },
  stepLine:       { flex:1, height:1.5, backgroundColor:colors.border, marginHorizontal:4, marginBottom:20 },
  stepLineActive: { backgroundColor:colors.gold },

  // Scroll + card
  scroll: { paddingHorizontal:spacing.md, paddingBottom:20 },
  card:   { backgroundColor:colors.surfaceLight, borderRadius:radius.xl, padding:spacing.md, borderWidth:1, borderColor:colors.border, gap:16 },

  // Fields
  fieldGroup: { gap:8 },
  label:      { fontSize:12, fontWeight:'700', color:colors.gold, letterSpacing:0.5 },
  hint:       { fontSize:11, color:colors.textMuted, lineHeight:16 },
  input:      { backgroundColor:'rgba(0,0,0,0.35)', borderRadius:radius.md, padding:14, color:colors.textPrimary, fontSize:15, borderWidth:1.5, borderColor:colors.border },
  inputFocused:{ borderColor:colors.gold, backgroundColor:'rgba(244,185,66,0.04)' },
  inputRow:   { flexDirection:'row', gap:10, alignItems:'center' },
  unitBox:    { paddingHorizontal:14, paddingVertical:14, backgroundColor:'rgba(244,185,66,0.08)', borderRadius:radius.md, borderWidth:1.5, borderColor:colors.border },
  unitText:   { fontSize:13, fontWeight:'700', color:colors.gold },

  // Chips
  chipRow:         { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:            { paddingHorizontal:16, paddingVertical:9, borderRadius:radius.full, borderWidth:1.5, borderColor:colors.border, backgroundColor:colors.surfaceLight },
  chipActive:      { backgroundColor:'rgba(244,185,66,0.15)', borderColor:colors.gold },
  chipText:        { fontSize:13, fontWeight:'600', color:colors.textSecondary },
  chipTextActive:  { color:colors.gold },

  // Crops
  cropGrid:          { flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:4 },
  cropChip:          { paddingHorizontal:14, paddingVertical:8, borderRadius:radius.md, borderWidth:1.5, borderColor:colors.border, backgroundColor:colors.surfaceLight },
  cropChipActive:    { backgroundColor:'rgba(244,185,66,0.15)', borderColor:colors.gold },
  cropChipText:      { fontSize:13, fontWeight:'600', color:colors.textSecondary },
  cropChipTextActive:{ color:colors.gold },

  // Info box
  infoBox:     { flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:'rgba(244,185,66,0.06)', borderRadius:radius.md, padding:spacing.sm, borderWidth:1, borderColor:colors.border },
  infoBoxIcon: { fontSize:20 },
  infoBoxText: { flex:1, fontSize:12, color:colors.textSecondary, lineHeight:20 },

  // Summary
  summaryCard:  { backgroundColor:'rgba(74,222,128,0.06)', borderRadius:radius.lg, padding:spacing.md, borderWidth:1, borderColor:'rgba(74,222,128,0.2)', gap:6 },
  summaryTitle: { fontSize:13, fontWeight:'800', color:'#4ADE80', marginBottom:4 },
  summaryRow:   { fontSize:13, color:colors.textSecondary, lineHeight:20 },

  // Bottom
  bottomBar:     { paddingHorizontal:spacing.md, paddingTop:12, borderTopWidth:1, borderTopColor:colors.border, backgroundColor:'rgba(6,18,6,0.95)', gap:14 },
  actionBtn:     { borderRadius:radius.lg, overflow:'hidden', ...shadows.glow },
  actionBtnInner:{ padding:16, alignItems:'center', justifyContent:'center' },
  actionBtnText: { fontSize:17, fontWeight:'800', color:colors.forestDeep },
  dots:          { flexDirection:'row', justifyContent:'center', gap:8 },
  dot:           { width:6, height:6, borderRadius:3, backgroundColor:colors.surfaceMid },
  dotActive:     { width:24, backgroundColor:colors.gold },
});
