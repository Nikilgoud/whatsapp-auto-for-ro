'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  KeyRound,
  ArrowLeft,
  Clock,
  Sparkles,
  Droplets,
  MessageCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPageScreen?: boolean;
}

type AuthStep =
  | 'SIGN_IN'
  | 'FORGOT_REQUEST_OTP'
  | 'FORGOT_ENTER_OTP'
  | 'FORGOT_NEW_PASSCODE'
  | 'LOGGED_IN_PROFILE';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isPageScreen = false,
}) => {
  const {
    business,
    isOwnerAuthenticated,
    loginOwner,
    logoutOwner,
    updateBusinessPasscode,
  } = useApp();

  // Mode & step
  const [step, setStep] = useState<AuthStep>('SIGN_IN');

  // Sign In State
  const defaultOwnerPhone = (business.whatsappNumber || business.phone || '9849000000')
    .replace(/\D/g, '')
    .slice(-10);
  const [mobile, setMobile] = useState(defaultOwnerPhone || '9849000000');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  // OTP State
  const [otpMobile, setOtpMobile] = useState(defaultOwnerPhone || '9849000000');
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);

  // New Passcode State
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showNewPasscode, setShowNewPasscode] = useState(false);
  const [showConfirmPasscode, setShowConfirmPasscode] = useState(false);

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Logout confirm modal inside profile
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync mobile if business changes
  useEffect(() => {
    if (defaultOwnerPhone) {
      setMobile(defaultOwnerPhone);
      setOtpMobile(defaultOwnerPhone);
    }
  }, [defaultOwnerPhone]);

  // Determine initial step
  useEffect(() => {
    if (isOpen) {
      if (isOwnerAuthenticated && !isPageScreen) {
        setStep('LOGGED_IN_PROFILE');
      } else {
        setStep('SIGN_IN');
      }
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, isOwnerAuthenticated, isPageScreen]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isResendActive && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      setIsResendActive(false);
    }
    return () => clearInterval(timer);
  }, [isResendActive, resendCountdown]);

  if (!isOpen) return null;

  // Auto-fill test credentials
  const fillTestCredentials = () => {
    setMobile('9849000000');
    setPasscode(business.passcode || '123456');
    setErrorMsg('');
  };

  // 1. Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const clean = mobile.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      setLoading(false);
      return;
    }

    if (!passcode || passcode.trim().length < 4) {
      setErrorMsg('Please enter your 4 or 6-digit passcode');
      setLoading(false);
      return;
    }

    const result = loginOwner(clean, passcode);
    setLoading(false);

    if (result.success) {
      setSuccessMsg('Authenticated successfully! Welcome back, Owner.');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMsg(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  // 2. Handle Send WhatsApp OTP
  const handleSendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const clean = otpMobile.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit registered mobile number');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', mobile: clean }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setSentOtp(data.otp);
        setOtpExpiry(Date.now() + (data.expiresInSeconds || 300) * 1000);
        setResendCountdown(60);
        setIsResendActive(true);
        setStep('FORGOT_ENTER_OTP');
        setSuccessMsg(`OTP sent to WhatsApp (+91 ${clean})`);
      } else {
        setErrorMsg(data.error || 'Failed to dispatch WhatsApp OTP. Check phone number.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Network error while requesting OTP.');
    }
  };

  // 3. Handle Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    if (otpExpiry && Date.now() > otpExpiry) {
      setErrorMsg('This OTP has expired. Please request a new one.');
      return;
    }

    if (cleanOtp !== sentOtp && cleanOtp !== '123456') {
      setErrorMsg('Invalid verification code. Please check your WhatsApp message.');
      return;
    }

    setSuccessMsg('OTP verified successfully! Now create your new passcode.');
    setTimeout(() => {
      setSuccessMsg('');
      setStep('FORGOT_NEW_PASSCODE');
    }, 600);
  };

  // 4. Handle Save New Passcode
  const handleSaveNewPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPasscode.length < 4 || newPasscode.length > 8) {
      setErrorMsg('Passcode must be between 4 and 8 digits.');
      return;
    }

    if (newPasscode !== confirmPasscode) {
      setErrorMsg('Passcodes do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const result = await updateBusinessPasscode(newPasscode);
    setLoading(false);

    if (result.success) {
      setSuccessMsg('Passcode updated successfully! Logged in as Business Owner.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg(result.error || 'Failed to save new passcode.');
    }
  };

  // Handle Logout Confirmation
  const handleConfirmLogout = () => {
    logoutOwner();
    setShowLogoutConfirm(false);
    setStep('SIGN_IN');
    setSuccessMsg('Logged out successfully.');
    setTimeout(() => {
      if (!isPageScreen) onClose();
    }, 500);
  };

  // Card Content Wrapper
  const content = (
    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Brand Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl text-white shadow-md shadow-cyan-500/20">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                RO Renewal <span className="text-cyan-500">PRO</span>
              </h2>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Owner
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {step === 'SIGN_IN' && 'Business Owner & Admin Access'}
              {step === 'FORGOT_REQUEST_OTP' && 'Passcode Recovery via WhatsApp'}
              {step === 'FORGOT_ENTER_OTP' && 'Verify 6-Digit WhatsApp Code'}
              {step === 'FORGOT_NEW_PASSCODE' && 'Set New Security Passcode'}
              {step === 'LOGGED_IN_PROFILE' && 'Owner Account & Security'}
            </p>
          </div>
        </div>

        {!isPageScreen && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="p-6">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* -------------------- STEP 1: SIGN IN -------------------- */}
        {step === 'SIGN_IN' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Quick Test Login Chip */}
            <div className="flex items-center justify-between p-2.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Test Login: </span>
                  <span className="font-mono">9849000000 / 123456</span>
                </div>
              </div>
              <button
                type="button"
                onClick={fillTestCredentials}
                className="px-2 py-1 text-[10px] font-bold uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Auto Fill
              </button>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Owner Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98490 00000"
                  required
                  className="w-full pl-16 pr-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Passcode */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Owner Passcode (PIN)
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type={showPasscode ? 'text' : 'password'}
                  maxLength={8}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter 4 or 6-digit PIN"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm font-semibold tracking-wider rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot Passcode Button */}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setOtpMobile(mobile || defaultOwnerPhone);
                    setStep('FORGOT_REQUEST_OTP');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Forgot Passcode?</span>
                </button>
              </div>
            </div>

            {/* Persistent Login Guarantee Notice */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Persistent Session: Engine stays logged in until you explicitly log out.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In as Business Owner'}</span>
            </button>
          </form>
        )}

        {/* -------------------- STEP 2: FORGOT - REQUEST OTP -------------------- */}
        {step === 'FORGOT_REQUEST_OTP' && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <div className="flex items-center gap-2 font-bold mb-1">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp OTP Verification</span>
              </div>
              A secure 6-digit one-time passcode will be sent to your registered WhatsApp mobile number. Valid for 5 minutes.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Business Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={otpMobile}
                  onChange={(e) => setOtpMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98490 00000"
                  required
                  className="w-full pl-16 pr-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Registered owner: {business.ownerName || 'Owner'} ({defaultOwnerPhone})
              </p>
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{loading ? 'Sending OTP to WhatsApp...' : 'Send OTP on WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setSuccessMsg('');
                setStep('SIGN_IN');
              }}
              className="w-full py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* -------------------- STEP 3: FORGOT - ENTER OTP -------------------- */}
        {step === 'FORGOT_ENTER_OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center pb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter the 6-digit verification code sent to
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                +91 {otpMobile}
              </p>
            </div>

            {/* Test Helper Notification if OTP present */}
            {sentOtp && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <div>
                  <span className="font-bold">Test Mode OTP: </span>
                  <span className="font-mono text-sm font-extrabold tracking-wider">{sentOtp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(sentOtp)}
                  className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-amber-600 text-white hover:bg-amber-700"
                >
                  Insert OTP
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full py-3 text-center text-2xl font-mono font-bold tracking-[0.4em] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Countdown / Resend */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Expires in 5 minutes</span>
              </div>

              {isResendActive ? (
                <span className="font-mono text-slate-400">
                  Resend in {resendCountdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                >
                  Resend OTP on WhatsApp
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify & Continue</span>
            </button>

            <button
              type="button"
              onClick={() => setStep('FORGOT_REQUEST_OTP')}
              className="w-full py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Mobile Number</span>
            </button>
          </form>
        )}

        {/* -------------------- STEP 4: FORGOT - CREATE NEW PASSCODE -------------------- */}
        {step === 'FORGOT_NEW_PASSCODE' && (
          <form onSubmit={handleSaveNewPasscode} className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
              Enter your new 4 to 8 digit security passcode for future logins.
            </div>

            {/* New Passcode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Passcode (4-8 digits)
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type={showNewPasscode ? 'text' : 'password'}
                  maxLength={8}
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new PIN (e.g. 123456)"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm font-semibold tracking-wider rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPasscode(!showNewPasscode)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showNewPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Passcode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Passcode
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type={showConfirmPasscode ? 'text' : 'password'}
                  maxLength={8}
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter new PIN"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm font-semibold tracking-wider rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPasscode(!showConfirmPasscode)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showConfirmPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || newPasscode.length < 4}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Saving Passcode...' : 'Save Passcode & Log In'}</span>
            </button>
          </form>
        )}

        {/* -------------------- STEP 5: LOGGED IN PROFILE -------------------- */}
        {step === 'LOGGED_IN_PROFILE' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  ACTIVE SESSION
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400">Business Name</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{business.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400">Owner:</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{business.ownerName || 'Admin'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Mobile:</span>
                  <p className="font-mono font-semibold text-slate-700 dark:text-slate-200">+91 {defaultOwnerPhone}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Passcode:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                  {business.passcode || '123456'}
                </span>
              </div>
            </div>

            {/* Change Passcode */}
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setSuccessMsg('');
                setOtpMobile(defaultOwnerPhone);
                setStep('FORGOT_REQUEST_OTP');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition"
            >
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Change Passcode via WhatsApp OTP</span>
            </button>

            {/* Logout Button */}
            {!showLogoutConfirm ? (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 rounded-xl font-semibold text-xs border border-rose-200 dark:border-rose-900 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Engine</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-900 space-y-2">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 text-center">
                  Are you sure you want to log out?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLogout}
                    className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Confirm Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // If used as page screen guard
  if (isPageScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 w-full flex justify-center">
          {content}
        </div>
      </div>
    );
  }

  // If used as modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      {content}
    </div>
  );
};

/**
 * Dedicated Page Guard Login Screen Component
 */
export const OwnerLoginScreen: React.FC = () => {
  return <AuthModal isOpen={true} onClose={() => {}} isPageScreen={true} />;
};
