import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';
import { sendWhatsAppMessage, formatWhatsAppPhoneNumber } from '@/lib/server/whatsappCloudApi';

export const dynamic = 'force-dynamic';

/**
 * GET: Meta Webhook Verification Handshake
 * Requires WHATSAPP_WEBHOOK_VERIFY_TOKEN to be set in environment (no hardcoded fallback in production)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error('WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Verification token mismatch' }, { status: 403 });
}

/**
 * POST: Meta Webhook Ingestion (Delivery receipts & Customer messages)
 * Uses production schema column names
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Meta Webhook payload structure
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ received: true });
    }

    // 1. Process Message Status Updates (sent, delivered, read, failed)
    if (value.statuses && Array.isArray(value.statuses)) {
      for (const statusObj of value.statuses) {
        const providerMsgId = statusObj.id;
        const statusType = (statusObj.status || '').toUpperCase(); // SENT, DELIVERED, READ, FAILED
        const timestamp = statusObj.timestamp
          ? new Date(parseInt(statusObj.timestamp, 10) * 1000).toISOString()
          : new Date().toISOString();

        // Update whatsapp_messages record
        const { data: updatedMsg } = await supabaseAdmin
          .from('whatsapp_messages')
          .update({
            status: statusType,
            delivered_at: statusType === 'DELIVERED' ? timestamp : undefined,
            read_at: statusType === 'READ' ? timestamp : undefined,
          })
          .eq('provider_message_id', providerMsgId)
          .select('id, business_id')
          .maybeSingle();

        // Record event in whatsapp_message_events
        if (updatedMsg?.id) {
          await supabaseAdmin.from('whatsapp_message_events').insert({
            message_id: updatedMsg.id,
            event_type: statusType,
            event_payload: statusObj,
            created_at: timestamp,
          });
        }

        // Update communication_logs
        await supabaseAdmin
          .from('communication_logs')
          .update({
            status: statusType,
          })
          .eq('provider_response_id', providerMsgId);
      }
    }

    // 2. Process Inbound Messages from Customers
    if (value.messages && Array.isArray(value.messages)) {
      for (const msg of value.messages) {
        const fromPhone = formatWhatsAppPhoneNumber(msg.from || '');
        const messageText = (msg.text?.body || '').trim();
        const upperText = messageText.toUpperCase();

        // Find customer record by phone using production schema column names
        // customers.mobile_number, customers.whatsapp_number
        const { data: customer } = await supabaseAdmin
          .from('customers')
          .select('id, business_id, full_name, language_preference, whatsapp_opt_out')
          .or(`mobile_number.eq.${fromPhone},mobile_number.eq.${fromPhone.replace(/^91/, '')},whatsapp_number.eq.${fromPhone},whatsapp_number.eq.${fromPhone.replace(/^91/, '')}`)
          .maybeSingle();

        const businessId = customer?.business_id || '00000000-0000-0000-0000-000000000001';

        // Record inbound message
        await supabaseAdmin.from('whatsapp_messages').insert({
          business_id: businessId,
          customer_id: customer?.id || null,
          phone_number: fromPhone,
          direction: 'INBOUND',
          message_type: 'TEXT',
          content: messageText,
          status: 'RECEIVED',
          provider_message_id: msg.id || null,
          sent_at: new Date().toISOString(),
        });

        // A. Handle OPT-OUT / STOP request
        if (['STOP', 'UNSUBSCRIBE', 'HALT'].includes(upperText)) {
          if (customer?.id) {
            await supabaseAdmin
              .from('customers')
              .update({ whatsapp_opt_out: true })
              .eq('id', customer.id);
          }

          const optOutAck = 'You have been opted out of automated WhatsApp reminders. Reply START to re-enable anytime.';

          await sendWhatsAppMessage({
            businessId,
            recipientPhone: fromPhone,
            customerId: customer?.id,
            bodyText: optOutAck,
          });
          continue;
        }

        // B. Handle OPT-IN / START request
        if (['START', 'UNSTOP'].includes(upperText)) {
          if (customer?.id) {
            await supabaseAdmin
              .from('customers')
              .update({ whatsapp_opt_out: false })
              .eq('id', customer.id);
          }

          const optInAck = 'Welcome back! Your RO service reminder notifications have been re-activated.';

          await sendWhatsAppMessage({
            businessId,
            recipientPhone: fromPhone,
            customerId: customer?.id,
            bodyText: optInAck,
          });
          continue;
        }

        // C. Grounded 24/7 Intelligent RO Assistant
        let replyText = '';
        if (/book|service|appointment/i.test(messageText)) {
          replyText = `Hello ${customer?.full_name || ''}, your RO service booking request has been noted. Our authorized technician will contact you shortly to confirm the appointment.`;
        } else if (/cost|price|filter|rate/i.test(messageText)) {
          replyText = `General RO inspection starts from ₹299. Standard filter replacement packages start from ₹1,200 including genuine parts and testing.`;
        } else if (/tds|taste|leak|water/i.test(messageText)) {
          replyText = `If you notice taste issues or leakage, please switch off the purifier power and inlet valve. Our technician will visit to inspect and measure the TDS level.`;
        } else {
          replyText = `Thank you for contacting Aquapure RO Services. We have received your query. Our service desk representative will connect with you shortly.`;
        }

        await sendWhatsAppMessage({
          businessId,
          recipientPhone: fromPhone,
          customerId: customer?.id,
          bodyText: replyText,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in WhatsApp webhook processing:', err);
    return NextResponse.json({ error: err?.message || 'Webhook error' }, { status: 500 });
  }
}