// ─────────────────────────────────────────────────────────────────────────────
// src/screens/SellerVerificationScreen.tsx
// Minimalist Black & White Farmer Identity & Seller Verification Screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { pickMedia, chooseSource } from '../utils/media';
import { Box, Btn, Img, Inp, Opt, Sel, T } from '../ui/web';
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
} from '../ui/icons';
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

  const handleFileRead = async (setter: (val: string) => void, facing: 'user' | 'environment') => {
    const source = await chooseSource();
    if (!source) return;
    const [img] = await pickMedia({ source, facing });
    if (!img) return;
    if (img.base64.length * 0.75 > 15 * 1024 * 1024) {
      setErrorMsg('Image size must be under 15MB.');
      return;
    }
    setter(img.dataUrl);
    setErrorMsg('');
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
    <Box className="flex flex-col min-h-full pb-16 bg-white text-neutral-900">

      {/* Top Header */}
      <Box className="flex items-center justify-between py-2 mb-3 border-b border-neutral-200 pb-3">
        <Btn
          type="button"
          onClick={onBack}
          title="Back"
          className="w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-900 hover:bg-neutral-100 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Btn>

        <Box className="text-center">
          <T className="text-base font-extrabold text-neutral-900 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-neutral-900" />
            <T>Seller Verification</T>
          </T>
          <T className="text-[10px] text-neutral-500 font-medium">
            Anti-Scam Identity Check
          </T>
        </Box>

        <Box className="w-10" />
      </Box>

      {success ? (
        <Box className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6 space-y-3">
          <Box className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mx-auto text-white shadow-md animate-bounce">
            <Check className="w-8 h-8" />
          </Box>
          <T className="text-base font-black text-neutral-900">
            Identity Verified!
          </T>
          <T className="text-xs text-neutral-600 max-w-xs leading-relaxed">
            Your CNIC and farmer credentials have been authenticated. You can now post and manage listings on the marketplace.
          </T>
        </Box>
      ) : (
        <Box onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto w-full">
          {/* Error Banner */}
          {errorMsg && (
            <Box className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
              <T className="font-semibold leading-relaxed">{errorMsg}</T>
            </Box>
          )}

          {/* ── Section 1: Farmer Personal Information ─────────────────────── */}
          <Box className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <Box className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <T className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-neutral-800" />
                <T>1. Personal Information</T>
              </T>
              <T className="text-[10px] font-bold text-neutral-400">Required</T>
            </Box>

            <Box>
              <T className="block text-xs font-bold text-neutral-800 mb-1">
                Full Name (As on CNIC) *
              </T>
              <Inp
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Muhammad Aslam"
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
              />
            </Box>

            <Box>
              <T className="block text-xs font-bold text-neutral-800 mb-1">
                CNIC Number (13 Digits) *
              </T>
              <Inp
                type="text"
                required
                value={cnicNumber}
                onChange={(e) => handleCnicChange(e.target.value)}
                placeholder="35201-1234567-1"
                maxLength={15}
                className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs font-mono font-bold tracking-wider focus:bg-white focus:outline-hidden focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
              />
            </Box>

            <Box className="grid grid-cols-2 gap-2">
              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  Mobile Number *
                </T>
                <Inp
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:border-neutral-900 transition"
                />
              </Box>

              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  Email Address *
                </T>
                <Inp
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@email.com"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-neutral-50 text-neutral-900 text-xs font-semibold focus:bg-white focus:outline-hidden focus:border-neutral-900 transition"
                />
              </Box>
            </Box>
          </Box>

          {/* ── Section 2: Photos & CNIC Documents ─────────────────────────── */}
          <Box className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <Box className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <T className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-neutral-800" />
                <T>2. Photos & Identity Documents</T>
              </T>
              <T className="text-[10px] font-bold text-neutral-400">Clear Photos</T>
            </Box>

            {/* Profile Photo */}
            <Box>
              <T className="block text-xs font-bold text-neutral-800 mb-1">
                Farmer Photo / Live Selfie *
              </T>
              <Box
                onClick={() => handleFileRead(setProfilePhoto, 'user')}
                className={`w-full p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${
                  profilePhoto
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                {profilePhoto ? (
                  <Box className="flex items-center gap-3 w-full">
                    <Img
                      src={profilePhoto}
                      alt="Profile Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-neutral-300"
                    />
                    <Box className="flex-1 min-w-0">
                      <T className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
                        <T>Photo Uploaded</T>
                      </T>
                      <T className="text-[10px] text-neutral-500">Click to change</T>
                    </Box>
                  </Box>
                ) : (
                  <Box className="flex flex-col items-center py-2 text-center">
                    <Camera className="w-6 h-6 text-neutral-600 mb-1.5" />
                    <T className="text-xs font-bold text-neutral-900">
                      Take Photo / Upload Farmer Portrait
                    </T>
                    <T className="text-[10px] text-neutral-400 mt-0.5">
                      Clear face photo without filters
                    </T>
                  </Box>
                )}
              </Box>
            </Box>

            {/* CNIC Front & Back Dual Scans */}
            <Box className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Front */}
              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  CNIC Front *
                </T>
                <Box
                  onClick={() => handleFileRead(setCnicFront, 'environment')}
                  className={`w-full p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer text-center transition min-h-[105px] ${
                    cnicFront
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
                  }`}
                >
                  {cnicFront ? (
                    <Box className="space-y-1">
                      <Img
                        src={cnicFront}
                        alt="CNIC Front"
                        className="w-full h-16 object-cover rounded border border-neutral-300"
                      />
                      <T className="text-[9px] font-bold text-neutral-900 block">
                        Front Uploaded
                      </T>
                    </Box>
                  ) : (
                    <Box className="flex flex-col items-center">
                      <CreditCard className="w-5 h-5 text-neutral-600 mb-1" />
                      <T className="text-[10.5px] font-bold text-neutral-900">
                        CNIC Front
                      </T>
                      <T className="text-[8.5px] text-neutral-400">Clear text</T>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Back */}
              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  CNIC Back *
                </T>
                <Box
                  onClick={() => handleFileRead(setCnicBack, 'environment')}
                  className={`w-full p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer text-center transition min-h-[105px] ${
                    cnicBack
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100'
                  }`}
                >
                  {cnicBack ? (
                    <Box className="space-y-1">
                      <Img
                        src={cnicBack}
                        alt="CNIC Back"
                        className="w-full h-16 object-cover rounded border border-neutral-300"
                      />
                      <T className="text-[9px] font-bold text-neutral-900 block">
                        Back Uploaded
                      </T>
                    </Box>
                  ) : (
                    <Box className="flex flex-col items-center">
                      <CreditCard className="w-5 h-5 text-neutral-600 mb-1" />
                      <T className="text-[10.5px] font-bold text-neutral-900">
                        CNIC Back
                      </T>
                      <T className="text-[8.5px] text-neutral-400">Clear barcode</T>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ── Section 3: Farm Location ────────────────────────────────────── */}
          <Box className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <Box className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <T className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-neutral-800" />
                <T>3. Farm Location</T>
              </T>
              <T className="text-[10px] font-bold text-neutral-400">Jurisdiction</T>
            </Box>

            <Box className="grid grid-cols-2 gap-2">
              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  Province *
                </T>
                <Sel
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-xs font-bold focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                >
                  {PROVINCES.map((prov) => (
                    <Opt key={prov} value={prov}>
                      {prov}
                    </Opt>
                  ))}
                </Sel>
              </Box>

              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  District *
                </T>
                <Inp
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Faisalabad"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-xs font-semibold focus:outline-hidden focus:border-neutral-900"
                />
              </Box>
            </Box>

            <Box className="grid grid-cols-2 gap-2">
              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  Tehsil
                </T>
                <Inp
                  type="text"
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                  placeholder="e.g. Jaranwala"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-xs font-semibold focus:outline-hidden focus:border-neutral-900"
                />
              </Box>

              <Box>
                <T className="block text-xs font-bold text-neutral-800 mb-1">
                  Land Size (Acres)
                </T>
                <Inp
                  type="text"
                  value={landSizeAcres}
                  onChange={(e) => setLandSizeAcres(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full h-10 px-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 text-xs font-semibold focus:outline-hidden focus:border-neutral-900"
                />
              </Box>
            </Box>
          </Box>

          {/* ── Section 4: Genuine Farmer Anti-Scam Declaration ───────────── */}
          <Box className="p-4 rounded-2xl bg-white border border-neutral-200 space-y-3">
            <Box className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <T className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-neutral-800" />
                <T>4. Genuine Farmer Anti-Scam Pledge</T>
              </T>
              <T className="text-[10px] font-bold text-neutral-400">Declaration</T>
            </Box>

            <Box className="space-y-1.5 text-[11px] text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <T className="font-bold text-neutral-900">
                I solemnly confirm and declare:
              </T>
              <Box className="list-disc list-inside space-y-1 text-[10.5px] text-neutral-600">
                <Box>I am a real farmer cultivating genuine agricultural crops.</Box>
                <Box>I am not an automated bot, fake broker, or impersonator.</Box>
                <Box>All photos, CNIC credentials, and listings are authentic.</Box>
                <Box>I accept full accountability for my marketplace listings.</Box>
              </Box>
            </Box>

            <Box className="flex items-start gap-2.5 pt-1">
              <Inp
                id="anti-bot-decl"
                type="checkbox"
                required
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-neutral-900 cursor-pointer shrink-0"
              />
              <T htmlFor="anti-bot-decl" className="text-[11px] font-semibold text-neutral-900 leading-snug cursor-pointer select-none">
                I agree to the Genuine Farmer Anti-Scam Declaration.
              </T>
            </Box>
          </Box>

          {/* Submit Button */}
          <Btn
            type="submit"
            disabled={loading || !declarationAccepted || !profilePhoto || !cnicFront || !cnicBack}
            className="w-full h-12 rounded-xl bg-neutral-900 hover:bg-black disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-white" />
                <T>Verify Identity & Proceed</T>
              </>
            )}
          </Btn>
        </Box>
      )}
    </Box>
  );
};
