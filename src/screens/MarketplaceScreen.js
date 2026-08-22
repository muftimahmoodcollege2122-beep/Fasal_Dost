// ─────────────────────────────────────────────────────────────────────────────
// src/screens/MarketplaceScreen.js
//
// PURPOSE:
//   Kisan Market — farmers browse produce listings from other farmers.
//   Tapping a listing opens detail screen where buyer contacts farmer via WhatsApp.
//   Farmers can also post their own produce for sale.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect }    from '@react-navigation/native';
import { colors, spacing, radius } from '../utils/theme';
import { t, textAlign }            from '../utils/i18n';
import { tm }                      from '../utils/i18n';
import { getListings, getFarmerUniqueId } from '../utils/store';

export default function MarketplaceScreen({ navigation, route }) {
  const lang   = route?.params?.lang || 'ur';
  const insets = useSafeAreaInsets();

  const [listings,    setListings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [myFarmerId,  setMyFarmerId]  = useState('');
  const [activeTab,   setActiveTab]   = useState('all'); // 'all' or 'mine'

  // ── Load listings on focus ────────────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [data, fid] = await Promise.all([getListings(), getFarmerUniqueId()]);
      if (active) {
        setListings(data);
        setMyFarmerId(fid);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []));

  const handleRefresh = async () => {
    setRefreshing(true);
    const data = await getListings();
    setListings(data);
    setRefreshing(false);
  };

  // ── Filter by tab ─────────────────────────────────────────────────────────
  const filtered = activeTab === 'mine'
    ? listings.filter(l => l.farmerId === myFarmerId)
    : listings;

  // ── Quality color ─────────────────────────────────────────────────────────
  const qualityColor = (q) => {
    if (q === 'premium') return '#F4B942';
    if (q === 'fresh')   return '#4ADE80';
    return colors.textSecondary;
  };

  const qualityLabel = (q, lang) => {
    const map = {
      premium: { ur: 'اعلیٰ معیار', en: 'Premium' },
      medium:  { ur: 'درمیانہ',     en: 'Medium'  },
      fresh:   { ur: 'تازہ',        en: 'Fresh'   },
    };
    return map[q]?.[lang] || q;
  };

  // ── Render listing card ───────────────────────────────────────────────────
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ListingDetail', { lang, listing: item, isOwner: item.farmerId === myFarmerId })}
      activeOpacity={0.8}
    >
      {/* Crop icon + name */}
      <View style={styles.cardTop}>
        {item.imageBase64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.imageBase64}` }}
            style={styles.cropImageThumb}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cropIconWrap}>
            <Text style={styles.cropIcon}>🌾</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={[styles.cropName, { textAlign: textAlign(lang) }]} numberOfLines={1}>
            {item.cropName}
          </Text>
          <Text style={[styles.location, { textAlign: textAlign(lang) }]} numberOfLines={1}>
            📍 {item.district || item.province || ''}
            {item.tehsil ? ` — ${item.tehsil}` : ''}
          </Text>
        </View>
        {/* My listing badge */}
        {item.farmerId === myFarmerId && (
          <View style={styles.myBadge}>
            <Text style={styles.myBadgeText}>{lang === 'ur' ? 'میرا' : 'Mine'}</Text>
          </View>
        )}
      </View>

      {/* Price + Quantity + Quality */}
      <View style={styles.cardBottom}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>PKR {item.price}</Text>
          <Text style={styles.statLabel}>
            {lang === 'ur'
              ? item.unit === 'KG' ? 'فی کلو' : item.unit === 'Ton' ? 'فی ٹن' : 'فی من'
              : `per ${item.unit || 'Maund'}`}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{item.quantity}</Text>
          <Text style={styles.statLabel}>
            {lang === 'ur'
              ? item.unit === 'KG' ? 'کلو' : item.unit === 'Ton' ? 'ٹن' : 'من'
              : item.unit || 'Maund'}
          </Text>
        </View>
        <View style={[styles.qualityBadge, { borderColor: qualityColor(item.quality) }]}>
          <Text style={[styles.qualityText, { color: qualityColor(item.quality) }]}>
            {qualityLabel(item.quality, lang)}
          </Text>
        </View>
      </View>

      {/* Farmer name */}
      <Text style={[styles.farmerName, { textAlign: textAlign(lang) }]}>
        👨‍🌾 {item.farmerName || (lang === 'ur' ? 'کسان' : 'Farmer')}
      </Text>
    </TouchableOpacity>
  );

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🛒 {tm('marketplace', lang)}</Text>
          <Text style={styles.headerSub}>{lang === 'ur' ? 'بیچیں اور خریدیں — براہ راست' : 'Buy & Sell Direct'}</Text>
        </View>
        {/* Post listing button */}
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => navigation.navigate('CreateListing', { lang })}
        >
          <Text style={styles.postBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            {tm('allListings', lang)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
          onPress={() => setActiveTab('mine')}
        >
          <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
            {tm('myListings', lang)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={[styles.emptyTitle, { textAlign: 'center' }]}>
            {tm('noListings', lang)}
          </Text>
          <Text style={[styles.emptyDesc, { textAlign: 'center' }]}>
            {tm('noListingsDesc', lang)}
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('CreateListing', { lang })}
          >
            <LinearGradient
              colors={[colors.gold, colors.goldDark]}
              style={styles.emptyBtnInner}
            >
              <Text style={styles.emptyBtnText}>+ {tm('createListing', lang)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />
          }
        />
      )}

      {/* ── Floating post button ── */}
      {filtered.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => navigation.navigate('CreateListing', { lang })}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[colors.gold, colors.goldDark]} style={styles.fabInner}>
            <Text style={styles.fabText}>+ {tm('createListing', lang)}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forestDeep },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: 12, gap: 10,
  },
  backBtn:     { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backIcon:    { fontSize: 20, color: colors.textPrimary },
  headerCenter:{ flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  headerSub:   { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  postBtn:     { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  postBtnText: { fontSize: 24, fontWeight: '700', color: colors.forestDeep },

  // Tabs
  tabs:         { flexDirection: 'row', marginHorizontal: spacing.md, marginBottom: 12, backgroundColor: colors.surfaceLight, borderRadius: radius.full, padding: 4, borderWidth: 1, borderColor: colors.border },
  tab:          { flex: 1, paddingVertical: 8, borderRadius: radius.full, alignItems: 'center' },
  tabActive:    { backgroundColor: colors.gold },
  tabText:      { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive:{ color: colors.forestDeep },

  // List
  list: { padding: spacing.md, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: colors.surfaceLight, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTop:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cropIconWrap:    { width: 48, height: 48, borderRadius: radius.md, backgroundColor: 'rgba(244,185,66,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  cropImageThumb:  { width: 48, height: 48, borderRadius: radius.md },
  cropIcon:     { fontSize: 24 },
  cardInfo:     { flex: 1 },
  cropName:     { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  location:     { fontSize: 12, color: colors.textMuted },
  myBadge:      { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(244,185,66,0.15)', borderRadius: radius.full, borderWidth: 1, borderColor: colors.gold },
  myBadgeText:  { fontSize: 11, color: colors.gold, fontWeight: '700' },
  cardBottom:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  statBox:      { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: radius.md, padding: 8, alignItems: 'center', minWidth: 70 },
  statValue:    { fontSize: 14, fontWeight: '800', color: colors.gold },
  statLabel:    { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  qualityBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, marginLeft: 'auto' },
  qualityText:  { fontSize: 12, fontWeight: '700' },
  farmerName:   { fontSize: 12, color: colors.textSecondary },

  // Empty
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  emptyDesc:  { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg },
  emptyBtn:   { borderRadius: radius.lg, overflow: 'hidden' },
  emptyBtnInner: { padding: 14, paddingHorizontal: 24 },
  emptyBtnText:  { fontSize: 15, fontWeight: '800', color: colors.forestDeep },

  // FAB
  fab:      { position: 'absolute', left: spacing.md, right: spacing.md, borderRadius: radius.lg, overflow: 'hidden' },
  fabInner: { padding: 16, alignItems: 'center' },
  fabText:  { fontSize: 16, fontWeight: '800', color: colors.forestDeep },
});
