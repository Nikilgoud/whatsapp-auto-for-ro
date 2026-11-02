import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { signupSchema, formatZodError } from '@/lib/validations/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const errors = formatZodError(parsed.error);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { fullName, email, phone, password, businessName } = parsed.data;

    // Sign up with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName,
          phone,
          businessName,
          role: 'OWNER', // New owners start as OWNER
        },
      },
    });

    if (error) {
      // Common case: user already exists
      if (error.message?.includes('already registered')) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists. Please log in.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message || 'Signup failed' },
        { status: 500 }
      );
    }

    // Create initial profile
    if (data.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: data.user.id,
          business_id: '00000000-0000-0000-0000-000000000001',
          role: 'OWNER',
          full_name: fullName,
          phone,
          avatar_url: null,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue - user is authenticated but profile may need manual setup
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: 'OWNER',
        businessId: '00000000-0000-0000-0000-000000000001',
        fullName,
      },
      requiresOnboarding: true, // New signups need to set up business profile first
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Signup failed' },
      { status: 500 }
    );
  }
}