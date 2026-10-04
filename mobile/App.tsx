// ─────────────────────────────────────────────────────────────────────────────
// mobile/App.tsx — FasalDost native app. Mirrors src/App.tsx (web) screen-for-screen:
// Splash -> Onboarding -> Auth -> Home/Scan/Result/History/FarmerProfile/Settings/
// Subscription/Marketplace/CreateListing/SellerVerification/ListingDetail.
// ─────────────────────────────────────────────────────────────────────────────
import './global.css';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, BackHandler, Pressable, StatusBar, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

import { Language, isRTL } from './utils/i18n';
import { getLang, setLang } from './utils/store';
import { kv } from './lib/kv';
import { auth, onAuthStateChanged, logOutUser } from './utils/firebase';

import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ResultScreen } from './screens/ResultScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { FarmerProfileScreen } from './screens/FarmerProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { MarketplaceScreen } from './screens/MarketplaceScreen';
import { CreateListingScreen } from './screens/CreateListingScreen';
import { ListingDetailScreen } from './screens/ListingDetailScreen';
import { SellerVerificationScreen } from './screens/SellerVerificationScreen';

interface NavigationState {
  screen: string;
  params: any;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[FasalDost ErrorBoundary]', error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 }}>Something went wrong</Text>
        <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 24 }}>
          An unexpected error occurred. Please tap retry to reload the interface.
        </Text>
        <Pressable onPress={() => this.setState({ hasError: false })} style={{ paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, backgroundColor: '#0f172a' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Retry</Text>
        </Pressable>
      </View>
    );
  }
}

function Root() {
  const [ready, setReady] = useState(false);
  const [lang, setLangState] = useState<Language>('en');
  const [showSplash, setShowSplash] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [historyStack, setHistoryStack] = useState<NavigationState[]>([{ screen: 'Home', params: {} }]);

  // Hydrate persisted state (language / onboarding / session) before first render of real UI
  useEffect(() => {
    (async () => {
      await kv.hydrate();
      setLangState((getLang() as Language) || 'en');
      setHasCompletedOnboarding(kv.getItem('fd_onboarding_completed') === 'true');
      setIsAuthenticated(kv.getItem('fd_auth_session') === 'true');
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        kv.setItem('fd_auth_session', 'true');
      }
    });
    return () => unsub();
  }, []);

  // Over-the-air updates (release builds only)
  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert('App Updated', 'New version downloaded. Restarting...', [{ text: 'OK', onPress: () => Updates.reloadAsync() }]);
        }
      } catch (e) {
        console.warn('OTA check skipped:', e);
      }
    })();
  }, []);

  const currentNav = historyStack[historyStack.length - 1] || { screen: 'Home', params: {} };

  const navigate = useCallback((screen: string, params: any = {}) => {
    setHistoryStack((prev) => [...prev, { screen, params }]);
  }, []);

  const goBack = useCallback(() => {
    setHistoryStack((prev) => (prev.length <= 1 ? prev : prev.slice(0, prev.length - 1)));
  }, []);

  // Android hardware back button behaves like the web app's in-app back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (historyStack.length > 1) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [historyStack.length, goBack]);

  const handleLanguageChange = (newLang: Language) => {
    setLangState(newLang);
    setLang(newLang);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    kv.setItem('fd_auth_session', 'true');
    setHistoryStack([{ screen: 'Home', params: {} }]);
  };

  const handleSignOut = async () => {
    try { await logOutUser(); } catch {}
    setIsAuthenticated(false);
    kv.removeItem('fd_auth_session');
    setHistoryStack([{ screen: 'Home', params: {} }]);
  };

  if (!ready) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  const p = currentNav.params || {};
  let body: React.ReactNode;

  if (!showSplash && !hasCompletedOnboarding) {
    body = (
      <OnboardingScreen
        currentLang={lang}
        onLanguageChange={handleLanguageChange}
        onComplete={() => {
          setHasCompletedOnboarding(true);
          setIsAuthenticated(true);
          setHistoryStack([{ screen: 'Home', params: {} }]);
        }}
      />
    );
  } else if (!showSplash && !isAuthenticated) {
    body = <AuthScreen onSuccess={handleAuthSuccess} onSkip={handleAuthSuccess} />;
  } else {
    switch (currentNav.screen) {
      case 'Scan':
        body = <ScanScreen lang={lang} onNavigate={navigate} onBack={goBack} />;
        break;
      case 'Result':
        body = <ResultScreen lang={lang} result={p.result} cropName={p.cropName} fromHistory={p.fromHistory} onNavigate={navigate} onBack={goBack} />;
        break;
      case 'History':
        body = <HistoryScreen lang={lang} onNavigate={navigate} onBack={goBack} />;
        break;
      case 'FarmerProfile':
        body = <FarmerProfileScreen lang={lang} isOnboarding={p.onboarding} onNavigate={navigate} onBack={goBack} onSignOut={handleSignOut} />;
        break;
      case 'Settings':
        body = <SettingsScreen lang={lang} onLanguageChange={handleLanguageChange} onNavigate={navigate} onBack={goBack} onSignOut={handleSignOut} />;
        break;
      case 'Subscription':
        body = <SubscriptionScreen lang={lang} onBack={goBack} />;
        break;
      case 'Marketplace':
        body = <MarketplaceScreen lang={lang} onNavigate={navigate} onBack={goBack} />;
        break;
      case 'CreateListing':
        body = <CreateListingScreen lang={lang} onNavigate={navigate} onBack={goBack} />;
        break;
      case 'SellerVerification':
        body = <SellerVerificationScreen lang={lang} onNavigate={navigate} onBack={goBack} onVerifiedSuccess={() => navigate('CreateListing')} />;
        break;
      case 'ListingDetail':
        body = <ListingDetailScreen lang={lang} listing={p.listing} isOwner={p.isOwner} onNavigate={navigate} onBack={goBack} />;
        break;
      case 'Home':
      default:
        body = <HomeScreen lang={lang} onNavigate={navigate} />;
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', direction: isRTL(lang) ? 'rtl' : 'ltr' }}>
      <ScrollView
        key={currentNav.screen + historyStack.length}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>
      {showSplash && <SplashScreen durationMs={3000} onFinish={() => setShowSplash(false)} />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <ErrorBoundary>
          <Root />
        </ErrorBoundary>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
