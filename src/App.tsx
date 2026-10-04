// ─────────────────────────────────────────────────────────────────────────────
// src/App.tsx
// Root application component for FasalDost (Web edition)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Language, isRTL } from './utils/i18n';
import { getLang, setLang } from './utils/store';
import { auth, onAuthStateChanged, logOutUser, User } from './utils/firebase';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './modules/auth';
import { HomeScreen, FarmerProfileScreen, SettingsScreen } from './modules/farmer';
import { ScanScreen, ResultScreen, HistoryScreen } from './modules/diagnostics';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { UpdateToast } from './components/UpdateToast';
import {
  MarketplaceScreen,
  CreateListingScreen,
  ListingDetailScreen,
  SellerVerificationScreen,
} from './modules/marketplace';

interface NavigationState {
  screen: string;
  params: any;
}

// ── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[FasalDost ErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 text-rose-600 shadow-2xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-500 mb-6 max-w-xs leading-relaxed">
            An unexpected error occurred. Please tap retry to reload the interface.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-slate-900 text-white font-extrabold text-sm active:scale-95 transition shadow-sm hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [lang, setLangState] = useState<Language>(() => {
    return (getLang() as Language) || 'en';
  });
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('fd_onboarding_completed') === 'true';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('fd_auth_session') === 'true';
  });

  const handleLanguageChange = (newLang: Language) => {
    setLangState(newLang);
    setLang(newLang);
  };

  const [historyStack, setHistoryStack] = useState<NavigationState[]>([
    { screen: 'Home', params: {} },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('fd_auth_session', 'true');
      }
    });
    return () => unsubscribe();
  }, []);

  const currentNav = historyStack[historyStack.length - 1] || {
    screen: 'Home',
    params: {},
  };

  const navigate = (screen: string, params: any = {}) => {
    setHistoryStack((prev) => [...prev, { screen, params }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setHistoryStack((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, prev.length - 1);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('fd_auth_session', 'true');
    setHistoryStack([{ screen: 'Home', params: {} }]);
  };

  const handleSignOut = async () => {
    await logOutUser();
    setIsAuthenticated(false);
    localStorage.removeItem('fd_auth_session');
    setHistoryStack([{ screen: 'Home', params: {} }]);
  };

  return (
    <ErrorBoundary>
      <UpdateToast />
      <div
        dir={isRTL(lang) ? 'rtl' : 'ltr'}
        className="min-h-screen bg-slate-100/90 flex items-center justify-center p-0 sm:p-5 text-slate-900"
      >
        {/* Mobile App Container Frame - Professional White */}
        <div className="w-full max-w-md min-h-screen sm:min-h-[850px] sm:max-h-[920px] bg-white sm:rounded-[32px] sm:border sm:border-slate-200/90 sm:shadow-[0_20px_50px_rgba(15,23,42,0.08)] flex flex-col overflow-hidden relative">
          
          {/* 3-Second Play Store Launch Splash Screen */}
          {showSplash && (
            <SplashScreen
              durationMs={3000}
              onFinish={() => setShowSplash(false)}
            />
          )}

          {/* Subtle top indicator bar on desktop */}
          <div className="hidden sm:flex justify-center pt-3 pb-1">
            <div className="w-16 h-1 rounded-full bg-slate-200" />
          </div>

          {/* Screen Content Area */}
          <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 bg-white flex flex-col">
            {/* 1. Mandatory 5-Point Farmer Onboarding right after splash screen */}
            {!showSplash && !hasCompletedOnboarding ? (
              <OnboardingScreen
                currentLang={lang}
                onLanguageChange={handleLanguageChange}
                onComplete={() => {
                  setHasCompletedOnboarding(true);
                  setIsAuthenticated(true);
                  setHistoryStack([{ screen: 'Home', params: {} }]);
                }}
              />
            ) : !showSplash && !isAuthenticated ? (
              <AuthScreen
                onSuccess={handleAuthSuccess}
                onSkip={handleAuthSuccess}
              />
            ) : (
              <>
                {currentNav.screen === 'Home' && (
                  <HomeScreen
                    lang={lang}
                    onNavigate={navigate}
                  />
                )}

                {currentNav.screen === 'Scan' && (
                  <ScanScreen
                    lang={lang}
                    onNavigate={navigate}
                    onBack={goBack}
                  />
                )}

                {currentNav.screen === 'Result' && (
                  <ResultScreen
                    lang={lang}
                    result={currentNav.params?.result}
                    cropName={currentNav.params?.cropName}
                    fromHistory={currentNav.params?.fromHistory}
                    onNavigate={navigate}
                    onBack={goBack}
                  />
                )}

                {currentNav.screen === 'History' && (
                  <HistoryScreen
                    lang={lang}
                    onNavigate={navigate}
                    onBack={goBack}
                  />
                )}

                {currentNav.screen === 'FarmerProfile' && (
                  <FarmerProfileScreen
                    lang={lang}
                    isOnboarding={currentNav.params?.onboarding}
                    onNavigate={navigate}
                    onBack={goBack}
                    onSignOut={handleSignOut}
                  />
                )}

                {currentNav.screen === 'Settings' && (
                  <SettingsScreen
                    lang={lang}
                    onLanguageChange={handleLanguageChange}
                    onNavigate={navigate}
                    onBack={goBack}
                    onSignOut={handleSignOut}
                  />
                )}

                {currentNav.screen === 'Subscription' && (
                  <SubscriptionScreen
                    lang={lang}
                    onBack={goBack}
                  />
                )}

                {currentNav.screen === 'Marketplace' && (
                  <MarketplaceScreen
                    lang={lang}
                    onNavigate={navigate}
                    onBack={goBack}
                  />
                )}

                {currentNav.screen === 'CreateListing' && (
                  <CreateListingScreen
                    lang={lang}
                    onNavigate={navigate}
                    onBack={goBack}
                  />
                )}

                {currentNav.screen === 'SellerVerification' && (
                  <SellerVerificationScreen
                    lang={lang}
                    onNavigate={navigate}
                    onBack={goBack}
                    onVerifiedSuccess={() => navigate('CreateListing')}
                  />
                )}

                {currentNav.screen === 'ListingDetail' && (
                  <ListingDetailScreen
                    lang={lang}
                    listing={currentNav.params?.listing}
                    isOwner={currentNav.params?.isOwner}
                    onNavigate={navigate}
                    onBack={goBack}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
