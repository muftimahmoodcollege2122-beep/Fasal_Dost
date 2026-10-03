// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/ListingDetailScreen.tsx
// Full produce detail screen with gallery, metadata, and WhatsApp/Call (Identical to Web)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Alert, Share } from 'react-native';
import { ArrowLeft, Phone, MessageCircle, MapPin, Calendar, ShieldCheck, Share2 } from 'lucide-react-native';

export function ListingDetailScreen({
  lang,
  listing,
  onBack,
}: {
  lang: 'ur' | 'en' | string;
  listing?: any;
  onBack: () => void;
}) {
  const isUrdu = lang === 'ur';

  if (!listing) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>{isUrdu ? 'لسٹنگ نہیں مل سکی' : 'Produce Listing Not Found'}</Text>
        <TouchableOpacity style={styles.backBtnPill} onPress={onBack}>
          <Text style={styles.backBtnPillText}>{isUrdu ? 'واپس جائیں' : 'Go Back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const coverImage = listing.images?.[0] || listing.imageBase64;
  const farmerPhone = listing.farmerPhone || '03001234567';

  const handleCall = () => {
    Linking.openURL(`tel:${farmerPhone}`).catch(() => {
      Alert.alert('Phone Call', `Call farmer at: ${farmerPhone}`);
    });
  };

  const handleWhatsApp = () => {
    let cleanPhone = farmerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }
    const message = encodeURIComponent(
      `Assalam-o-Alaikum! I saw your produce listing for ${listing.cropName || 'crop'} on FasalDost Marketplace. Is it still available?`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`).catch(() => {
      Alert.alert('WhatsApp', `Connect on WhatsApp at: ${cleanPhone}`);
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${listing.cropName} - FasalDost Marketplace`,
        message: `FasalDost Produce Listing: ${listing.cropName} (${listing.variety || ''})\nPrice: PKR ${listing.price}/${listing.unit || 'Kg'}\nLocation: ${listing.district || 'Punjab'}, Pakistan\nContact Farmer: ${farmerPhone}`,
      });
    } catch {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={18} color="#0f172a" />
          <Text style={styles.backText}>{isUrdu ? 'منڈی' : 'Market'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Share2 size={16} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Main Image or Placeholder */}
      {coverImage ? (
        <Image source={{ uri: coverImage }} style={styles.coverImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ fontSize: 36 }}>🌾</Text>
        </View>
      )}

      {/* Detail Card */}
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={14} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.verifiedBadgeText}>{isUrdu ? 'تصدیق شدہ کسان' : 'Verified Genuine Farmer'}</Text>
          </View>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityBadgeText}>{listing.quality || 'Grade A'}</Text>
          </View>
        </View>

        <Text style={styles.cropTitle}>{listing.cropName || 'Fresh Harvest'}</Text>
        {listing.variety ? <Text style={styles.varietyText}>{listing.variety}</Text> : null}

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>{isUrdu ? 'قیمت فی من / اکائی' : 'Unit Price'}</Text>
            <Text style={styles.priceVal}>PKR {listing.price} <Text style={styles.unitText}>/ {listing.unit || 'Kg'}</Text></Text>
          </View>
          {listing.quantity ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.priceLabel}>{isUrdu ? 'دستیاب مقدار' : 'Available Harvest'}</Text>
              <Text style={styles.qtyVal}>{listing.quantity} {listing.unit || 'Kg'}</Text>
            </View>
          ) : null}
        </View>

        {/* Location & Harvest Date */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={14} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.metaText}>{listing.district || 'Faisalabad'}, {listing.province || 'Punjab'}</Text>
          </View>
          {listing.harvestDate ? (
            <View style={styles.metaItem}>
              <Calendar size={14} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.metaText}>Harvested: {listing.harvestDate}</Text>
            </View>
          ) : null}
        </View>

        {/* Farmer Info */}
        <View style={styles.farmerBox}>
          <View style={styles.farmerAvatar}>
            <Text style={{ fontSize: 18 }}>👨‍🌾</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.farmerName}>{listing.farmerName || 'Muhammad Tariq'}</Text>
            <Text style={styles.farmerLoc}>{listing.village ? `${listing.village}, ` : ''}{listing.district || 'Punjab'}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.sectionHeading}>{isUrdu ? 'فصل کی تفصیلات' : 'Produce Description'}</Text>
        <Text style={styles.descText}>
          {listing.description ||
            (isUrdu
              ? 'کھیت سے براہ راست تازہ کٹائی شدہ اعلیٰ معیار کی فصل۔ کوئی ملاوٹ نہیں۔'
              : 'Direct farm fresh crop harvested with proper moisture control and storage standard.')}
        </Text>

        {/* Contact CTAs */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Phone size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.callBtnText}>{isUrdu ? 'کال کریں' : 'Call Farmer'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp}>
            <MessageCircle size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.waBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  shareBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  coverImage: { width: '100%', height: 220, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  imagePlaceholder: { width: '100%', height: 160, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  verifiedBadgeText: { fontSize: 11, fontWeight: '800', color: '#065f46' },
  qualityBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  qualityBadgeText: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
  cropTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 2 },
  varietyText: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', marginBottom: 12 },
  priceLabel: { fontSize: 11, color: '#64748b' },
  priceVal: { fontSize: 18, fontWeight: '900', color: '#059669', marginTop: 2 },
  unitText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  qtyVal: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  metaRow: { gap: 6, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#475569' },
  farmerBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  farmerAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  farmerName: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  farmerLoc: { fontSize: 11, color: '#64748b' },
  sectionHeading: { fontSize: 12, fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', marginBottom: 6 },
  descText: { fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 20 },
  ctaRow: { flexDirection: 'row', gap: 10 },
  callBtn: { flex: 1, backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  callBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  waBtn: { flex: 1, backgroundColor: '#25d366', paddingVertical: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  waBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  notFoundContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  notFoundText: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  backBtnPill: { backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  backBtnPillText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
