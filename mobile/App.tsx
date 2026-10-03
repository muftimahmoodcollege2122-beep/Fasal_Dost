// ─────────────────────────────────────────────────────────────────────────────
// mobile/App.tsx
// FasalDost React Native & Expo Root App Navigator (Fully Identical to Web App)
// Supports all 6 languages, full navigation history stack, audio TTS, and auth
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Alert, View, Text, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Updates from 'expo-updates';

import { Language } from './utils/i18n';
import { mobileApi, API_BASE_URL } from './utils/api';

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

export interface NavigationState {
  screen: string;
  params: any;
}

export default function App() {
  const [lang, setLang] = useState<Language>('ur');
  const [showSplash, setShowSplash] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [historyStack, setHistoryStack] = useState<NavigationState[]>([
    { screen: 'Home', params: {} },
  ]);

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
          Alert.alert('App Updated', 'New version downloaded. Restarting...', [
            { text: 'OK', onPress: () => Updates.reloadAsync() },
          ]);
        }
      } catch (e) {
        console.warn('[OTA] Check skipped:', e);
      }
    }
    checkForOtaUpdates();
  }, []);

  const currentNav = historyStack[historyStack.length - 1] || {
    screen: 'Home',
    params: {},
  };

  const navigate = (screen: string, params: any = {}) => {
    setHistoryStack((prev) => [...prev, { screen, params }]);
  };

  const goBack = () => {
    setHistoryStack((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, prev.length - 1);
    });
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setHistoryStack([{ screen: 'Home', params: {} }]);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setHistoryStack([{ screen: 'Home', params: {} }]);
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setIsAuthenticated(true);
    setHistoryStack([{ screen: 'Home', params: {} }]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setSelectedImage(dataUrl);
        analyzeImage(result.assets[0].base64, dataUrl);
      }
    } catch (e) {
      Alert.alert('Image Selection', 'Could not open image library.');
    }
  };

  const captureImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission', 'Please enable camera permission in device settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setSelectedImage(dataUrl);
        analyzeImage(result.assets[0].base64, dataUrl);
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not launch camera.');
    }
  };

  const analyzeImage = async (cleanBase64: string, dataUrl: string) => {
    setLoading(true);
    navigate('Scan');
    try {
      const data = await mobileApi.diagnostics.scan(cleanBase64, '', lang);
      if (data) {
        setScanResult(data);
        navigate('Result', { result: data, imageUri: dataUrl });
      } else {
        Alert.alert('Diagnosis Issue', 'Could not process crop leaf image. Please capture a clear photo.');
        goBack();
      }
    } catch (err: any) {
      Alert.alert('Analysis Failed', err.message || 'AI vision models were unable to process this image.');
      goBack();
    } finally {
      setLoading(false);
    }
  };

  const playAudioNarration = async () => {
    if (playingAudio) {
      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch {}
        setSoundObject(null);
      }
      Speech.stop();
      setPlayingAudio(false);
      return;
    }

    try {
      setPlayingAudio(true);
      const textToSpeak =
        scanResult?.diseases?.[0]?.description_en ||
        scanResult?.rejection_reason_en ||
        'Crop disease analysis details.';

      // Try server-side Gemini 3.8 Flash Lite studio voice synthesis
      try {
        const tts = await mobileApi.diagnostics.synthesizeSpeech(textToSpeak, lang);
        if (tts?.audioBase64) {
          const sound = new Audio.Sound();
          await sound.loadAsync({
            uri: `data:${tts.mimeType || 'audio/wav'};base64,${tts.audioBase64}`,
          });
          setSoundObject(sound);
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setPlayingAudio(false);
            }
          });
          await sound.playAsync();
          return;
        }
      } catch (serverTtsErr) {
        console.warn('[Mobile] Server TTS failed, falling back to local speech:', serverTtsErr);
      }

      // Local Speech fallback
      Speech.speak(textToSpeak, {
        language: lang === 'ur' ? 'ur-PK' : lang === 'hi' ? 'hi-IN' : 'en-US',
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
      ) : !hasCompletedOnboarding ? (
        <OnboardingScreen
          lang={lang}
          onComplete={handleOnboardingComplete}
        />
      ) : !isAuthenticated ? (
        <AuthScreen
          onSuccess={handleAuthSuccess}
          onSkip={handleAuthSuccess}
        />
      ) : (
        <>
          {currentNav.screen === 'Home' && (
            <HomeScreen
              lang={lang as any}
              onNavigate={navigate}
              onPickImage={pickImage}
              onCaptureImage={captureImage}
            />
          )}

          {currentNav.screen === 'Scan' && (
            <ScanScreen
              lang={lang as any}
              imageUri={currentNav.params?.imageUri || selectedImage}
              cropName={currentNav.params?.cropName}
              onPickImage={pickImage}
              onCaptureImage={captureImage}
              onDetect={() => {
                if (selectedImage) {
                  const base64 = selectedImage.includes(',') ? selectedImage.split(',')[1] : selectedImage;
                  analyzeImage(base64, selectedImage);
                }
              }}
              onBack={goBack}
              loading={loading}
            />
          )}

          {currentNav.screen === 'Result' && (
            <ResultScreen
              lang={lang as any}
              result={currentNav.params?.result || scanResult}
              imageUri={currentNav.params?.imageUri || selectedImage}
              onPlayAudio={playAudioNarration}
              playingAudio={playingAudio}
              onBack={() => navigate('Home')}
            />
          )}

          {currentNav.screen === 'History' && (
            <HistoryScreen
              lang={lang as any}
              onNavigate={navigate}
              onBack={goBack}
            />
          )}

          {currentNav.screen === 'FarmerProfile' && (
            <FarmerProfileScreen
              lang={lang as any}
              onNavigate={navigate}
              onBack={goBack}
              onSignOut={handleSignOut}
            />
          )}

          {currentNav.screen === 'Settings' && (
            <SettingsScreen
              lang={lang as any}
              onLanguageChange={handleLanguageChange as any}
              onNavigate={navigate}
              onBack={goBack}
              onSignOut={handleSignOut}
            />
          )}

          {currentNav.screen === 'Subscription' && (
            <SubscriptionScreen
              lang={lang as any}
              onBack={goBack}
            />
          )}

          {currentNav.screen === 'Marketplace' && (
            <MarketplaceScreen
              lang={lang as any}
              onNavigate={navigate}
              onBack={goBack}
            />
          )}

          {currentNav.screen === 'CreateListing' && (
            <CreateListingScreen
              lang={lang as any}
              onBack={goBack}
            />
          )}

          {currentNav.screen === 'ListingDetail' && (
            <ListingDetailScreen
              lang={lang as any}
              listing={currentNav.params?.listing}
              onBack={goBack}
            />
          )}

          {currentNav.screen === 'SellerVerification' && (
            <SellerVerificationScreen
              lang={lang as any}
              onBack={goBack}
            />
          )}

          {currentNav.screen === 'Advisory' && (
            <AdvisoryScreen
              lang={lang as any}
              onBack={goBack}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
