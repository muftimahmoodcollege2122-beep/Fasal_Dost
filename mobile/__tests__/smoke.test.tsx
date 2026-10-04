import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { MarketplaceScreen } from '../screens/MarketplaceScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { FarmerProfileScreen } from '../screens/FarmerProfileScreen';
import { SellerVerificationScreen } from '../screens/SellerVerificationScreen';
import { CreateListingScreen } from '../screens/CreateListingScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { AuthScreen } from '../screens/AuthScreen';

const nav = jest.fn();
const noop = () => {};
const listing: any = { id: 'L1', farmerId: 'u', farmerName: 'Ali', farmerPhone: '03001234567', province: 'Punjab', district: 'Lahore', cropName: 'Wheat', quantity: '10', unit: 'Kg', price: '100', quality: 'Premium', images: [], videos: [], status: 'available' };
const result: any = { crop_detected_en: 'Wheat', overall_confidence: 90, is_healthy: false, diseases: [{ disease_name_en: 'Rust', severity: 'high', treatment_en: ['Spray'], symptoms_en: ['Spots'] }] };

const cases: [string, React.ReactElement][] = [
  ['Onboarding', <OnboardingScreen currentLang="en" onLanguageChange={noop} onComplete={noop} />],
  ['Auth', <AuthScreen onSuccess={noop} onSkip={noop} />],
  ['Home', <HomeScreen lang="ur" onNavigate={nav} />],
  ['Scan', <ScanScreen lang="en" onNavigate={nav} onBack={noop} />],
  ['History', <HistoryScreen lang="en" onNavigate={nav} onBack={noop} />],
  ['Marketplace', <MarketplaceScreen lang="en" onNavigate={nav} onBack={noop} />],
  ['Settings', <SettingsScreen lang="en" onLanguageChange={noop} onNavigate={nav} onBack={noop} onSignOut={noop} />],
  ['Subscription', <SubscriptionScreen lang="en" onBack={noop} />],
  ['FarmerProfile', <FarmerProfileScreen lang="en" onNavigate={nav} onBack={noop} onSignOut={noop} />],
  ['SellerVerification', <SellerVerificationScreen lang="en" onNavigate={nav} onBack={noop} onVerifiedSuccess={noop} />],
  ['CreateListing', <CreateListingScreen lang="en" onNavigate={nav} onBack={noop} />],
  ['Result', <ResultScreen lang="en" result={result} cropName="Wheat" onNavigate={nav} onBack={noop} />],
  ['ListingDetail', <ListingDetailScreen lang="en" listing={listing} isOwner={false} onNavigate={nav} onBack={noop} />],
];

describe.each(cases)('%s renders', (_n, el) => {
  it('mounts without throwing', async () => {
    let tree: any;
    await act(async () => { tree = renderer.create(el); });
    expect(tree.toJSON()).toBeTruthy();
    await act(async () => { tree.unmount(); });
  });
});
