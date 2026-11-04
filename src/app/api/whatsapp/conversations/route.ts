import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getMockWhatsAppConversations } from '@/lib/server/mockWhatsAppStore';
import { LiveWhatsAppConversation } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = user.businessId;

    // 1. Try querying Supabase whatsapp_messages table
    try {
      const { data: messages, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (!error && messages && messages.length > 0) {
        // Group by customer_id or phone_number
        const convMap = new Map<string, any>();
        const customerIds = new Set<string>();

        for (const msg of messages) {
          const key = msg.customer_id || msg.phone_number;
          if (msg.customer_id) {
            customerIds.add(msg.customer_id);
          }

          if (!convMap.has(key)) {
            convMap.set(key, {
              key,
              customerId: msg.customer_id || null,
              phoneNumber: msg.phone_number,
              lastMessage: msg.content,
              lastMessageDirection: msg.direction,
              lastMessageStatus: msg.status,
              lastMessageTime: msg.created_at || msg.sent_at,
              mediaUrl: msg.media_url,
              mediaType: msg.media_type,
              unreadCount: msg.direction === 'INBOUND' && msg.status !== 'READ' ? 1 : 0,
              lastInboundTime: msg.direction === 'INBOUND' ? (msg.created_at || msg.sent_at) : null,
            });
          } else {
            const existing = convMap.get(key);
            if (msg.direction === 'INBOUND') {
              if (msg.status !== 'READ') {
                existing.unreadCount = (existing.unreadCount || 0) + 1;
              }
              if (!existing.lastInboundTime) {
                existing.lastInboundTime = msg.created_at || msg.sent_at;
              }
            }
          }
        }

        // Fetch customer profiles and purifiers
        let customerProfilesMap = new Map<string, any>();
        let purifierMap = new Map<string, any>();

        if (customerIds.size > 0) {
          const { data: customers } = await supabaseAdmin
            .from('customers')
            .select('id, full_name, mobile_number, whatsapp_number, area_locality, city')
            .in('id', Array.from(customerIds));

          if (customers) {
            for (const c of customers) {
              customerProfilesMap.set(c.id, c);
            }
          }

          const { data: purifiers } = await supabaseAdmin
            .from('purifiers')
            .select('id, customer_id, brand, model, next_service_due_date, output_tds_baseline')
            .in('customer_id', Array.from(customerIds));

          if (purifiers) {
            for (const p of purifiers) {
              purifierMap.set(p.customer_id, p);
            }
          }
        }

        const conversations: LiveWhatsAppConversation[] = Array.from(convMap.values()).map(
          (entry) => {
            const customer = entry.customerId ? customerProfilesMap.get(entry.customerId) : null;
            const purifier = entry.customerId ? purifierMap.get(entry.customerId) : null;

            return {
              customerId: entry.customerId,
              customerName: customer?.full_name || 'Customer',
              phoneNumber: customer?.mobile_number || entry.phoneNumber,
              area: customer?.area_locality,
              purifierBrand: purifier?.brand,
              purifierModel: purifier?.model,
              nextDueDate: purifier?.next_service_due_date,
              outputTds: purifier?.output_tds_baseline,
              unreadCount: entry.unreadCount,
              lastMessage: entry.lastMessage,
              lastMessageDirection: entry.lastMessageDirection,
              lastMessageStatus: entry.lastMessageStatus,
              lastMessageTime: entry.lastMessageTime,
              lastInboundTime: entry.lastInboundTime || null,
              mediaUrl: entry.mediaUrl,
              mediaType: entry.mediaType,
            };
          }
        );

        return NextResponse.json({
          success: true,
          conversations,
          source: 'database',
        });
      }
    } catch (dbErr) {
      console.warn('Supabase whatsapp_messages fetch error, falling back to mock store:', dbErr);
    }

    // 2. Fallback to mock store
    const fallbackConvs = getMockWhatsAppConversations();
    return NextResponse.json({
      success: true,
      conversations: fallbackConvs,
      source: 'sandbox',
    });
  } catch (error: any) {
    console.error('Error fetching WhatsApp conversations:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
