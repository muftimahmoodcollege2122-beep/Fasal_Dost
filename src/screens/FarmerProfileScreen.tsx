// ─────────────────────────────────────────────────────────────────────────────
// src/screens/FarmerProfileScreen.tsx
// 3-step farmer onboarding and profile management screen (Professional White)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sprout,
  User,
  Settings,
  MapPin,
  Check,
  AlertCircle,
  CheckCircle2,
  Phone,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Language, t, PROVINCES, CROPS } from '../utils/i18n';
import { saveFarmerProfile, getFarmerProfile } from '../utils/store';

interface FarmerProfileScreenProps {
  lang: Language;
  isOnboarding?: boolean;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
  onSignOut?: () => void;
}

export const FarmerProfileScreen: React.FC<FarmerProfileScreenProps> = ({
  lang,
  isOnboarding = false,
  onNavigate,
  onBack,
  onSignOut,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [landSize, setLandSize] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    (async () => {
      const p = await getFarmerProfile();
      if (p) {
        setName(p.name || '');
        setPhone(p.phone || '');
        setProvince(p.province || '');
        setDistrict(p.district || '');
        setTehsil(p.tehsil || '');
        setLandSize(p.landSize || '');
        setSelectedCrops(Array.isArray(p.crops) ? p.crops : []);
      }
    })();
  }, []);

  const toggleCrop = (cropEn: string) => {
    setSelectedCrops((prev) =>
      prev.includes(cropEn) ? prev.filter((c) => c !== cropEn) : [...prev, cropEn]
    );
  };

  const goNext = () => {
    setValidationError('');
    if (currentStep === 1) {
      if (!name.trim()) {
        setValidationError(t('nameRequired', lang));
        return;
      }
      if (!province) {
        setValidationError(t('provinceRequired', lang));
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    setValidationError('');
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else if (!isOnboarding) {
      onBack();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setValidationError('');
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
    setSaving(false);

    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => {
        if (isOnboarding) {
          onNavigate('Home');
        } else {
          onBack();
        }
      }, 1000);
    } else {
      setValidationError(t('error', lang));
    }
  };

  const steps = [
    { icon: User, en: 'Personal Info' },
    { icon: MapPin, en: 'Your Location' },
    { icon: Sprout, en: 'Land & Crops' },
  ];

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-3 border-b border-slate-100 pb-3">
        {!isOnboarding || currentStep > 1 ? (
          <button
            onClick={goPrev}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <h2 className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
          <User className="w-4 h-4 text-slate-800" />
          <span>{t('farmerProfile', lang)}</span>
        </h2>

        {/* Settings Button */}
        <button
          onClick={() => onNavigate('Settings')}
          title="Settings & Farm Hub"
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Welcome Banner for onboarding */}
      {isOnboarding && (
        <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2 text-slate-800 shadow-2xs">
            <Sprout className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base mb-1">
            {t('welcomeTitle', lang)}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {t('welcomeDesc', lang)}
          </p>
        </div>
      )}

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-5 px-3">
        {steps.map((s, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isDone = currentStep > stepNum;
          const IconComp = s.icon;

          return (
            <div key={idx} className="flex flex-col items-center flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition border ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : isDone
                    ? 'border-slate-300 bg-slate-100 text-slate-800'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : <IconComp className="w-4 h-4" />}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-400'
                }`}
              >
                {s.en}
              </span>
            </div>
          );
        })}
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="mb-4 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Saved Success Toast */}
      {savedSuccess && (
        <div className="mb-4 p-3.5 rounded-xl border border-slate-200 bg-slate-900 text-white text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{t('profileSaved', lang)}</span>
        </div>
      )}

      {/* Step 1: Personal Info */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-700" />
                <span>{t('farmerName', lang)} *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePH', lang)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-700" />
                <span>{t('farmerPhone', lang)}</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phonePH', lang)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-700" />
                <span>{t('farmerProvince', lang)} *</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROVINCES.map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setProvince(prov)}
                    className={`p-3 rounded-xl text-xs font-bold border transition text-left ${
                      province === prov
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Location */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {t('farmerDistrict', lang)}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t('districtPH', lang)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {t('farmerTehsil', lang)}
              </label>
              <input
                type="text"
                value={tehsil}
                onChange={(e) => setTehsil(e.target.value)}
                placeholder={t('tehsilPH', lang)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Accurate location information enables hyper-localized disease alerts and connects you with nearby buyers.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Land & Crops */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {t('farmerLand', lang)}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  placeholder={t('landPH', lang)}
                  className="w-full p-3 pr-16 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Acres
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 inline-flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-slate-700" />
                <span>{t('farmerCrops', lang)}</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Select one or more cultivated crops
              </p>
              <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {CROPS.map((crop) => {
                  const selected = selectedCrops.includes(crop.en);
                  return (
                    <button
                      key={crop.en}
                      type="button"
                      onClick={() => toggleCrop(crop.en)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition text-center ${
                        selected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {crop.name || crop.en}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Profile Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <h4 className="font-bold text-slate-900 mb-2 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-slate-800" />
              <span>Profile Summary</span>
            </h4>
            <p><span className="font-semibold text-slate-800">Name:</span> {name || '—'}</p>
            {phone && <p><span className="font-semibold text-slate-800">Phone:</span> {phone}</p>}
            <p><span className="font-semibold text-slate-800">Province:</span> {province || '—'}</p>
            {district && <p><span className="font-semibold text-slate-800">District:</span> {district}</p>}
            {landSize && <p><span className="font-semibold text-slate-800">Land:</span> {landSize} Acres</p>}
            {selectedCrops.length > 0 && (
              <p><span className="font-semibold text-slate-800">Crops:</span> {selectedCrops.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Step Navigation Buttons */}
      <div className="mt-5 flex gap-3">
        {currentStep < 3 ? (
          <button
            onClick={goNext}
            className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-sm transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span>Saving profile...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('saveProfile', lang)}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Sign Out Option */}
      {!isOnboarding && onSignOut && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={onSignOut}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition"
          >
            Sign Out of Account
          </button>
        </div>
      )}
    </div>
  );
};
