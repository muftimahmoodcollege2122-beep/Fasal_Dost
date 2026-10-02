// ─────────────────────────────────────────────────────────────────────────────
// src/screens/OnboardingScreen.tsx
// 5-Point Farmer Onboarding Flow (Name, Mobile, Identity, Village/Area, Language)
// Displayed immediately after splash screen with professional black & white UI
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef } from 'react';
import {
  User,
  Phone,
  CreditCard,
  MapPin,
  Languages,
  ArrowRight,
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sprout,
  ShieldCheck,
  X,
  Globe,
} from 'lucide-react';
import { Language, PROVINCES, SUPPORTED_LANGUAGES, t, isRTL } from '../utils/i18n';
import { saveFarmerProfile, setLang } from '../utils/store';

interface OnboardingScreenProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  currentLang,
  onLanguageChange,
  onComplete,
}) => {
  // Step tracker: 1 to 5
  const [step, setStep] = useState(1);

  // 1. Language
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLang);

  const handleSelectLanguage = (langCode: Language) => {
    setSelectedLanguage(langCode);
    setLang(langCode);
    onLanguageChange(langCode);
  };

  // 2. Full Name
  const [fullName, setFullName] = useState('');

  // 3. Mobile Number
  const [phoneNumber, setPhoneNumber] = useState('');

  // 4. Village / Area
  const [province, setProvince] = useState('Punjab');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [villageArea, setVillageArea] = useState('');

  // 5. Identity Verification (CNIC & Card Photo)
  const [cnicNumber, setCnicNumber] = useState('');
  const [cnicPhoto, setCnicPhoto] = useState<string | null>(null);

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCnicChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }
    setCnicNumber(formatted);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setErrorMsg('CNIC photo must be under 12MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCnicPhoto(reader.result as string);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const validateCurrentStep = (): boolean => {
    setErrorMsg('');

    if (step === 1) {
      if (!selectedLanguage) {
        setErrorMsg('Please select your preferred language.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMsg('Please enter your full name.');
        return false;
      }
      return true;
    }

    if (step === 3) {
      const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMsg('Please enter a valid active mobile phone number.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!villageArea.trim()) {
        setErrorMsg('Please enter your village, town, or local area.');
        return false;
      }
      if (!district.trim()) {
        setErrorMsg('Please enter your district.');
        return false;
      }
      return true;
    }

    if (step === 5) {
      const cleanCnic = cnicNumber.replace(/\D/g, '');
      if (cleanCnic.length !== 13) {
        setErrorMsg('Please enter a valid 13-digit Pakistani CNIC number.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      await handleFinishOnboarding();
    }
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  const handleFinishOnboarding = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Save language preference
      setLang(selectedLanguage as Language);

      // 2. Persist Farmer Profile with all 5 elements
      await saveFarmerProfile({
        name: fullName.trim(),
        phone: phoneNumber.trim(),
        province,
        district: district.trim(),
        tehsil: tehsil.trim(),
        village: villageArea.trim(),
        cnicNumber: cnicNumber.trim(),
        isSellerVerified: !!cnicPhoto,
        savedAt: new Date().toISOString(),
      });

      // 3. Mark Onboarding as Completed
      localStorage.setItem('fd_onboarding_completed', 'true');
      localStorage.setItem('fd_auth_session', 'true');

      onComplete();
    } catch (err: any) {
      console.error('Onboarding save failed:', err);
      setErrorMsg(err?.message || 'Failed to save information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full justify-between pb-6 pt-2 px-1 select-none">
      {/* Hidden file input for CNIC */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header & Step Tracker */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="w-9 h-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-800 hover:bg-neutral-100 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold">
              FD
            </div>
          )}

          <div className="text-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900">
              Farmer Setup ({step}/5)
            </h2>
            <p className="text-[10px] text-neutral-400 font-semibold">
              {step === 1 && 'Language Preference'}
              {step === 2 && 'Personal Name'}
              {step === 3 && 'Mobile Contact'}
              {step === 4 && 'Village & Area'}
              {step === 5 && 'Identity Verification'}
            </p>
          </div>

          <div className="w-9 text-right text-xs font-bold text-neutral-400">
            {Math.round((step / 5) * 100)}%
          </div>
        </div>

        {/* 5-Step Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>

        {/* Validation Error Notice */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 1: LANGUAGE PREFERENCE
           ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-neutral-900">
                Select Your Language
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Choose your preferred language for advice and app interface
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {SUPPORTED_LANGUAGES.map((langItem) => {
                const isSelected = selectedLanguage === langItem.code;
                return (
                  <button
                    key={langItem.code}
                    type="button"
                    onClick={() => handleSelectLanguage(langItem.code)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold">{langItem.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span
                      className={`text-sm font-black ${
                        isSelected ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {langItem.native}
                    </span>
                    <span
                      className={`text-[10px] font-semibold mt-1 ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-400'
                      }`}
                    >
                      {langItem.population}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 2: FULL NAME
           ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-neutral-900">
                What is your Name?
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Please enter your full legal name as per official records
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-2">
              <label className="block text-xs font-bold text-neutral-800">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Muhammad Tariq Khan"
                  className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <p className="text-[10px] text-neutral-400 pt-1">
                Your name will appear on your farmer profile and produce listings.
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 3: MOBILE NUMBER
           ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-neutral-900">
                Your Mobile Number
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Active contact number for disease advisories and buyer inquiries
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-2">
              <label className="block text-xs font-bold text-neutral-800">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-neutral-300 text-sm font-semibold text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <p className="text-[10px] text-neutral-400 pt-1">
                Supports all active Pakistani mobile networks (Jazz, Zong, Telenor, Ufone).
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 4: VILLAGE / AREA
           ════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-neutral-900">
                Village & Farm Location
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Locate your farm for tailored regional disease alerts and weather data
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
              {/* Village / Area */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Village / Chak / Area Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={villageArea}
                  onChange={(e) => setVillageArea(e.target.value)}
                  placeholder="e.g. Chak 204 RB, Manawala"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 font-semibold"
                />
              </div>

              {/* Province */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Province *
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 font-semibold cursor-pointer"
                >
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* District & Tehsil */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Faisalabad"
                    className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 font-semibold"
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
                    className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 5: IDENTITY VERIFICATION
           ════════════════════════════════════════════════════════════════════ */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto mb-2 text-neutral-900">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-neutral-900">
                Identity Verification
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Pakistani CNIC card verification for farmer trust & marketplace selling
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
              {/* CNIC Number */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  13-Digit CNIC Number *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={15}
                  value={cnicNumber}
                  onChange={(e) => handleCnicChange(e.target.value)}
                  placeholder="XXXXX-XXXXXXX-X"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 text-sm font-bold font-mono tracking-wider text-neutral-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* CNIC Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  CNIC Card Photo (Optional / Recommended)
                </label>

                {cnicPhoto ? (
                  <div className="relative aspect-16/9 rounded-xl overflow-hidden border border-neutral-300 bg-neutral-100">
                    <img
                      src={cnicPhoto}
                      alt="CNIC Card"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCnicPhoto(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-neutral-900 text-[9px] font-bold text-white">
                      Document Attached
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 px-3 rounded-xl border-2 border-dashed border-neutral-300 hover:border-neutral-900 bg-neutral-50 flex flex-col items-center justify-center gap-1.5 text-neutral-600 transition cursor-pointer"
                  >
                    <Camera className="w-5 h-5 text-neutral-800" />
                    <span className="text-xs font-bold">Upload CNIC Card Photo</span>
                    <span className="text-[10px] text-neutral-400">
                      Clear photo of your original NADRA card
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2 text-[10px] text-neutral-500 font-semibold border-t border-neutral-100">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-900 shrink-0" />
                <span>Encrypted & stored in secure database storage.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA Actions */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className="w-full h-13 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99] cursor-pointer"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Finalizing Setup...</span>
            </>
          ) : step === 5 ? (
            <>
              <span>Complete Setup & Enter App</span>
              <CheckCircle2 className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
