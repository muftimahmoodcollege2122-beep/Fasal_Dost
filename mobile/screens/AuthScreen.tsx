// ─────────────────────────────────────────────────────────────────────────────
// src/screens/AuthScreen.tsx
// FasalDost Anti-Bot & Real Email OTP Registration & Sign In
// Enforces mandatory 6-digit OTP code verification before database registration
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Box, Btn, Inp, T } from '../ui/web';
import { localStorage } from '../lib/kv';
import {
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sprout,
  ArrowLeft,
  UserPlus,
  LogIn,
  Send,
} from '../ui/icons';
import {
  signInWithGoogle,
  signInWithEmail,
  resetPassword,
} from '../utils/firebase';
import { getFarmerProfile, saveFarmerProfile } from '../utils/store';
import { apiClient } from '../shared/apiClient';

interface AuthScreenProps {
  onSuccess: () => void;
  onSkip?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onSkip,
}) => {
  // ONLY TWO MODES: 'register' | 'signin'
  const [mode, setMode] = useState<'register' | 'signin'>('register');

  // Registration Form Fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Mandatory Email OTP Verification State
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Sign In Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // UI Status
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Countdown timer for Resend
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setGoogleLoading(true);

    try {
      const user = await signInWithGoogle();
      if (user) {
        const existing = await getFarmerProfile();
        await saveFarmerProfile({
          name: user.displayName || existing?.name || 'Farmer',
          phone: user.phoneNumber || existing?.phone || '',
          province: existing?.province || 'Punjab',
          division: existing?.division || '',
          district: existing?.district || '',
          tehsil: existing?.tehsil || '',
          landSize: existing?.landSize || '',
          crops: existing?.crops || [],
          savedAt: new Date().toISOString(),
        });
        onSuccess();
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed. Please try again.');
      } else {
        setErrorMsg(err.message || 'Google sign-in failed. Please use email and password.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Step 1: Send Genuine 6-Digit OTP to User's Real Email
  const handleSendEmailOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!firstName.trim()) {
      setErrorMsg('Please enter your first name');
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg('Please enter your last name');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMsg('Please enter your mobile phone number');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const fullName = [firstName.trim(), middleName.trim(), lastName.trim()]
        .filter(Boolean)
        .join(' ');

      // Dispatch real email OTP via backend mailer
      await apiClient.auth.sendEmailOtp(regEmail.trim(), fullName);

      setIsVerifyingOtp(true);
      setResendTimer(60);
      setInfoMsg(`A 6-digit verification code has been sent to ${regEmail.trim()}. Please check your email inbox.`);
    } catch (err: any) {
      console.error('Send email OTP error:', err);
      setErrorMsg(err.message || 'Failed to send verification code to email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Strictly Verify Email OTP & Register in Database
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanCode = enteredOtp.trim().replace(/\D/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMsg('Please enter the exact 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);

    try {
      const fullName = [firstName.trim(), middleName.trim(), lastName.trim()]
        .filter(Boolean)
        .join(' ');

      // Submit registration with OTP to backend
      const registeredUser = await apiClient.auth.register({
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        otp: cleanCode,
      });

      const uid = registeredUser.uid || `farmer_user_${Date.now()}`;
      localStorage.setItem('fd_farmer_id_v1', uid);

      await saveFarmerProfile({
        name: fullName,
        phone: regPhone.trim(),
        province: 'Punjab',
        savedAt: new Date().toISOString(),
      });

      setInfoMsg('Email verified and account registered successfully!');
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      console.error('Registration OTP verification error:', err);
      setErrorMsg(err.message || 'Invalid or expired verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Existing User Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }

    if (isForgotPassword) {
      setLoading(true);
      try {
        await resetPassword(loginEmail.trim());
        setInfoMsg('A password reset link has been sent to your email.');
        setIsForgotPassword(false);
      } catch (err: any) {
        setInfoMsg('If an account exists with this email, password reset instructions were dispatched.');
        setIsForgotPassword(false);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!loginPassword) {
      setErrorMsg('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      // 1. Try Firebase Auth
      let signedIn = false;
      try {
        const user = await signInWithEmail(loginEmail.trim(), loginPassword);
        if (user) {
          signedIn = true;
        }
      } catch (fbErr: any) {
        console.warn('Firebase sign in check, checking PostgreSQL database:', fbErr);
      }

      if (signedIn) {
        onSuccess();
        return;
      }

      // 2. Direct PostgreSQL Database Login
      const dbUser = await apiClient.auth.login(loginEmail.trim(), loginPassword);
      if (dbUser && dbUser.uid) {
        localStorage.setItem('fd_farmer_id_v1', dbUser.uid);
        const existing = await getFarmerProfile();
        await saveFarmerProfile({
          name: dbUser.displayName || existing?.name || 'Farmer',
          phone: dbUser.phone || existing?.phone || '',
          province: existing?.province || 'Punjab',
          savedAt: new Date().toISOString(),
        });
        onSuccess();
      } else {
        setErrorMsg('Invalid email or password. Please verify your credentials.');
      }
    } catch (err: any) {
      console.warn('Sign in error:', err);
      setErrorMsg(err.message || 'Incorrect email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex flex-col min-h-full justify-between pb-8 pt-4 px-2 select-none">
      {/* Top Brand Header */}
      <Box>
        {isVerifyingOtp && mode === 'register' && (
          <Btn
            onClick={() => {
              setIsVerifyingOtp(false);
              setEnteredOtp('');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition mb-3 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Btn>
        )}

        <Box className="flex flex-col items-center text-center mt-1 mb-4">
          <Box className="w-14 h-14 rounded-2xl bg-slate-900 shadow-md flex items-center justify-center mb-2 text-white">
            <Sprout className="w-7 h-7" />
          </Box>
          <T className="text-2xl font-black text-slate-900 tracking-tight">
            Fasal<T className="text-slate-500">Dost</T>
          </T>
          <T className="text-xs font-semibold text-slate-400 mt-0.5">
            Agricultural Intelligence & Kisan Marketplace
          </T>
        </Box>

        {/* 2 ONLY Options: Registration vs Sign In */}
        <Box className="flex p-1 bg-slate-100 rounded-2xl mb-4 border border-slate-200">
          <Btn
            type="button"
            onClick={() => {
              setMode('register');
              setIsVerifyingOtp(false);
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <T>Registration</T>
          </Btn>

          <Btn
            type="button"
            onClick={() => {
              setMode('signin');
              setIsForgotPassword(false);
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <T>Sign In</T>
          </Btn>
        </Box>

        {/* Error / Alert Banner */}
        {errorMsg && (
          <Box className="mb-4 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <T className="leading-snug">{errorMsg}</T>
          </Box>
        )}

        {/* Info Banner */}
        {infoMsg && (
          <Box className="mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <T className="leading-snug">{infoMsg}</T>
          </Box>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            OPTION 1: REGISTRATION (Mandatory Real Email OTP Verification)
           ════════════════════════════════════════════════════════════════════ */}
        {mode === 'register' && (
          <Box>
            {!isVerifyingOtp ? (
              <Box onSubmit={handleSendEmailOtp} className="space-y-3">
                {/* Name Fields: First, Middle, Last in exact sequence */}
                <Box className="grid grid-cols-3 gap-2">
                  <Box>
                    <T className="block text-[11px] font-bold text-slate-700 mb-1 truncate">
                      First Name *
                    </T>
                    <Inp
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First"
                      className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    />
                  </Box>
                  <Box>
                    <T className="block text-[11px] font-bold text-slate-700 mb-1 truncate">
                      Middle Name
                    </T>
                    <Inp
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      placeholder="Middle"
                      className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    />
                  </Box>
                  <Box>
                    <T className="block text-[11px] font-bold text-slate-700 mb-1 truncate">
                      Last Name *
                    </T>
                    <Inp
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last"
                      className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    />
                  </Box>
                </Box>

                {/* Email Address */}
                <Box>
                  <T className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address * (Real OTP code will be sent here)
                  </T>
                  <Box className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Inp
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="farmer@example.com"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    />
                  </Box>
                </Box>

                {/* Phone Number */}
                <Box>
                  <T className="block text-[11px] font-bold text-slate-700 mb-1">
                    Phone Number *
                  </T>
                  <Box className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Inp
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    />
                  </Box>
                </Box>

                {/* Password */}
                <Box>
                  <T className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password *
                  </T>
                  <Box className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Inp
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    />
                  </Box>
                </Box>

                {/* Send OTP Button */}
                <Btn
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <T>Send Verification Code to Email</T>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Btn>
              </Box>
            ) : (
              /* Mandatory 6-Digit Email OTP Verification Step */
              <Box onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
                <Box className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <Box className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-700 shrink-0" />
                    <T className="text-xs font-bold text-slate-900 truncate">
                      {regEmail}
                    </T>
                  </Box>
                  <Btn
                    type="button"
                    onClick={() => {
                      setIsVerifyingOtp(false);
                      setEnteredOtp('');
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer shrink-0"
                  >
                    Change
                  </Btn>
                </Box>

                {/* Inbox Check Guidance Card */}
                <Box className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-neutral-900 shrink-0 mt-0.5" />
                  <Box>
                    <T className="font-bold text-xs text-neutral-900">Verification Code Dispatched</T>
                    <T className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                      We have sent a 6-digit verification code to <T>{regEmail}</T>. Please check your email inbox and enter the code below.
                    </T>
                  </Box>
                </Box>

                <Box>
                  <T className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                    Enter 6-Digit Code
                  </T>
                  <Inp
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    autoFocus
                    required
                    className="w-full h-13 px-4 text-center text-2xl font-black tracking-[0.35em] rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                  <T className="text-[11px] text-slate-400 mt-1.5 text-center">
                    Enter the 6-digit code to verify your email and complete registration.
                  </T>
                </Box>

                <Btn
                  type="submit"
                  disabled={loading || enteredOtp.trim().length !== 6}
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <T>Verify & Complete Registration</T>
                    </>
                  )}
                </Btn>

                {/* Resend Timer */}
                <Box className="text-center pt-1">
                  {resendTimer > 0 ? (
                    <T className="text-xs text-slate-400 font-medium">
                      Resend code in <T className="font-bold text-slate-700">{resendTimer}s</T>
                    </T>
                  ) : (
                    <Btn
                      type="button"
                      onClick={() => handleSendEmailOtp()}
                      disabled={loading}
                      className="text-xs font-bold text-slate-900 hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <T>Resend Verification Code</T>
                    </Btn>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            OPTION 2: SIGN IN (Existing Registered User)
           ════════════════════════════════════════════════════════════════════ */}
        {mode === 'signin' && (
          <Box onSubmit={handleSignIn} className="space-y-3.5">
            {/* Google Quick Sign-In */}
            <Btn
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition active:scale-[0.99] cursor-pointer"
            >
              {googleLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <T className="text-sm font-black text-slate-700">G</T>
              )}
              <T>Continue with Google</T>
            </Btn>

            {/* Divider */}
            <Box className="relative flex py-1 items-center">
              <Box className="grow border-t border-slate-200"></Box>
              <T className="shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                or sign in with email
              </T>
              <Box className="grow border-t border-slate-200"></Box>
            </Box>

            {/* Email Address */}
            <Box>
              <T className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </T>
              <Box className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <Inp
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </Box>
            </Box>

            {/* Password Field */}
            {!isForgotPassword && (
              <Box>
                <Box className="flex items-center justify-between mb-1">
                  <T className="block text-xs font-bold text-slate-700">
                    Password
                  </T>
                  <Btn
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    Forgot Password?
                  </Btn>
                </Box>
                <Box className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <Inp
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </Box>
              </Box>
            )}

            <Btn
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isForgotPassword ? (
                <T>Send Password Reset Email</T>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <T>Sign In to Account</T>
                </>
              )}
            </Btn>

            {isForgotPassword && (
              <Box className="text-center pt-1">
                <Btn
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-xs font-bold text-slate-600 hover:underline cursor-pointer"
                >
                  Back to Sign In
                </Btn>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Footer / Guest Option */}
      {onSkip && (
        <Box className="mt-6 flex flex-col items-center gap-2">
          <Btn
            type="button"
            onClick={onSkip}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer"
          >
            Continue as Guest
          </Btn>
        </Box>
      )}
    </Box>
  );
};
