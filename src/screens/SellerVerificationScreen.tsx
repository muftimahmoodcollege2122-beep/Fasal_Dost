// ─────────────────────────────────────────────────────────────────────────────
// src/screens/SellerVerificationScreen.tsx
// Minimalist Black & White Farmer Identity & Seller Verification Screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  User,
  CreditCard,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Lock,
  FileCheck,
  Check,
} from 'lucide-react';
import { Language, PROVINCES } from '../utils/i18n';
import { getFarmerProfile, verifyFarmerSeller } from '../utils/store';

interface SellerVerificationScreenProps {
  lang: Language;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
  onVerifiedSuccess?: () => void;
}

export const SellerVerificationScreen: React.FC<SellerVerificationScreenProps> = ({
  lang: _lang,
  onNavigate,
  onBack,
  onVerifiedSuccess,
}) => {
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnicNumber, setCnicNumber] = useState('');
  const [province, setProvince] = useState('Punjab');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [village, setVillage] = useState('');
  const [landSizeAcres, setLandSizeAcres] = useState('');

  // Media documents
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [cnicFront, setCnicFront] = useState<string | null>(null);
  const [cnicBack, setCnicBack] = useState<string | null>(null);

  // Anti-bot & anti-fraud declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const cnicFrontInputRef = useRef<HTMLInputElement>(null);
  const cnicBackInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const p = await getFarmerProfile();
      if (p) {
        if (p.name) setFullName(p.name);
        if (p.phone) setPhone(p.phone);
        if (p.email) setEmail(p.email);
        if (p.province) setProvince(p.province);
        if (p.district) setDistrict(p.district);
        if (p.tehsil) setTehsil(p.tehsil);
        if (p.village) setVillage(p.village);
        if (p.landSize) setLandSizeAcres(p.landSize);
        if (p.cnicNumber) setCnicNumber(p.cnicNumber);
      }
    })();
  }, []);

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image size must be under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCnicChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 13);
    if (digitsOnly.length > 12) {
      setCnicNumber(`${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 12)}-${digitsOnly.slice(12)}`);
    } else if (digitsOnly.length > 5) {
      setCnicNumber(`${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5)}`);
    } else {
      setCnicNumber(digitsOnly);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCnic = cnicNumber.replace(/\D/g, '');
    if (cleanCnic.length !== 13) {
      setErrorMsg('Please enter a valid 13-digit Pakistani CNIC number.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Farmer full name is required.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please provide a valid Pakistani mobile number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!profilePhoto) {
      setErrorMsg('Please upload a clear farmer photo/selfie.');
      return;
    }
    if (!cnicFront) {
      setErrorMsg('Please upload CNIC Front photo.');
      return;
    }
    if (!cnicBack) {
      setErrorMsg('Please upload CNIC Back photo.');
      return;
    }
    if (!declarationAccepted) {
      setErrorMsg('Please accept the genuine farmer anti-scam declaration.');
      return;
    }

    setLoading(true);

    try {
      const ok = await verifyFarmerSeller({
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        email: email.trim(),
        profilePhotoDataUrl: profilePhoto,
        cnicNumber: cleanCnic,
        cnicFrontDataUrl: cnicFront,
        cnicBackDataUrl: cnicBack,
        province,
        district: district.trim(),
        tehsil: tehsil.trim(),
        village: village.trim(),
        landSizeAcres: landSizeAcres.trim(),
        declarationAccepted: true,
      });

      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          if (onVerifiedSuccess) {
            onVerifiedSuccess();
          } else {
            onNavigate('Marketplace');
          }
        }, 1800);
      } else {
        setErrorMsg('Verification failed. Please check your data and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-16 bg-white text-neutral-900">
      {/* Hidden file inputs */}
      <input
        ref={profileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => handleFileRead(e, setProfilePhoto)}
      />
      <input
        ref={cnicFrontInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileRead(e, setCnicFront)}
      />
      <input
        ref={cnicBackInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileRead(e, setCnicBack)}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between py-2 mb-3 border-b border-neutral-200 pb-3">
        <button
          type="button"
          onClick={onBack}
          title="Back"
          className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-900 hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-base font-extrabold text-neutral-900 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-neutral-900" />
            <span>Seller Verification</span>
          </h2>
          <p className="text-[10px] text-neutral-500 font-medium">
            Anti-Scam Identity Check
          </p>
        </div>

        <div className="w-10" />
      </div>

      {success ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6 space-y-3">
          <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mx-auto text-white shadow-md animate-bounce">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-neutral-900">
            Identity Verified!
          </h3>
          <p className="text-xs text-neutral-600 max-w-xs leading-relaxed">
            Your CNIC and farmer credentials have been authenticated. You can now post and manage listings on the marketplace.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto w-full">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* ── Section 1: Farmer Personal Information ─────────────────────── */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-neutral-800" />
                <span>1. Personal Information</span>
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">Required</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Full Name (As on CNIC) *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Muhammad Aslam"
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                CNIC Number (13 Digits) *
              </label>
              <input
                type="text"
                required
                value={cnicNumber}
                onChange={(e) => handleCnicChange(e.target.value)}
                placeholder="35201-1234567-1"
                maxLength={15}
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs font-mono font-bold tracking-wider focus:bg-white focus:outline-hidden focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:border-neutral-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@email.com"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:border-neutral-900 transition"
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Photos & CNIC Documents ─────────────────────────── */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-neutral-800" />
                <span>2. Photos & Identity Documents</span>
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">Clear Photos</span>
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Farmer Photo / Live Selfie *
              </label>
              <div
                onClick={() => profileInputRef.current?.click()}
                className={`w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${
                  profilePhoto
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                {profilePhoto ? (
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={profilePhoto}
                      alt="Profile Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-neutral-300"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
                        <span>Photo Uploaded</span>
                      </p>
                      <p className="text-[10px] text-neutral-500">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2 text-center">
                    <Camera className="w-6 h-6 text-neutral-600 mb-1.5" />
                    <span className="text-xs font-bold text-neutral-900">
                      Take Photo / Upload Farmer Portrait
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">
                      Clear face photo without filters
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* CNIC Front & Back Dual Scans */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Front */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  CNIC Front *
                </label>
                <div
                  onClick={() => cnicFrontInputRef.current?.click()}
                  className={`w-full p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer text-center transition min-h-[105px] ${
                    cnicFront
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
                  }`}
                >
                  {cnicFront ? (
                    <div className="space-y-1">
                      <img
                        src={cnicFront}
                        alt="CNIC Front"
                        className="w-full h-16 object-cover rounded border border-neutral-300"
                      />
                      <span className="text-[9px] font-bold text-neutral-900 block">
                        Front Uploaded
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <CreditCard className="w-5 h-5 text-neutral-600 mb-1" />
                      <span className="text-[10.5px] font-bold text-neutral-900">
                        CNIC Front
                      </span>
                      <span className="text-[8.5px] text-neutral-400">Clear text</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Back */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  CNIC Back *
                </label>
                <div
                  onClick={() => cnicBackInputRef.current?.click()}
                  className={`w-full p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer text-center transition min-h-[105px] ${
                    cnicBack
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
                  }`}
                >
                  {cnicBack ? (
                    <div className="space-y-1">
                      <img
                        src={cnicBack}
                        alt="CNIC Back"
                        className="w-full h-16 object-cover rounded border border-neutral-300"
                      />
                      <span className="text-[9px] font-bold text-neutral-900 block">
                        Back Uploaded
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <CreditCard className="w-5 h-5 text-neutral-600 mb-1" />
                      <span className="text-[10.5px] font-bold text-neutral-900">
                        CNIC Back
                      </span>
                      <span className="text-[8.5px] text-neutral-400">Clear barcode</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Farm Location ────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-neutral-800" />
                <span>3. Farm Location</span>
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">Jurisdiction</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Province *
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-xs font-bold focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                >
                  {PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

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
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-xs font-semibold focus:outline-hidden focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Tehsil
                </label>
                <input
                  type="text"
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                  placeholder="e.g. Jaranwala"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-xs font-semibold focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Land Size (Acres)
                </label>
                <input
                  type="text"
                  value={landSizeAcres}
                  onChange={(e) => setLandSizeAcres(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-xs font-semibold focus:outline-hidden focus:border-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* ── Section 4: Genuine Farmer Anti-Scam Declaration ───────────── */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-neutral-800" />
                <span>4. Genuine Farmer Anti-Scam Pledge</span>
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">Declaration</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <p className="font-bold text-neutral-900">
                I solemnly confirm and declare:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[10.5px] text-neutral-600">
                <li>I am a real farmer cultivating genuine agricultural crops.</li>
                <li>I am not an automated bot, fake broker, or impersonator.</li>
                <li>All photos, CNIC credentials, and listings are authentic.</li>
                <li>I accept full accountability for my marketplace listings.</li>
              </ul>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="anti-bot-decl"
                type="checkbox"
                required
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-neutral-900 cursor-pointer shrink-0"
              />
              <label htmlFor="anti-bot-decl" className="text-[11px] font-semibold text-neutral-900 leading-snug cursor-pointer select-none">
                I agree to the Genuine Farmer Anti-Scam Declaration.
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !declarationAccepted || !profilePhoto || !cnicFront || !cnicBack}
            className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-black disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Verify Identity & Proceed</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
