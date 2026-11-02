import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { loginSchema, formatZodError } from '@/lib/validations/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const errors = formatZodError(parsed.error);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Sign in with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create user profile if it doesn't exist
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          business_id: data.user.user_metadata?.businessId || '00000000-0000-0000-0000-000000000001',
          role: data.user.user_metadata?.role || 'OWNER',
          full_name: data.user.user_metadata?.fullName || data.user.email?.split('@')[0] || 'Owner',
          phone: data.user.user_metadata?.phone,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role || 'OWNER',
        businessId: data.user?.user_metadata?.businessId || '00000000-0000-0000-0000-000000000001',
        fullName: data.user?.user_metadata?.fullName || data.user.email?.split('@')[0] || 'Owner',
      },
      token: data.session?.access_token || '',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Login failed' },
      { status: 500 }
    );
  }
}