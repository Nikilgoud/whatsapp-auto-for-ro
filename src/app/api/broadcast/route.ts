import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, assertAuthorizedRole } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { BroadcastCampaignSchema } from '@/lib/server/validation';
import { enqueueMessageJob } from '@/lib/server/messageQueue';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !assertAuthorizedRole(user, ['OWNER', 'MANAGER'])) {
      return NextResponse.json(
        { error: 'Unauthorized. Only Owners and Managers can initiate broadcasts.' },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parsed = BroadcastCampaignSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { campaignName, targetFilter, messageTemplate, mediaUrl, mediaType, scheduledAt } = parsed.data;
    const businessId = user.businessId;

    // 1. Build query for target recipients
    let query = supabaseAdmin
      .from('customers')
      .select('id, name, phone, area, language_preference, opt_out_whatsapp')
      .eq('business_id', businessId)
      .eq('opt_out_whatsapp', false);

    if (targetFilter.areas && targetFilter.areas.length > 0) {
      query = query.in('area', targetFilter.areas);
    }
    if (targetFilter.languagePreference && targetFilter.languagePreference !== 'ALL') {
      query = query.eq('language_preference', targetFilter.languagePreference);
    }

    const { data: recipients, error: recError } = await query;
    if (recError) {
      return NextResponse.json({ error: recError.message }, { status: 500 });
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No matching recipients found with the selected filters.' },
        { status: 400 }
      );
    }

    // 2. Create Broadcast Campaign record
    const { data: campaign, error: campError } = await supabaseAdmin
      .from('broadcast_campaigns')
      .insert({
        business_id: businessId,
        created_by: user.userId,
        name: campaignName,
        target_filter: targetFilter,
        message_template: messageTemplate,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        total_recipients: recipients.length,
        status: 'PROCESSING',
      })
      .select('id')
      .single();

    if (campError || !campaign) {
      return NextResponse.json({ error: campError?.message || 'Failed to create campaign' }, { status: 500 });
    }

    // 3. Enqueue message jobs for all recipients
    const dispatchTime = scheduledAt ? new Date(scheduledAt) : new Date();
    let queuedCount = 0;

    for (const recipient of recipients) {
      const personalizedText = messageTemplate
        .replace(/\{name\}/gi, recipient.name)
        .replace(/\{area\}/gi, recipient.area || '');

      await enqueueMessageJob({
        businessId,
        recipientPhone: recipient.phone,
        jobType: 'BROADCAST',
        scheduledAt: dispatchTime,
        payload: {
          businessId,
          recipientPhone: recipient.phone,
          customerId: recipient.id,
          bodyText: personalizedText,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType ? (mediaType.toLowerCase() as any) : null,
        },
      });

      queuedCount++;
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      totalQueued: queuedCount,
      scheduledAt: dispatchTime.toISOString(),
    });
  } catch (err: any) {
    console.error('Error creating broadcast campaign:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
