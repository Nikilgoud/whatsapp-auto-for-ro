import { z } from 'zod';

/**
 * Authentication validation schemas using Zod
 */

// Login form validation
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Forgot password validation
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset password validation
export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Signup validation (for owner registration)
export const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be 10 digits').max(10).regex(/^\d{10}$/, 'Phone must be 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  businessName: z.string().min(2, 'Business name is required').max(100),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignupInput = z.infer<typeof signupSchema>;

// Invite team member validation
export const inviteMemberSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  role: z.literal('OWNER').default('OWNER'),
  fullName: z.string().min(2, 'Full name is required').max(100),
  phone: z.string().min(10, 'Phone must be 10 digits').max(10).regex(/^\d{10}$/, 'Phone must be 10 digits').optional().or(z.literal('')),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

// Change password validation (for logged-in users)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Update profile validation
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Phone must be 10 digits').max(10).regex(/^\d{10}$/, 'Phone must be 10 digits').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Helper function to format Zod errors for display
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  const issues = error.issues || (error as any).errors || [];
  issues.forEach((err: any) => {
    const path = Array.isArray(err.path) ? err.path.join('.') : String(err.path || 'form');
    if (!formatted[path]) {
      formatted[path] = err.message;
    }
  });
  return formatted;
}

// Password strength helper
export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ];

  score = checks.filter(Boolean).length;

  if (score <= 2) return { score, label: 'Weak', color: 'text-rose-600' };
  if (score <= 3) return { score, label: 'Fair', color: 'text-amber-600' };
  if (score <= 4) return { score, label: 'Good', color: 'text-emerald-600' };
  return { score, label: 'Strong', color: 'text-blue-600' };
}