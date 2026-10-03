// ─────────────────────────────────────────────────────────────────────────────
// src/screens/SettingsScreen.tsx
// Professional Minimalist Settings Screen (Clean Black & White Design)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Sprout,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Trash2,
  Camera,
  Languages,
  LogOut,
  CheckCircle2,
  ArrowLeft,
  Save,
  RefreshCw,
  AlertTriangle,
  Leaf,
  Cpu,
  Key,
  Crown,
} from 'lucide-react';
import { Language, t, PROVINCES, CROPS, SUPPORTED_LANGUAGES } from '../utils/i18n';
import {
  getFarmerProfile,
  saveFarmerProfile,
  getHistory,
  deleteHistoryItem,
  clearHistory,
  FarmerProfile,
  HistoryItem,
  setLang,
  getOpenRouterApiKey,
  setOpenRouterApiKey,
  getOpenRouterModel,
  setOpenRouterModel,
} from '../utils/store';
import { auth } from '../utils/firebase';

interface SettingsScreenProps {
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
  onSignOut?: () => void;
}

type SettingsTab = 'profile' | 'scans' | 'preferences' | 'security';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  lang,
  onLanguageChange,
  onNavigate,
  onBack,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSellerVerifiedState, setIsSellerVerifiedState] = useState(false);

  // ── Profile State ──────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [landSize, setLandSize] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // ── Recent Scans State ─────────────────────────────────────────────────────
  const [recentScans, setRecentScans] = useState<HistoryItem[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [clearingScans, setClearingScans] = useState(false);

  useEffect(() => {
    loadProfileData();
    loadScansData();
  }, []);

  const loadProfileData = async () => {
    const profile = await getFarmerProfile();
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setProvince(profile.province || '');
      setDistrict(profile.district || '');
      setTehsil(profile.tehsil || '');
      setLandSize(profile.landSize || '');
      setSelectedCrops(Array.isArray(profile.crops) ? profile.crops : []);
      setIsSellerVerifiedState(!!profile.isSellerVerified);
    }
    const currentAuth = auth.currentUser;
    if (currentAuth?.email) {
      setEmail(currentAuth.email);
    }
  };

  const loadScansData = async () => {
    setLoadingScans(true);
    try {
      const scans = await getHistory();
      setRecentScans(scans);
    } finally {
      setLoadingScans(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSavingProfile(true);
    setProfileSuccessMsg('');

    const ok = await saveFarmerProfile({
      name: name.trim(),
      phone: phone.trim(),
      province,
      district: district.trim(),
      tehsil: tehsil.trim(),
      landSize: landSize.trim(),
      crops: selectedCrops,
      savedAt: new Date().toISOString(),
    });

    setSavingProfile(false);
    if (ok) {
      setProfileSuccessMsg('Profile updated successfully');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    }
  };

  const toggleCrop = (cropName: string) => {
    setSelectedCrops((prev) =>
      prev.includes(cropName) ? prev.filter((c) => c !== cropName) : [...prev, cropName]
    );
  };

  const handleDeleteScan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteHistoryItem(id);
    setRecentScans((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllScans = async () => {
    if (!window.confirm('Delete all diagnostic scan history?')) return;
    setClearingScans(true);
    await clearHistory();
    setRecentScans([]);
    setClearingScans(false);
  };

  const openScanResult = (scan: HistoryItem) => {
    if (scan.result) {
      onNavigate('Result', {
        result: scan.result,
        cropName: scan.cropName,
        fromHistory: true,
      });
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 mb-4 border-b border-neutral-200 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-900 hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-base font-extrabold text-neutral-900">
          Account & Settings
        </h1>

        <div className="w-10" />
      </div>

      {/* Subscription Banner */}
      <button
        type="button"
        onClick={() => onNavigate('Subscription')}
        className="w-full mb-4 p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-2xs border border-slate-800 hover:bg-slate-800 transition active:scale-[0.98] cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 font-extrabold border border-white/10">
            <Crown className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="font-extrabold text-sm text-white">
              {lang === 'ur' ? 'فضل دوست پریمیم پیکجز' : 'FasalDost Subscription Plans'}
            </div>
            <div className="text-xs text-slate-300 font-medium">
              {lang === 'ur' ? '7 مفت اسکینز | گولڈ (250 اسکینز/ماہ)، ڈائمنڈ اور لامحدود' : 'Free 7 Scans | Gold (250/mo), Diamond & Unlimited'}
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180" />
      </button>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-2xl mb-5 border border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            activeTab === 'profile'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('scans')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            activeTab === 'scans'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Scans ({recentScans.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            activeTab === 'preferences'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Preferences
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-2 px-1 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
            activeTab === 'security'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Security
        </button>
      </div>

      {/* ── Tab 1: Farmer Profile ────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileSuccessMsg && (
            <div className="p-3 rounded-2xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-neutral-900" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                Personal Information
              </h3>
              {isSellerVerifiedState ? (
                <div className="inline-flex items-center gap-1 bg-neutral-100 border border-neutral-300 text-neutral-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-neutral-900" />
                  <span>Verified Farmer</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('SellerVerification')}
                  className="text-[10px] font-bold text-neutral-900 underline cursor-pointer"
                >
                  Verify Seller Identity →
                </button>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1 flex items-center justify-between">
                <span>Full Name *</span>
                {isSellerVerifiedState && (
                  <span className="text-[10px] text-neutral-900 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-neutral-900" />
                    <span>Verified</span>
                  </span>
                )}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muhammad Aslam"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* Email (Readonly) */}
            {email && (
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-neutral-200 bg-neutral-100 text-xs text-neutral-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location & Land */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
              Farm & Land Details
            </h3>

            {/* Province */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Province
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
              >
                <option value="">Select Province</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* District & Tehsil */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Faisalabad"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Tehsil
                </label>
                <input
                  type="text"
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                  placeholder="e.g. Jaranwala"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* Land Size */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Farm Size (Acres)
              </label>
              <input
                type="number"
                step="0.5"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                placeholder="e.g. 12"
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Primary Crops */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
              Primary Crops Cultivated
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {CROPS.map((c) => {
                const selected = selectedCrops.includes(c.en);
                return (
                  <button
                    key={c.en}
                    type="button"
                    onClick={() => toggleCrop(c.en)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-left flex items-center justify-between cursor-pointer ${
                      selected
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{c.name || c.en}</span>
                    {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={savingProfile}
            className="w-full h-12 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-xs"
          >
            {savingProfile ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Farmer Profile</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ── Tab 2: Recent Disease Scans ─────────────────────────────────── */}
      {activeTab === 'scans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
              Diagnostic Scan History
            </h3>
            {recentScans.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllScans}
                disabled={clearingScans}
                className="text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {loadingScans ? (
            <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-neutral-600" />
              <p className="text-xs font-semibold">Loading scan history...</p>
            </div>
          ) : recentScans.length === 0 ? (
            <div className="p-8 rounded-2xl border border-neutral-200 bg-white text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600 mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-neutral-900 mb-1">
                No Disease Scans Yet
              </h4>
              <p className="text-xs text-neutral-500 mb-4 max-w-xs leading-relaxed">
                Take a photo of an infected leaf or crop to identify diseases and receive instant treatment advice.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('Scan')}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-neutral-800 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>Start Crop Scan</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map((scan) => {
                const isHealthy = scan.result?.is_healthy;
                const primaryDisease = scan.result?.diseases?.[0];
                const rawConf = primaryDisease?.confidence ?? scan.result?.overall_confidence;
                const confidence = rawConf != null
                  ? (rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100))
                  : null;

                return (
                  <div
                    key={scan.id}
                    onClick={() => openScanResult(scan)}
                    className="p-3.5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
                        <Leaf className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-neutral-900 truncate">
                            {scan.cropName || 'Crop'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                            {isHealthy ? 'Healthy' : 'Disease Detected'}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-600 truncate mt-0.5">
                          {isHealthy
                            ? 'No disease detected'
                            : primaryDisease?.disease_name_en || 'Diagnosed'}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(scan.date)}
                          </span>
                          <span>•</span>
                          <span>{confidence}% Confidence</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteScan(scan.id, e)}
                        className="w-8 h-8 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Preferences ───────────────────────────────────────────── */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          {/* Language Selection Card */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-neutral-900">
                Application Language / زبان کا انتخاب
              </h4>
              <p className="text-[10px] text-neutral-400">
                Select your preferred language (Top global languages & Urdu)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {SUPPORTED_LANGUAGES.map((langItem) => {
                const isSelected = lang === langItem.code;
                return (
                  <button
                    key={langItem.code}
                    type="button"
                    onClick={() => {
                      setLang(langItem.code);
                      if (onLanguageChange) {
                        onLanguageChange(langItem.code);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-0.5">
                      <span className="text-xs font-bold">{langItem.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                      {langItem.native}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Account & Security ─────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="space-y-2">
            {/* Seller Verification Action */}
            <button
              type="button"
              onClick={() => onNavigate('SellerVerification')}
              className="w-full p-3.5 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 transition text-left flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-neutral-900">
                      Seller CNIC Verification
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {isSellerVerifiedState ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    {isSellerVerifiedState
                      ? 'CNIC and identity card authenticated'
                      : 'Verify CNIC to unlock marketplace selling'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('FarmerProfile', { onboarding: false })}
              className="w-full p-3.5 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 transition text-left flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    Open Onboarding Wizard
                  </h4>
                  <p className="text-[10px] text-neutral-400">
                    Revisit step-by-step land & crop setup
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('Marketplace')}
              className="w-full p-3.5 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 transition text-left flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-800">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    Kisan Marketplace
                  </h4>
                  <p className="text-[10px] text-neutral-400">
                    Manage your produce and crop listings
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          {/* Sign Out Button */}
          {onSignOut && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onSignOut}
                className="w-full h-11 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
