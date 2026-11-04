'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, DEFAULT_OWNER_MOBILE, DEFAULT_PASSCODE } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import {
  Droplets,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  KeyRound,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface OwnerAuthScreenProps {
  onSuccess?: () => void;
  isModal?: boolean;
  onClose?: () => void;
  initialMode?: 'LOGIN' | 'FORGOT_MOBILE';
}

export const OwnerAuthScreen: React.FC<OwnerAuthScreenProps> = ({
  onSuccess,
  isModal = false,
  onClose,
  initialMode = 'LOGIN',
}) => {
  const { business } = useApp();
  const { loginWithMobile, sendWhatsAppOtp, verifyOtp, resetPasscodeWithOtp } = useAuth();

  // Mode: LOGIN | FORGOT_MOBILE | FORGOT_OTP | FORGOT_NEW_PASSCODE
  const [authStep, setAuthStep] = useState<'LOGIN' | 'FORGOT_MOBILE' | 'FORGOT_OTP' | 'FORGOT_NEW_PASSCODE'>(
    initialMode === 'FORGOT_MOBILE' ? 'FORGOT_MOBILE' : 'LOGIN'
  );

  // Form Fields
  const [mobileNumber, setMobileNumber] = useState<string>(DEFAULT_OWNER_MOBILE);
  const [passcode, setPasscode] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);

  // Forgot Flow Fields
  const [otpCode, setOtpCode] = useState<string>('');
  const [generatedOtpHint, setGeneratedOtpHint] = useState<string | null>(null);
  const [newPasscode, setNewPasscode] = useState<string>('');
  const [confirmPasscode, setConfirmPasscode] = useState<string>('');
  const [showNewPasscode, setShowNewPasscode] = useState<boolean>(false);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Countdown timer for OTP resend (starts at 30s)
  const [resendCountdown, setResendCountdown] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Sync default mobile with business profile if available
  useEffect(() => {
    if (business?.phone || business?.whatsappNumber) {
      const regPhone = (business.whatsappNumber || business.phone).replace(/\D/g, '').slice(-10);
      if (regPhone.length === 10) {
        setMobileNumber(regPhone);
      }
    }
  }, [business?.phone, business?.whatsappNumber]);

  // Handle countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authStep === 'FORGOT_OTP' && resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    } else if (authStep === 'FORGOT_OTP' && resendCountdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [authStep, resendCountdown]);

  // 1. Submit Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessToast(null);

    const clean = mobileNumber.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!passcode.trim()) {
      setErrorMsg('Please enter your 4 or 6-digit passcode.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithMobile(clean, passcode);
      if (res.success) {
        setSuccessToast('Sign in successful! Welcome to RO Care Engine.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login request error.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP on WhatsApp
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessToast(null);

    const clean = mobileNumber.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number to receive OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendWhatsAppOtp(clean);
      if (res.success) {
        setGeneratedOtpHint(res.otp || null);
        setSuccessToast(`OTP dispatched on WhatsApp to +91 ${clean}!`);
        setAuthStep('FORGOT_OTP');
        setResendCountdown(30);
        setCanResend(false);
        setOtpCode(res.otp || ''); // pre-fill for developer convenience
      } else {
        setErrorMsg(res.error || 'Failed to dispatch OTP. Please check your mobile number.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send WhatsApp message.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanOtp = otpCode.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP received on WhatsApp.');
      return;
    }

    const verifyRes = verifyOtp(cleanOtp);
    if (verifyRes.success) {
      setErrorMsg(null);
      setSuccessToast('OTP verified successfully! Create your new passcode.');
      setAuthStep('FORGOT_NEW_PASSCODE');
    } else {
      setErrorMsg(verifyRes.error || 'Invalid OTP code.');
    }
  };

  // 4. Save New Passcode & Auto Log In
  const handleSaveNewPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessToast(null);

    const p1 = newPasscode.trim();
    const p2 = confirmPasscode.trim();

    if (p1.length < 4 || p1.length > 6 || !/^\d+$/.test(p1)) {
      setErrorMsg('Passcode must be a 4 to 6-digit number (e.g. 123456).');
      return;
    }

    if (p1 !== p2) {
      setErrorMsg('Passcodes do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasscodeWithOtp(otpCode, p1);
      if (res.success) {
        setSuccessToast('Passcode reset successful! Auto-logging you in...');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }, 1000);
      } else {
        setErrorMsg(res.error || 'Failed to reset passcode.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error saving new passcode.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to fill default test credentials
  const fillTestCredentials = () => {
    setMobileNumber(DEFAULT_OWNER_MOBILE);
    setPasscode(DEFAULT_PASSCODE);
    setErrorMsg(null);
  };

  return (
    <div className={`w-full ${isModal ? '' : 'min-h-screen flex items-center justify-center p-4 bg-slate-950/90'}`}>
      <div className={`relative w-full ${isModal ? '' : 'max-w-md'} bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden`}>
        {/* Branded Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-blue-50/60 to-transparent dark:from-slate-800/40 text-center">
          <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl text-white shadow-lg shadow-blue-500/25 mb-3">
            <Droplets className="w-7 h-7" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              RO Renewal <span className="text-cyan-500 text-xs px-1.5 py-0.5 bg-cyan-950/20 dark:bg-cyan-900/60 rounded-md font-black">PRO</span>
            </h1>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {business?.name || 'sr water purifiers'} • Owner Administration
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-full text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Persistent Session Enabled (No Auto-Logout)</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Success Toast */}
          {successToast && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">{successToast}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: MOBILE + PASSCODE LOGIN */}
          {authStep === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Business Owner Mobile Number
                </label>
                <div className="relative flex rounded-xl shadow-xs">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9849000000"
                    className="w-full pl-3 pr-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono tracking-wider"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Owner Passcode (PIN)
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 4-6 digit passcode"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Prominent Forgot Passcode Link Button */}
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessToast(null);
                      setAuthStep('FORGOT_MOBILE');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline flex items-center justify-end gap-1 ml-auto transition"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Forgot Passcode? Reset via WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Primary Sign-In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Business Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Test Login Fill */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={fillTestCredentials}
                  className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-medium border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Test Credentials: <strong>9849000000</strong> / Passcode: <strong>123456</strong> (Click to Auto-fill)</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: FORGOT PASSCODE - CONFIRM MOBILE */}
          {authStep === 'FORGOT_MOBILE' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950 dark:text-blue-100">
                    Reset Passcode via WhatsApp
                  </h4>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed mt-0.5">
                    We will dispatch a secure 6-digit numeric OTP to your registered WhatsApp mobile number.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Registered WhatsApp Mobile
                </label>
                <div className="relative flex rounded-xl shadow-xs">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9849000000"
                    className="w-full pl-3 pr-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Valid for 5 minutes. Standard Meta Cloud API template will be dispatched.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{loading ? 'Dispatching OTP on WhatsApp...' : 'Send OTP on WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthStep('LOGIN');
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition text-center"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FORGOT PASSCODE - ENTER 6-DIGIT OTP */}
          {authStep === 'FORGOT_OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                    OTP Dispatched to WhatsApp
                  </h4>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed mt-0.5">
                    Sent to <strong>+91 {mobileNumber}</strong>. Valid for 5 minutes.
                  </p>
                </div>
              </div>

              {/* Developer / Local Sandbox Direct Helper */}
              {generatedOtpHint && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                  <span>Sandbox Test OTP: <strong className="font-mono text-sm tracking-widest">{generatedOtpHint}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(generatedOtpHint)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 dark:bg-amber-800 rounded-md hover:bg-amber-300"
                  >
                    Paste
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  Enter 6-Digit WhatsApp OTP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full text-center py-3 text-2xl font-mono tracking-widest font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-blue-500 focus:ring-0 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Passcode Reset OTP</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Resend OTP on WhatsApp
                  </button>
                ) : (
                  <span>Resend in <strong>{resendCountdown}s</strong></span>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={otpCode.length !== 6 || loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthStep('FORGOT_MOBILE')}
                  className="w-full py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition text-center"
                >
                  ← Change Mobile Number
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: FORGOT PASSCODE - SET NEW PASSCODE */}
          {authStep === 'FORGOT_NEW_PASSCODE' && (
            <form onSubmit={handleSaveNewPasscode} className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/60 flex items-start gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950 dark:text-blue-100">
                    Create New Passcode
                  </h4>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed mt-0.5">
                    Choose a new 4 to 6-digit numeric PIN to secure your business dashboard.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Passcode (PIN)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPasscode ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 4-6 digit new PIN"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasscode(!showNewPasscode)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Passcode
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPasscode ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Re-enter new PIN"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono tracking-widest"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Saving & Logging in...' : 'Save Passcode & Log In'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
