// ─────────────────────────────────────────────────────────────────────────────
// mobile/App.tsx
// FasalDost React Native & Expo Root App Navigator (All 15 Screens)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Updates from 'expo-updates';

import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ResultScreen } from './screens/ResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { FarmerProfileScreen } from './screens/FarmerProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MarketplaceScreen } from './screens/MarketplaceScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { CreateListingScreen } from './screens/CreateListingScreen';
import { ListingDetailScreen } from './screens/ListingDetailScreen';
import { SellerVerificationScreen } from './screens/SellerVerificationScreen';
import { AdvisoryScreen } from './screens/AdvisoryScreen';

const API_BASE_URL = 'https://ais-dev-hexsq6a75nx3v7mukdbtq4-171051146732.asia-southeast1.run.app';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [screen, setScreen] = useState<
    | 'home'
    | 'scan'
    | 'result'
    | 'subscription'
    | 'marketplace'
    | 'history'
    | 'settings'
    | 'profile'
    | 'createlisting'
    | 'listingdetail'
    | 'sellerverification'
    | 'advisory'
  >('home');
  const [lang, setLang] = useState<'ur' | 'en'>('ur');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    async function checkForOtaUpdates() {
      if (__DEV__) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert('App Updated', 'New version downloaded. Restarting...', [{ text: 'OK', onPress: () => Updates.reloadAsync() }]);
        }
      } catch (e) {
        console.warn('OTA check skipped:', e);
      }
    }
    checkForOtaUpdates();
  }, []);

  const navigate = (newScreen: string, _params?: any) => {
    if (newScreen === 'Settings') setScreen('settings');
    else if (newScreen === 'Subscription') setScreen('subscription');
    else if (newScreen === 'Marketplace') setScreen('marketplace');
    else if (newScreen === 'History') setScreen('history');
    else if (newScreen === 'FarmerProfile') setScreen('profile');
    else if (newScreen === 'Scan') setScreen('scan');
    else if (newScreen === 'CreateListing') setScreen('createlisting');
    else if (newScreen === 'ListingDetail') setScreen('listingdetail');
    else if (newScreen === 'SellerVerification') setScreen('sellerverification');
    else if (newScreen === 'Advisory') setScreen('advisory');
    else if (newScreen === 'Home') setScreen('home');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      analyzeImage(result.assets[0].base64);
    }
  };

  const captureImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      analyzeImage(result.assets[0].base64);
    }
  };

  const analyzeImage = async (base64Data: string) => {
    setLoading(true);
    setScreen('scan');
    try {
      const response = await fetch(`${API_BASE_URL}/api/diagnostics/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-language': lang },
        body: JSON.stringify({ imageBase64: base64Data, language: lang }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        setScanResult(data.data);
        setScreen('result');
      } else {
        Alert.alert('Scan Issue', data.error?.message || 'Please upload a clear crop leaf image.');
        setScreen('home');
      }
    } catch {
      Alert.alert('Network Error', 'Could not connect to FasalDost server.');
      setScreen('home');
    } finally {
      setLoading(false);
    }
  };

  const playAudioNarration = async () => {
    if (playingAudio) {
      if (soundObject) {
        await soundObject.stopAsync();
        await soundObject.unloadAsync();
        setSoundObject(null);
      }
      Speech.stop();
      setPlayingAudio(false);
      return;
    }

    try {
      setPlayingAudio(true);
      const textToSpeak = scanResult?.diseases?.[0]?.description_en || 'Crop disease analysis details.';
      Speech.speak(textToSpeak, {
        language: lang === 'ur' ? 'ur-PK' : 'en-US',
        rate: 0.9,
        onDone: () => setPlayingAudio(false),
        onError: () => setPlayingAudio(false),
      });
    } catch {
      setPlayingAudio(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : !onboarded ? (
        <OnboardingScreen lang={lang} onComplete={() => setOnboarded(true)} />
      ) : screen === 'home' ? (
        <HomeScreen lang={lang} onNavigate={navigate} />
      ) : screen === 'scan' ? (
        <ScanScreen lang={lang} onPickImage={pickImage} onCaptureImage={captureImage} onBack={() => setScreen('home')} loading={loading} />
      ) : screen === 'result' ? (
        <ResultScreen lang={lang} result={scanResult} imageUri={selectedImage} onPlayAudio={playAudioNarration} playingAudio={playingAudio} onBack={() => setScreen('home')} />
      ) : screen === 'subscription' ? (
        <SubscriptionScreen lang={lang} onBack={() => setScreen('home')} />
      ) : screen === 'marketplace' ? (
        <MarketplaceScreen lang={lang} onBack={() => setScreen('home')} />
      ) : screen === 'history' ? (
        <HistoryScreen lang={lang} onBack={() => setScreen('home')} />
      ) : screen === 'profile' ? (
        <FarmerProfileScreen lang={lang} onBack={() => setScreen('home')} />
      ) : screen === 'settings' ? (
        <SettingsScreen lang={lang} onLanguageChange={setLang} onBack={() => setScreen('home')} />
      ) : screen === 'createlisting' ? (
        <CreateListingScreen lang={lang} onBack={() => setScreen('marketplace')} />
      ) : screen === 'listingdetail' ? (
        <ListingDetailScreen lang={lang} onBack={() => setScreen('marketplace')} />
      ) : screen === 'sellerverification' ? (
        <SellerVerificationScreen lang={lang} onBack={() => setScreen('profile')} />
      ) : screen === 'advisory' ? (
        <AdvisoryScreen lang={lang} onBack={() => setScreen('home')} />
      ) : (
        <HomeScreen lang={lang} onNavigate={navigate} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
});
