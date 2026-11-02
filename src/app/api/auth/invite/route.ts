import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { inviteMemberSchema, formatZodError } from '@/lib/validations/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inviteMemberSchema.safeParse(body);

    if (!parsed.success) {
      const errors = formatZodError(parsed.error);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { email, role, fullName } = parsed.data;
    const inviter = await getAuthenticatedUser(request);

    // Check if inviter has permission
    if (!inviter || inviter.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Only business owners can invite team members' },
        { status: 403 }
      );
    }

    // Invite the user - this sends an invitation email
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        role,
        fullName,
        invitedBy: inviter.userId,
        businessId: inviter.businessId,
      },
      redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`,
    });

    if (inviteError) {
      return NextResponse.json(
        { success: false, error: inviteError.message || 'Failed to send invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully. The team member will receive an email to set up their account.',
    });
  } catch (err: any) {
    console.error('Invite member error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}