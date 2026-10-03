// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/ListingDetailScreen.tsx
// React Native Produce Listing Details & Buyer Contact Screen
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';

export function ListingDetailScreen({ lang, listing, onBack }: { lang: 'ur' | 'en'; listing?: any; onBack: () => void }) {
  const isUrdu = lang === 'ur';

  const handleContact = () => {
    Alert.alert(
      isUrdu ? 'بیچنے والے سے رابطہ' : 'Contact Seller',
      isUrdu ? 'بیچنے والے کو کال یا ایس ایم ایس بھیجا جا رہا ہے۔' : 'Connecting you with the verified grower via phone/WhatsApp.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← {isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.badge}>✓ Verified Grower</Text>
        <Text style={styles.title}>{listing?.title || 'Fresh Wheat Produce (Grade A)'}</Text>
        <Text style={styles.price}>PKR {listing?.price || '3,800'} / {isUrdu ? 'من' : 'Maund'}</Text>

        <Text style={styles.sectionLabel}>{isUrdu ? 'تفصیلات' : 'Produce Description'}</Text>
        <Text style={styles.desc}>
          {listing?.description || 'Clean, moisture-tested high quality harvest grown in fertile Punjab plains. Direct from farm.'}
        </Text>

        <TouchableOpacity style={styles.btn} onPress={handleContact}>
          <Text style={styles.btnText}>📞 {isUrdu ? 'بیچنے والے سے رابطہ کریں' : 'Call / Contact Grower'}</Text>
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
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#d1fae5', color: '#065f46', fontSize: 11, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  price: { fontSize: 18, fontWeight: '900', color: '#059669', marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 6, textTransform: 'uppercase' },
  desc: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 24 },
  btn: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
});
