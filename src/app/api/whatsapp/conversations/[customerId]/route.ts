import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  getMockWhatsAppThread,
  markMockThreadAsRead,
} from '@/lib/server/mockWhatsAppStore';
import { formatWhatsAppPhoneNumber } from '@/lib/server/whatsappCloudApi';
import { LiveWhatsAppMessage } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = await context.params;
    const businessId = user.businessId;
    const formattedPhone = formatWhatsAppPhoneNumber(customerId);

    // 1. Try querying Supabase
    try {
      const { data: messages, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('*')
        .eq('business_id', businessId)
        .or(`customer_id.eq.${customerId},phone_number.eq.${customerId},phone_number.eq.${formattedPhone}`)
        .order('created_at', { ascending: true });

      if (!error && messages && messages.length > 0) {
        // Fetch customer info
        const { data: customer } = await supabaseAdmin
          .from('customers')
          .select('id, full_name, mobile_number, whatsapp_number, area_locality, city')
          .or(`id.eq.${customerId},mobile_number.eq.${customerId},whatsapp_number.eq.${customerId},whatsapp_number.eq.${formattedPhone}`)
          .maybeSingle();

        let purifier = null;
        if (customer?.id) {
          const { data: p } = await supabaseAdmin
            .from('purifiers')
            .select('id, brand, model, next_service_due_date, output_tds_baseline')
            .eq('customer_id', customer.id)
            .maybeSingle();
          purifier = p;
        }

        const formattedMessages: LiveWhatsAppMessage[] = messages.map((m) => ({
          id: m.id,
          businessId: m.business_id,
          customerId: m.customer_id,
          phoneNumber: m.phone_number,
          direction: m.direction,
          messageType: m.message_type || 'TEXT',
          templateName: m.template_name,
          content: m.content,
          mediaUrl: m.media_url,
          mediaType: m.media_type,
          providerMessageId: m.provider_message_id,
          status: m.status,
          errorMessage: m.error_message,
          sentAt: m.sent_at,
          deliveredAt: m.delivered_at,
          readAt: m.read_at,
          createdAt: m.created_at,
        }));

        return NextResponse.json({
          success: true,
          customer: customer
            ? {
                id: customer.id,
                fullName: customer.full_name,
                mobileNumber: customer.mobile_number,
                whatsappNumber: customer.whatsapp_number,
                areaLocality: customer.area_locality,
                city: customer.city,
              }
            : null,
          purifier: purifier
            ? {
                brand: purifier.brand,
                model: purifier.model,
                nextServiceDueDate: purifier.next_service_due_date,
                outputTdsBaseline: purifier.output_tds_baseline,
              }
            : null,
          messages: formattedMessages,
          source: 'database',
        });
      }
    } catch (dbErr) {
      console.warn('Supabase thread fetch error, falling back to mock store:', dbErr);
    }

    // 2. Fallback to mock store
    const thread = getMockWhatsAppThread(customerId);
    return NextResponse.json({
      success: true,
      customer: thread.customer,
      purifier: thread.purifier,
      messages: thread.messages,
      source: 'sandbox',
    });
  } catch (error: any) {
    console.error('Error fetching customer WhatsApp thread:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = await context.params;
    const businessId = user.businessId;
    const formattedPhone = formatWhatsAppPhoneNumber(customerId);

    // Update in Supabase
    try {
      await supabaseAdmin
        .from('whatsapp_messages')
        .update({
          status: 'READ',
          read_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)
        .eq('direction', 'INBOUND')
        .or(`customer_id.eq.${customerId},phone_number.eq.${customerId},phone_number.eq.${formattedPhone}`);
    } catch (e) {
      // Ignore if offline
    }

    // Update in mock store
    const count = markMockThreadAsRead(customerId);

    return NextResponse.json({
      success: true,
      markedCount: count,
    });
  } catch (error: any) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
