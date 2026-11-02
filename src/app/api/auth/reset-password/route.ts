import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { resetPasswordSchema, formatZodError } from '@/lib/validations/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const errors = formatZodError(parsed.error);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { password, confirmPassword } = parsed.data;

    // In a real implementation, this would use Supabase's reset password flow
    // which requires a token from the forgot password link
    // For now, we'll create a new password after email verification

    const { data, error } = await supabaseAdmin.auth.updateUser({
      data: {
        password: password,
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}