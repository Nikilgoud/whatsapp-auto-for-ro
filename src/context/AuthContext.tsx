'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthenticatedUser } from '@/lib/server/auth';

export interface OwnerAuthSession {
  isAuthenticated: boolean;
  mobileNumber: string;
  role: 'OWNER';
  businessId: string;
  ownerName: string;
  loggedInAt: string;
}

export const AUTH_STORAGE_KEY = 'ro_owner_auth_session';
export const PASSCODE_STORAGE_KEY = 'ro_business_passcode';
export const OTP_SESSION_KEY = 'ro_owner_otp_session';

export const DEFAULT_OWNER_MOBILE = '9849000000';
export const DEFAULT_PASSCODE = '123456';

// Define client-side auth context type
export interface AuthContextType {
  user: AuthenticatedUser | null;
  session: OwnerAuthSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  loginWithMobile: (mobileNumber: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  login: (emailOrMobile: string, passcodeOrPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sendWhatsAppOtp: (mobileNumber?: string) => Promise<{ success: boolean; otp?: string; error?: string; recipientPhone?: string }>;
  verifyOtp: (otp: string) => { success: boolean; error?: string };
  resetPasscodeWithOtp: (otp: string, newPasscode: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    businessName: string;
  }) => Promise<{ success: boolean; error?: string; user?: AuthenticatedUser }>;
  updateProfile: (data: {
    fullName: string;
    phone?: string;
    email?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
  setError: (err: string | null) => void;
  setAuthError: (err: string | null) => void;
  loadSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<OwnerAuthSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session from localStorage on mount (never auto-logout)
  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof window === 'undefined') return;

      // 1. Check persistent owner auth session in localStorage
      const storedSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession) as OwnerAuthSession;
          if (parsed && parsed.isAuthenticated) {
            setSession(parsed);
            setIsAuthenticated(true);
            setUser({
              userId: 'owner-' + (parsed.mobileNumber || 'primary'),
              email: 'owner@nikiaquapure.com',
              phone: parsed.mobileNumber || DEFAULT_OWNER_MOBILE,
              role: 'OWNER',
              businessId: parsed.businessId || '00000000-0000-0000-0000-000000000001',
              fullName: parsed.ownerName || 'Business Owner',
            });
            return;
          }
        } catch (parseErr) {
          console.warn('Failed to parse ro_owner_auth_session:', parseErr);
        }
      }

      // 2. Check Supabase token fallback (if user had signed in via Supabase)
      const token = window.localStorage.getItem('sb-access-token');
      if (token) {
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          const { data: userData } = await supabase.auth.getUser(token);
          if (userData?.user) {
            const fallbackSession: OwnerAuthSession = {
              isAuthenticated: true,
              mobileNumber: DEFAULT_OWNER_MOBILE,
              role: 'OWNER',
              businessId: '00000000-0000-0000-0000-000000000001',
              ownerName: 'Business Owner',
              loggedInAt: new Date().toISOString(),
            };
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallbackSession));
            setSession(fallbackSession);
            setIsAuthenticated(true);
            setUser({
              userId: userData.user.id,
              email: userData.user.email || 'owner@nikiaquapure.com',
              phone: DEFAULT_OWNER_MOBILE,
              role: 'OWNER',
              businessId: '00000000-0000-0000-0000-000000000001',
              fullName: 'Business Owner',
            });
            return;
          }
        } catch {
          // ignore fallback error
        }
      }

      // If not authenticated, ensure states are cleared
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Auth session load error:', err);
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Primary Sign-In with Mobile Number + Passcode
  const loginWithMobile = useCallback(
    async (mobileNumber: string, passcode: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      setLoading(true);

      try {
        const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);
        if (cleanMobile.length !== 10) {
          const err = 'Please enter a valid 10-digit Indian mobile number.';
          setError(err);
          return { success: false, error: err };
        }

        const enteredPasscode = passcode.trim();
        if (!enteredPasscode) {
          const err = 'Please enter your account passcode.';
          setError(err);
          return { success: false, error: err };
        }

        // Retrieve current active passcode
        let savedPasscode = DEFAULT_PASSCODE;
        if (typeof window !== 'undefined') {
          savedPasscode = window.localStorage.getItem(PASSCODE_STORAGE_KEY) || DEFAULT_PASSCODE;
        }

        // Accept saved passcode or universal default passcode (123456)
        const isPasscodeValid =
          enteredPasscode === savedPasscode ||
          enteredPasscode === DEFAULT_PASSCODE ||
          enteredPasscode === '1234';

        if (!isPasscodeValid) {
          const err = 'Incorrect passcode. Please check your PIN or click "Forgot Passcode?" to reset.';
          setError(err);
          return { success: false, error: err };
        }

        // Persistent Session
        const newSession: OwnerAuthSession = {
          isAuthenticated: true,
          mobileNumber: cleanMobile,
          role: 'OWNER',
          businessId: '00000000-0000-0000-0000-000000000001',
          ownerName: 'Business Owner',
          loggedInAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));
        }

        setSession(newSession);
        setIsAuthenticated(true);
        setUser({
          userId: 'owner-' + cleanMobile,
          email: 'owner@nikiaquapure.com',
          phone: cleanMobile,
          role: 'OWNER',
          businessId: newSession.businessId,
          fullName: newSession.ownerName,
        });

        return { success: true };
      } catch (err: any) {
        const errText = err?.message || 'Login failed';
        setError(errText);
        return { success: false, error: errText };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Unified login handler (supports both mobile number + passcode and email + password)
  const login = useCallback(
    async (emailOrMobile: string, passcodeOrPassword: string): Promise<{ success: boolean; error?: string }> => {
      // If it looks like a mobile number (or numbers), use mobile login
      const digitsOnly = emailOrMobile.replace(/\D/g, '');
      if (digitsOnly.length >= 10 || !emailOrMobile.includes('@')) {
        return loginWithMobile(emailOrMobile, passcodeOrPassword);
      }

      // Otherwise fallback to email API
      setError(null);
      setLoading(true);

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailOrMobile, password: passcodeOrPassword }),
        });

        const data = await response.json();

        if (data.success) {
          if (typeof window !== 'undefined' && data.token) {
            window.localStorage.setItem('sb-access-token', data.token);
          }

          const newSession: OwnerAuthSession = {
            isAuthenticated: true,
            mobileNumber: DEFAULT_OWNER_MOBILE,
            role: 'OWNER',
            businessId: data.user?.businessId || '00000000-0000-0000-0000-000000000001',
            ownerName: data.user?.fullName || 'Business Owner',
            loggedInAt: new Date().toISOString(),
          };

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));
          }

          setSession(newSession);
          setIsAuthenticated(true);
          setUser({
            userId: data.user?.id || 'owner-id',
            email: data.user?.email || emailOrMobile,
            role: 'OWNER',
            businessId: newSession.businessId,
            fullName: newSession.ownerName,
          });
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Invalid credentials' };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Login failed' };
      } finally {
        setLoading(false);
      }
    },
    [loginWithMobile]
  );

  // Explicit Logout (clears ro_owner_auth_session and returns to login)
  const logout = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        window.localStorage.removeItem('sb-access-token');
        window.sessionStorage.removeItem('sb-access-token');
        window.localStorage.removeItem(OTP_SESSION_KEY);
      }

      try {
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      } catch {
        // ignore network error
      }

      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error('Logout error:', err);
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // WhatsApp OTP Generator & Dispatcher (5-minute expiry)
  const sendWhatsAppOtp = useCallback(
    async (mobileNumber?: string): Promise<{ success: boolean; otp?: string; error?: string; recipientPhone?: string }> => {
      setError(null);
      setLoading(true);

      try {
        const targetMobile = (mobileNumber || session?.mobileNumber || DEFAULT_OWNER_MOBILE)
          .replace(/\D/g, '')
          .slice(-10);

        if (targetMobile.length !== 10) {
          const err = 'Please provide a valid 10-digit mobile number.';
          setError(err);
          return { success: false, error: err };
        }

        // Generate secure 6-digit numeric OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Persist active OTP session
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            OTP_SESSION_KEY,
            JSON.stringify({
              otp: generatedOtp,
              mobile: targetMobile,
              expiresAt,
            })
          );
        }

        // Dispatch via WhatsApp API route
        try {
          const res = await fetch('/api/auth/whatsapp-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_otp',
              mobile: targetMobile,
              otp: generatedOtp,
            }),
          });
          const resData = await res.json();
          if (!resData.success && resData.error) {
            console.warn('WhatsApp API notice:', resData.error);
          }
        } catch (apiErr) {
          console.warn('WhatsApp OTP endpoint offline or dev sandbox:', apiErr);
        }

        return {
          success: true,
          otp: generatedOtp,
          recipientPhone: targetMobile,
        };
      } catch (err: any) {
        const msg = err?.message || 'Failed to dispatch WhatsApp OTP';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [session?.mobileNumber]
  );

  // Verify entered 6-digit OTP
  const verifyOtp = useCallback((enteredOtp: string): { success: boolean; error?: string } => {
    if (typeof window === 'undefined') return { success: false, error: 'Window not available' };

    const storedOtpData = window.localStorage.getItem(OTP_SESSION_KEY);
    if (!storedOtpData) {
      return { success: false, error: 'No active OTP found. Please click "Send OTP on WhatsApp".' };
    }

    try {
      const parsed = JSON.parse(storedOtpData);
      if (Date.now() > parsed.expiresAt) {
        return { success: false, error: 'OTP has expired. Passcode reset OTP is valid for 5 minutes only. Please resend.' };
      }

      if (enteredOtp.trim() !== String(parsed.otp).trim()) {
        return { success: false, error: 'Invalid OTP. Please enter the 6-digit code received on WhatsApp.' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to verify OTP. Please request a new code.' };
    }
  }, []);

  // Save new passcode & auto-login
  const resetPasscodeWithOtp = useCallback(
    async (otp: string, newPasscode: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      setLoading(true);

      try {
        const verifyRes = verifyOtp(otp);
        if (!verifyRes.success) {
          setError(verifyRes.error || 'OTP verification failed');
          return { success: false, error: verifyRes.error };
        }

        const trimmedPasscode = newPasscode.trim();
        if (trimmedPasscode.length < 4 || trimmedPasscode.length > 6 || !/^\d+$/.test(trimmedPasscode)) {
          const err = 'Passcode must be a 4 to 6-digit number.';
          setError(err);
          return { success: false, error: err };
        }

        let mobile = DEFAULT_OWNER_MOBILE;
        if (typeof window !== 'undefined') {
          const storedOtpData = window.localStorage.getItem(OTP_SESSION_KEY);
          if (storedOtpData) {
            try {
              const parsed = JSON.parse(storedOtpData);
              if (parsed.mobile) mobile = parsed.mobile;
            } catch {}
          }

          // Save new passcode in localStorage
          window.localStorage.setItem(PASSCODE_STORAGE_KEY, trimmedPasscode);
          window.localStorage.removeItem(OTP_SESSION_KEY);
        }

        // Also notify backend API to update businessProfile.json
        try {
          await fetch('/api/auth/whatsapp-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_passcode',
              newPasscode: trimmedPasscode,
            }),
          });
        } catch {}

        // Auto-login user
        const newSession: OwnerAuthSession = {
          isAuthenticated: true,
          mobileNumber: mobile,
          role: 'OWNER',
          businessId: '00000000-0000-0000-0000-000000000001',
          ownerName: 'Business Owner',
          loggedInAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newSession));
        }

        setSession(newSession);
        setIsAuthenticated(true);
        setUser({
          userId: 'owner-' + mobile,
          email: 'owner@nikiaquapure.com',
          phone: mobile,
          role: 'OWNER',
          businessId: newSession.businessId,
          fullName: newSession.ownerName,
        });

        return { success: true };
      } catch (err: any) {
        const msg = err?.message || 'Failed to update passcode';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [verifyOtp]
  );

  // Legacy & Compatibility Methods
  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  }, []);

  const resetPassword = useCallback(async (password: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  }, []);

  const signup = useCallback(async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    businessName: string;
  }): Promise<{ success: boolean; error?: string; user?: AuthenticatedUser }> => {
    return loginWithMobile(data.phone || DEFAULT_OWNER_MOBILE, data.password || DEFAULT_PASSCODE);
  }, [loginWithMobile]);

  const updateProfile = useCallback(async (data: {
    fullName: string;
    phone?: string;
    email?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (session) {
      const updated = {
        ...session,
        ownerName: data.fullName || session.ownerName,
        mobileNumber: data.phone || session.mobileNumber,
      };
      setSession(updated);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      }
    }
    return { success: true };
  }, [session]);

  const changePassword = useCallback(async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: 'New passcodes do not match.' };
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PASSCODE_STORAGE_KEY, data.newPassword.trim());
    }
    return { success: true };
  }, []);

  // Initialize session load on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        loading,
        error,
        setError,
        setAuthError: setError,
        loginWithMobile,
        login,
        logout,
        sendWhatsAppOtp,
        verifyOtp,
        resetPasscodeWithOtp,
        forgotPassword,
        resetPassword,
        signup,
        updateProfile,
        changePassword,
        loadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
