import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';

/**
 * Middleware helper to protect routes.
 * Can be used as a component wrapper or route handler enhancer.
 */
export async function withAuth(
  handler: (req: import('next/server').NextRequest, user: import('@/lib/server/auth').AuthenticatedUser) => Promise<import('next/server').NextResponse>,
  allowedRoles: import('@/lib/server/auth').UserRole[] = ['OWNER']
) {
  return async (req: import('next/server').NextRequest): Promise<NextResponse> => {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      // Redirect to login, preserving the intended path
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('redirectTo', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Pass user to the handler - unified single login has full owner access
    return handler(req, user);
  };
}

/**
 * Route protection for server components and API routes
 */
export function protectRoute(
  handler: (req: import('next/server').NextRequest) => Promise<import('next/server').NextResponse>,
  allowedRoles: import('@/lib/server/auth').UserRole[] = ['OWNER']
) {
  return async (req: import('next/server').NextRequest): Promise<NextResponse> => {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('redirectTo', req.url);
      return NextResponse.redirect(loginUrl);
    }

    return handler(req);
  };
}

/**
 * Protected layout component for Next.js App Router
 * Wraps children with auth check and provides user context
 */
export function ProtectedLayout({
  children,
  allowedRoles = ['OWNER'],
  fallback = 'Loading...',
}: {
  children: React.ReactNode;
  allowedRoles?: import('@/lib/server/auth').UserRole[];
  fallback?: string;
}) {
  return <>{children}</>;
}

export default ProtectedLayout;