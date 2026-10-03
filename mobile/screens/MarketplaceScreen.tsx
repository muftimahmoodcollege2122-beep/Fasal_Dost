// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/MarketplaceScreen.tsx
// React Native Produce Exchange & Marketplace Screen
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export function MarketplaceScreen({ lang, onBack }: { lang: 'ur' | 'en'; onBack: () => void }) {
  const isUrdu = lang === 'ur';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>← {isUrdu ? 'واپس' : 'Back'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isUrdu ? 'کسان منڈی (Produce Exchange)' : 'Produce Exchange Marketplace'}</Text>
      <Text style={styles.subtitle}>{isUrdu ? 'فصل براہ راست خریدیں اور بیچیں' : 'Buy & sell harvest directly with local growers'}</Text>

      <View style={styles.card}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>🌾</Text>
        <Text style={styles.itemTitle}>{isUrdu ? 'گندم (Grade A Wheat)' : 'Fresh Wheat Harvest'}</Text>
        <Text style={styles.itemPrice}>PKR 3,800 / {isUrdu ? 'من' : 'Maund'}</Text>
        <Text style={styles.itemLoc}>📍 Faisalabad, Punjab</Text>
      </View>

      <View style={styles.card}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>🌽</Text>
        <Text style={styles.itemTitle}>{isUrdu ? 'مکئی (Corn / Maize)' : 'Yellow Corn Produce'}</Text>
        <Text style={styles.itemPrice}>PKR 2,900 / {isUrdu ? 'من' : 'Maund'}</Text>
        <Text style={styles.itemLoc}>📍 Sahiwal, Punjab</Text>
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
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  itemTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '900', color: '#059669', marginBottom: 4 },
  itemLoc: { fontSize: 11, color: '#64748b' },
});
