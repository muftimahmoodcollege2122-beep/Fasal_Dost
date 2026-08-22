// ─────────────────────────────────────────────────────────────────────────────
// src/screens/ListingDetailScreen.js
//
// PURPOSE:
//   Shows full listing detail to buyer.
//   Buyer taps "Contact via WhatsApp" — opens WhatsApp with pre-filled message.
//   If farmer owns listing — shows mark as sold / delete options.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Linking, Share, Image,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import * as Haptics          from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, shadows } from '../utils/theme';
import { textAlign }                        from '../utils/i18n';
import { tm }                               from '../utils/i18n';
import { updateListingStatus }              from '../utils/store';

export default function ListingDetailScreen({ navigation, route }) {
  const lang     = route?.params?.lang     || 'ur';
  const listing  = route?.params?.listing  || {};
  const isOwner  = route?.params?.isOwner  || false;
  const insets   = useSafeAreaInsets();

  const [status, setStatus] = useState(listing.status || 'active');

  // ── Quality display ───────────────────────────────────────────────────────
  const qualityLabel = (q) => {
    const map = {
      premium: { ur: 'اعلیٰ معیار ⭐⭐⭐', en: 'Premium Quality ⭐⭐⭐' },
      medium:  { ur: 'درمیانہ معیار ⭐⭐', en: 'Medium Quality ⭐⭐'   },
      fresh:   { ur: 'تازہ 🌿',            en: 'Fresh 🌿'              },
    };
    return map[q]?.[lang] || q;
  };

  const qualityColor = (q) => {
    if (q === 'premium') return colors.gold;
    if (q === 'fresh')   return '#4ADE80';
    return colors.textSecondary;
  };

  // ── Unit display ──────────────────────────────────────────────────────────
  const unitLabel = (u) => {
    const map = { Maund: { ur: 'من', en: 'Maund' }, KG: { ur: 'کلو', en: 'KG' }, Ton: { ur: 'ٹن', en: 'Ton' } };
    return map[u]?.[lang] || u;
  };

  // ── Contact via WhatsApp ──────────────────────────────────────────────────
  const contactWhatsApp = () => {
    if (!listing.farmerPhone) {
      Alert.alert('', lang === 'ur' ? 'فون نمبر دستیاب نہیں' : 'Phone number not available');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Clean phone number — remove spaces and dashes
    let phone = listing.farmerPhone.replace(/[\s\-]/g, '');
    // Add Pakistan country code if not present
    if (phone.startsWith('0')) phone = '92' + phone.slice(1);
    if (!phone.startsWith('92')) phone = '92' + phone;

    // Pre-filled WhatsApp message
    const message = lang === 'ur'
      ? `السلام علیکم! میں نے فصل دوست ایپ پر آپ کا ${listing.cropName} کا اشتہار دیکھا۔ کیا ابھی ${listing.quantity} ${unitLabel(listing.unit)} دستیاب ہے؟ قیمت PKR ${listing.price} فی ${unitLabel(listing.unit)} پر بات کرنی ہے۔`
      : `Assalam o Alaikum! I saw your ${listing.cropName} listing on FasalDost app. Is ${listing.quantity} ${listing.unit} still available at PKR ${listing.price} per ${listing.unit}? Please confirm.`;

    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to SMS if WhatsApp not installed
        Alert.alert(
          '',
          lang === 'ur' ? 'WhatsApp نہیں ملا — SMS کریں: ' + listing.farmerPhone : `WhatsApp not found — Call or SMS: ${listing.farmerPhone}`,
          [{ text: 'OK' }]
        );
      }
    });
  };

  // ── Share listing ─────────────────────────────────────────────────────────
  const handleShare = async () => {
    const msg = lang === 'ur'
      ? `🌾 ${listing.cropName} فروخت کے لیے دستیاب\nمقدار: ${listing.quantity} ${unitLabel(listing.unit)}\nقیمت: PKR ${listing.price} فی ${unitLabel(listing.unit)}\nمقام: ${listing.district || listing.province}\nفصل دوست ایپ پر دیکھیں`
      : `🌾 ${listing.cropName} Available for Sale\nQuantity: ${listing.quantity} ${listing.unit}\nPrice: PKR ${listing.price} per ${listing.unit}\nLocation: ${listing.district || listing.province}\nFound on FasalDost App`;
    await Share.share({ message: msg });
  };

  // ── Mark as sold ──────────────────────────────────────────────────────────
  const handleMarkSold = () => {
    Alert.alert(
      '',
      lang === 'ur' ? 'کیا یہ فصل فروخت ہو گئی؟' : 'Mark this listing as sold?',
      [
        { text: lang === 'ur' ? 'منسوخ' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ur' ? 'ہاں، فروخت ہوئی' : 'Yes, Sold',
          onPress: async () => {
            const ok = await updateListingStatus(listing.id, 'sold');
            if (ok) {
              setStatus('sold');
              Alert.alert('', lang === 'ur' ? 'مبارک ہو! فروخت ہو گئی ✅' : 'Congratulations! Marked as sold ✅');
            }
          },
        },
      ]
    );
  };

  // ── Delete listing ────────────────────────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      '',
      lang === 'ur' ? 'اشتہار حذف کریں؟' : 'Delete this listing?',
      [
        { text: lang === 'ur' ? 'منسوخ' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ur' ? 'حذف کریں' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await updateListingStatus(listing.id, 'deleted');
            navigation.goBack();
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>
          {lang === 'ur' ? 'اشتہار کی تفصیل' : 'Listing Detail'}
        </Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Status banner ── */}
        {status === 'sold' && (
          <View style={styles.soldBanner}>
            <Text style={styles.soldText}>✅ {lang === 'ur' ? 'یہ فصل فروخت ہو چکی ہے' : 'This produce has been sold'}</Text>
          </View>
        )}

        {/* ── Crop hero card ── */}
        <View style={styles.heroCard}>
          {listing.imageBase64 ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${listing.imageBase64}` }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroIcon}>
              <Text style={styles.heroEmoji}>🌾</Text>
            </View>
          )}
          <Text style={[styles.heroCropName, { textAlign: 'center' }]}>{listing.cropName}</Text>
          <Text style={[styles.heroQuality, { color: qualityColor(listing.quality) }]}>
            {qualityLabel(listing.quality)}
          </Text>
        </View>

        {/* ── Price + Quantity ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>PKR {listing.price}</Text>
            <Text style={styles.statLabel}>{lang === 'ur' ? `فی ${unitLabel(listing.unit)}` : `per ${listing.unit}`}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{listing.quantity}</Text>
            <Text style={styles.statLabel}>{unitLabel(listing.unit)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              PKR {listing.quantity && listing.price
                ? (parseFloat(listing.quantity) * parseFloat(listing.price)).toLocaleString()
                : '—'}
            </Text>
            <Text style={styles.statLabel}>{lang === 'ur' ? 'کل قیمت' : 'Total'}</Text>
          </View>
        </View>

        {/* ── Details ── */}
        <View style={styles.detailCard}>
          <Text style={[styles.detailTitle, { textAlign: textAlign(lang) }]}>
            {lang === 'ur' ? 'تفصیلات' : 'Details'}
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{lang === 'ur' ? 'مقام' : 'Location'}</Text>
              <Text style={[styles.detailValue, { textAlign: textAlign(lang) }]}>
                {[listing.tehsil, listing.district, listing.province].filter(Boolean).join(' — ') || '—'}
              </Text>
            </View>
          </View>

          {listing.description ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📝</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{lang === 'ur' ? 'تفصیل' : 'Description'}</Text>
                <Text style={[styles.detailValue, { textAlign: textAlign(lang) }]}>{listing.description}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👨‍🌾</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{lang === 'ur' ? 'فروخت کنندہ' : 'Seller'}</Text>
              <Text style={[styles.detailValue, { textAlign: textAlign(lang) }]}>
                {listing.farmerName || (lang === 'ur' ? 'کسان' : 'Farmer')}
              </Text>
            </View>
          </View>

          {listing.farmerPhone ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📱</Text>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{lang === 'ur' ? 'فون نمبر' : 'Phone Number'}</Text>
                <Text style={[styles.detailValue, { color: '#4ADE80', fontWeight: '800' }]}>
                  {listing.farmerPhone}
                </Text>
              </View>
              {/* Direct call button */}
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${listing.farmerPhone}`)}
              >
                <Text style={styles.callBtnText}>📞</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noPhoneBox}>
              <Text style={[styles.noPhoneText, { textAlign: textAlign(lang) }]}>
                ⚠️ {lang === 'ur' ? 'فون نمبر دستیاب نہیں — کسان نے نمبر نہیں دیا' : 'Phone not available — farmer did not add a number'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Actions ── */}
        {isOwner ? (
          // Owner actions
          <View style={styles.ownerActions}>
            <Text style={[styles.ownerTitle, { textAlign: 'center' }]}>
              {lang === 'ur' ? '⚙️ اپنا اشتہار' : '⚙️ Your Listing'}
            </Text>
            {status === 'active' && (
              <TouchableOpacity style={styles.soldBtn} onPress={handleMarkSold} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#4ADE80', '#22C55E']}
                  style={styles.soldBtnInner}
                >
                  <Text style={styles.soldBtnText}>✅ {lang === 'ur' ? 'فروخت ہو گئی' : 'Mark as Sold'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑️ {lang === 'ur' ? 'اشتہار حذف کریں' : 'Delete Listing'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Buyer actions
          status === 'active' && listing.farmerPhone && (
            <View style={styles.buyerActions}>
              <TouchableOpacity
                style={styles.whatsappBtn}
                onPress={contactWhatsApp}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.whatsappBtnInner}
                >
                  <Text style={styles.whatsappIcon}>📱</Text>
                  <Text style={styles.whatsappBtnText}>
                    {tm('contactFarmer', lang)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={[styles.whatsappNote, { textAlign: 'center' }]}>
                {lang === 'ur'
                  ? 'WhatsApp پر پیغام بھیجیں اور سودا طے کریں'
                  : 'Send a WhatsApp message and negotiate directly'}
              </Text>
            </View>
          )
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forestDeep },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: 12 },
  backBtn:     { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backIcon:    { fontSize: 20, color: colors.textPrimary },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  shareBtn:    { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  shareIcon:   { fontSize: 20 },

  scroll: { padding: spacing.md, paddingBottom: 48 },

  // Sold banner
  soldBanner: { backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: radius.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)', alignItems: 'center' },
  soldText:   { fontSize: 14, fontWeight: '700', color: '#4ADE80' },

  // Hero
  heroCard:     { backgroundColor: colors.surfaceLight, borderRadius: radius.xl, padding: spacing.lg, marginBottom: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  heroIcon:     { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(244,185,66,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  heroImage:    { width: '100%', height: 200, borderRadius: radius.lg, marginBottom: 12 },
  heroEmoji:    { fontSize: 40 },
  heroCropName: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 },
  heroQuality:  { fontSize: 14, fontWeight: '700' },

  // Stats
  statsRow:    { flexDirection: 'row', backgroundColor: colors.surfaceLight, borderRadius: radius.xl, marginBottom: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  statCard:    { flex: 1, padding: 16, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 12 },
  statValue:   { fontSize: 15, fontWeight: '800', color: colors.gold, marginBottom: 4 },
  statLabel:   { fontSize: 11, color: colors.textMuted },

  // Details
  detailCard:    { backgroundColor: colors.surfaceLight, borderRadius: radius.xl, padding: spacing.md, marginBottom: 12, borderWidth: 1, borderColor: colors.border, gap: 14 },
  detailTitle:   { fontSize: 14, fontWeight: '700', color: colors.gold, marginBottom: 4 },
  detailRow:     { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  detailIcon:    { fontSize: 18, marginTop: 2 },
  detailContent: { flex: 1 },
  detailLabel:   { fontSize: 11, color: colors.textMuted, marginBottom: 3 },
  detailValue:   { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },

  // Buyer actions
  buyerActions:    { gap: 12 },
  whatsappBtn:     { borderRadius: radius.lg, overflow: 'hidden', ...shadows.glow },
  whatsappBtnInner:{ flexDirection: 'row', padding: 18, alignItems: 'center', justifyContent: 'center', gap: 10 },
  whatsappIcon:    { fontSize: 22 },
  whatsappBtnText: { fontSize: 17, fontWeight: '800', color: colors.white },
  whatsappNote:    { fontSize: 12, color: colors.textMuted, lineHeight: 18 },

  // Owner actions
  ownerActions: { gap: 12 },
  ownerTitle:   { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  soldBtn:      { borderRadius: radius.lg, overflow: 'hidden' },
  soldBtnInner: { padding: 16, alignItems: 'center' },
  soldBtnText:  { fontSize: 16, fontWeight: '800', color: colors.white },
  deleteBtn:    { padding: 14, alignItems: 'center', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.06)' },
  deleteBtnText:{ fontSize: 14, fontWeight: '700', color: '#F87171' },
  callBtn:      { width: 40, height: 40, borderRadius: radius.full, backgroundColor: 'rgba(74,222,128,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  callBtnText:  { fontSize: 20 },
  noPhoneBox:   { backgroundColor: 'rgba(248,113,113,0.06)', borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  noPhoneText:  { fontSize: 13, color: '#F87171', lineHeight: 20 },
});
