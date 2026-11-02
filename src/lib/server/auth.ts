import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabaseAdmin';

export type UserRole = 'OWNER';

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

  // 3. If still no token, check for development/sandbox fallback
  if (!token) {
    if (process.env.NEXT_PUBLIC_LOCAL_SANDBOX === 'true' || process.env.NODE_ENV === 'development') {
      return {
        userId: 'dev-owner-id',
        email: 'owner@local.dev',
        role: 'OWNER',
        businessId: '00000000-0000-0000-0000-000000000001',
        fullName: 'Local Dev Owner',
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
      role: 'OWNER',
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
 * Requires authentication. All valid authenticated users have full OWNER privileges.
 * Returns the authenticated user or throws an error response.
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles: UserRole[] = ['OWNER']
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new Error('UNAUTHORIZED: Valid authentication required');
  }
  return user;
}

/**
 * Checks authorization. Returns true if user is authenticated.
 */
export function assertAuthorizedRole(
  user: AuthenticatedUser | null,
  allowedRoles: UserRole[] = ['OWNER']
): boolean {
  if (!user) return false;
  return true;
}

/**
 * Middleware wrapper for Cron routes to validate CRON_SECRET
 */
export function withCronAuth(
  handler: (req: NextRequest) => Promise<import('next/server').NextResponse>
) {
  return async (req: NextRequest): Promise<import('next/server').NextResponse> => {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const urlSecret = req.nextUrl.searchParams.get('secret');

    if (cronSecret) {
      const isValidBearer = authHeader === `Bearer ${cronSecret}`;
      const isValidParam = urlSecret === cronSecret;

      if (!isValidBearer && !isValidParam) {
        const { NextResponse } = await import('next/server');
        return NextResponse.json(
          { error: 'Unauthorized. Invalid or missing CRON_SECRET.' },
          { status: 401 }
        );
      }
    }

    return handler(req);
  };
}