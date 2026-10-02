// ─────────────────────────────────────────────────────────────────────────────
// mobile/App.tsx
// FasalDost React Native & Expo Mobile Application
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Alert,
} from 'react-native';

const API_BASE_URL = 'https://api.fasaldost.pk';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'scan' | 'marketplace'>('home');
  const [scannedResult, setScannedResult] = useState<any>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoTitle}>FasalDost</Text>
        <Text style={styles.logoSubtitle}>Agricultural Intelligence</Text>
      </View>

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, screen === 'home' && styles.navBtnActive]}
          onPress={() => setScreen('home')}
        >
          <Text style={[styles.navBtnText, screen === 'home' && styles.navBtnTextActive]}>
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, screen === 'marketplace' && styles.navBtnActive]}
          onPress={() => setScreen('marketplace')}
        >
          <Text style={[styles.navBtnText, screen === 'marketplace' && styles.navBtnTextActive]}>
            Marketplace
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {screen === 'home' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crop Health Diagnostic</Text>
            <Text style={styles.cardDesc}>
              Capture or upload an image of your crop leaf to get instant AI diagnosis and step-by-step treatment.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => Alert.alert('Camera', 'Opening camera scanner...')}
            >
              <Text style={styles.primaryBtnText}>Scan Crop Leaf</Text>
            </TouchableOpacity>
          </View>
        )}

        {screen === 'marketplace' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kisan Marketplace</Text>
            <Text style={styles.cardDesc}>
              Buy and sell freshly harvested produce directly from verified Pakistani farmers.
            </Text>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => Alert.alert('Marketplace', 'Loading produce feed...')}
            >
              <Text style={styles.secondaryBtnText}>Browse Produce Feed</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  navBar: {
    flexDirection: 'row',
    padding: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  navBtnActive: {
    backgroundColor: '#0f172a',
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  navBtnTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
});
