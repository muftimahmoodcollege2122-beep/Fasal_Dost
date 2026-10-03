// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/MarketplaceScreen.tsx
// React Native Marketplace Screen matching web UI 100% identically
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { ArrowLeft, Store, Plus, MapPin, RefreshCw, CheckCircle2 } from 'lucide-react-native';

const API_BASE_URL = 'https://ais-dev-hexsq6a75nx3v7mukdbtq4-171051146732.asia-southeast1.run.app';

export function MarketplaceScreen({ lang, onNavigate, onBack }: { lang: 'ur' | 'en'; onNavigate: (screen: string, params?: any) => void; onBack: () => void }) {
  const isUrdu = lang === 'ur';
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/marketplace/listings`);
      const data = await res.json();
      if (data.success && data.data) {
        setListings(data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClick = () => {
    onNavigate('CreateListing');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ArrowLeft size={18} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Store size={16} color="#0f172a" />
            <Text style={styles.headerTitle}>Marketplace</Text>
          </View>
          <Text style={styles.headerSub}>{isUrdu ? 'لائیو کسان منڈی' : 'Live Farmers Produce Exchange'}</Text>
        </View>

        <TouchableOpacity style={styles.postBtn} onPress={handleCreateClick}>
          <Plus size={14} color="#ffffff" style={{ marginRight: 2 }} />
          <Text style={styles.postBtnText}>{isUrdu ? 'اشتہار' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0f172a" />
          <Text style={styles.centerText}>{isUrdu ? 'فصلیں لوڈ ہو رہی ہیں...' : 'Loading marketplace listings...'}</Text>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centerBox}>
          <Store size={36} color="#94a3b8" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>{isUrdu ? 'کوئی فصل درج نہیں ہے' : 'No Produce Listed Yet'}</Text>
          <Text style={styles.emptyDesc}>
            {isUrdu ? 'پہلی فصل تصویر کے ساتھ منڈی میں درج کریں۔' : 'Be the first farmer to list freshly harvested crops for buyers nationwide.'}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateClick}>
            <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>{isUrdu ? 'نیا اشتہار بنائیں' : 'Create First Listing'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={styles.listHeaderRow}>
            <Text style={styles.countText}>{listings.length} {isUrdu ? 'فعال لسٹنگز' : 'Active Listings'}</Text>
            <TouchableOpacity onPress={loadData} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={12} color="#64748b" />
              <Text style={styles.refreshText}>{isUrdu ? 'ریشریف' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {listings.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => onNavigate('ListingDetail', { listing: item })}
              >
                <View style={styles.imgPlaceholder}>
                  <Text style={{ fontSize: 24 }}>🌾</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cropTitle} numberOfLines={1}>{item.title || item.cropType || 'Crop Produce'}</Text>
                  <Text style={styles.price}>PKR {item.pricePerUnit || item.price || '3,800'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <MapPin size={10} color="#64748b" />
                    <Text style={styles.loc} numberOfLines={1}>{item.location || 'Punjab, Pakistan'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  titleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  headerSub: { fontSize: 10, fontWeight: '600', color: '#64748b', marginTop: 1 },
  postBtn: { backgroundColor: '#0f172a', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  postBtnText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  centerText: { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  emptyDesc: { fontSize: 12, color: '#64748b', textAlign: 'center', paddingHorizontal: 20, marginBottom: 16, lineHeight: 18 },
  primaryBtn: { backgroundColor: '#0f172a', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  primaryBtnText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countText: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  refreshText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  card: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 10 },
  imgPlaceholder: { width: '100%', height: 100, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 10 },
  cropTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  price: { fontSize: 13, fontWeight: '900', color: '#059669' },
  loc: { fontSize: 10, color: '#64748b' },
});
