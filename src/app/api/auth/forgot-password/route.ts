import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { forgotPasswordSchema, formatZodError } from '@/lib/validations/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const errors = formatZodError(parsed.error);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Send password reset link via Supabase
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json(
        { success: true, message: 'If an account with this email exists, a reset link has been sent.' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a reset link has been sent.',
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}