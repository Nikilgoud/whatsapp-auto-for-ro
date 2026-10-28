import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabaseAdmin';

export type UserRole = 'OWNER' | 'MANAGER' | 'TECHNICIAN';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  businessId: string;
  fullName?: string;
  phone?: string;
}

/**
 * Validates request authentication header or cookie session and retrieves
 * the user's verified business_id and role from the database.
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  // 1. Check Bearer token from Authorization header
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. If no bearer token, check Supabase auth cookies
  if (!token) {
    const cookieToken =
      req.cookies.get('sb-access-token')?.value ||
      req.cookies.get('sb:token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  // If in sandbox mode or test mode and no token, allow a fallback for local development preview
  if (!token) {
    if (process.env.NEXT_PUBLIC_LOCAL_SANDBOX === 'true' || process.env.NODE_ENV === 'development') {
      return {
        userId: 'dev-owner-id',
        email: 'owner@nikiaquapure.local',
        role: 'OWNER',
        businessId: '00000000-0000-0000-0000-000000000001',
        fullName: 'Niki Aquapure Admin',
      };
    }
    return null;
  }

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return null;
    }

    // Retrieve user profile and business membership from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, business_id, role, full_name, phone')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      // If profile does not exist yet (e.g. initial registration), return fallback tenant
      return {
        userId: user.id,
        email: user.email || '',
        role: 'OWNER',
        businessId: '00000000-0000-0000-0000-000000000001',
      };
    }

    return {
      userId: user.id,
      email: user.email || '',
      role: (profile.role as UserRole) || 'TECHNICIAN',
      businessId: profile.business_id,
      fullName: profile.full_name,
      phone: profile.phone,
    };
  } catch (err) {
    console.error('Error authenticating user:', err);
    return null;
  }
}

/**
 * Enforces allowed roles. Throws or returns boolean.
 */
export function assertAuthorizedRole(
  user: AuthenticatedUser | null,
  allowedRoles: UserRole[]
): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
