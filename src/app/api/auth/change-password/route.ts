import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { changePasswordSchema, formatZodError } from '@/lib/validations/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      const errors = formatZodError(parsed.error);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Get the current user's session
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Update the user's password
    const { error } = await supabaseAdmin.auth.updateUser({
      data: {
        password: newPassword,
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to change password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been changed successfully.',
    });
  } catch (err: any) {
    console.error('Change password error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}