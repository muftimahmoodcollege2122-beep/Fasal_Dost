// ─────────────────────────────────────────────────────────────────────────────
// mobile/screens/HistoryScreen.tsx
// React Native Diagnostic Scan History Screen (Identical to Web Experience)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Clock, Trash2, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react-native';
import { mobileApi } from '../utils/api';

export function HistoryScreen({ lang, onNavigate, onBack }: { lang: 'ur' | 'en' | string; onNavigate?: (screen: string, params?: any) => void; onBack: () => void }) {
  const isUrdu = lang === 'ur';
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await mobileApi.diagnostics.getHistory(30);
      setItems(data || []);
    } catch {
      // Fallback empty list
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = () => {
    Alert.alert(
      isUrdu ? 'ہسٹری ڈیلیٹ کریں؟' : 'Clear Scan History?',
      isUrdu ? 'کیا آپ تمام سابقہ اسکینز کو حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete all diagnostic scans?',
      [
        { text: isUrdu ? 'منسوخ' : 'Cancel', style: 'cancel' },
        {
          text: isUrdu ? 'ہاں، ڈیلیٹ کریں' : 'Yes, Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileApi.diagnostics.clearHistory();
              setItems([]);
            } catch {}
          },
        },
      ]
    );
  };

  const handleItemClick = (item: any) => {
    if (onNavigate) {
      onNavigate('Result', { result: item, fromHistory: true });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={18} color="#0f172a" />
          <Text style={styles.backText}>{isUrdu ? 'واپس' : 'Back'}</Text>
        </TouchableOpacity>

        {items.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}>
            <Trash2 size={16} color="#dc2626" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{isUrdu ? 'اسکین ہسٹری' : 'Diagnostic Scan History'}</Text>
      <Text style={styles.subtitle}>
        {isUrdu ? 'آپ کے پچھلے تمام فصلوں کے اے آئی ٹیسٹ' : 'Review your previous crop pathology diagnoses'}
      </Text>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0f172a" />
          <Text style={styles.loadingText}>{isUrdu ? 'ہسٹری لوڈ ہو رہی ہے...' : 'Loading scan records...'}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Clock size={40} color="#94a3b8" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>{isUrdu ? 'کوئی سابقہ اسکین موجود نہیں' : 'No Scans Recorded Yet'}</Text>
          <Text style={styles.emptySub}>
            {isUrdu ? 'جب آپ پودوں کے پتوں کو اسکین کریں گے تو ریکارڈ یہاں ظاہر ہوں گے۔' : 'Your crop disease scans will be safely archived here for your farm records.'}
          </Text>
        </View>
      ) : (
        items.map((item, idx) => {
          const isHealthy = item.is_healthy;
          const diseaseName = item.diseases?.[0]?.disease_name_en || (isHealthy ? 'Healthy Specimen' : 'Crop Pathology');
          const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent';

          return (
            <TouchableOpacity key={idx} style={styles.card} onPress={() => handleItemClick(item)}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconBox, isHealthy ? styles.iconHealthy : styles.iconDisease]}>
                  {isHealthy ? <ShieldCheck size={20} color="#059669" /> : <AlertTriangle size={20} color="#d97706" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.crop}>{item.crop_detected_en || 'Crop'}</Text>
                  <Text style={styles.disease}>{diseaseName}</Text>
                  <Text style={styles.date}>📅 {dateStr} • {item.overall_confidence || 95}% {isUrdu ? 'اعتماد' : 'Confidence'}</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  clearBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#64748b', marginBottom: 20 },
  centerBox: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { fontSize: 12, color: '#64748b', marginTop: 8 },
  emptyBox: { backgroundColor: '#ffffff', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginTop: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  card: { backgroundColor: '#ffffff', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconHealthy: { backgroundColor: '#d1fae5' },
  iconDisease: { backgroundColor: '#fef3c7' },
  crop: { fontSize: 11, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  disease: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginVertical: 2 },
  date: { fontSize: 11, color: '#94a3b8' },
});
