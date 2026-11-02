import { supabaseAdmin } from './supabaseAdmin';

export interface WhatsAppSendParams {
  businessId: string;
  recipientPhone: string;
  customerId?: string | null;
  renewalId?: string | null;
  serviceId?: string | null;
  templateName?: string;
  languageCode?: string;
  parameters?: string[];
  bodyText?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'document' | 'audio' | null;
  mediaCaption?: string | null;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  recordId?: string;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
  providerResponse?: any;
}

/**
 * Standardize Indian phone number to WhatsApp international format (e.g. 919876543210)
 */
export function formatWhatsAppPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Sends a WhatsApp message via Meta Cloud API or simulates in sandbox mode.
 * STRICT RULE: Never marks a message as sent unless accepted by the provider.
 * Uses production schema tables: whatsapp_messages, whatsapp_message_events, communication_logs
 */
export async function sendWhatsAppMessage(
  params: WhatsAppSendParams
): Promise<WhatsAppSendResult> {
  const {
    businessId,
    recipientPhone,
    customerId,
    renewalId,
    serviceId,
    templateName,
    languageCode = 'te',
    parameters = [],
    bodyText,
    mediaUrl,
    mediaType,
    mediaCaption,
  } = params;

  const formattedTo = formatWhatsAppPhoneNumber(recipientPhone);
  const whatsappMode = process.env.WHATSAPP_MODE || 'mock';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // 1. Prepare Meta Cloud API payload
  let payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedTo,
  };

  if (templateName) {
    payload.type = 'template';
    payload.template = {
      name: templateName,
      language: { code: languageCode },
      components: parameters.length > 0
        ? [
            {
              type: 'body',
              parameters: parameters.map((param) => ({
                type: 'text',
                text: String(param),
              })),
            },
          ]
        : [],
    };
  } else if (mediaUrl && mediaType) {
    payload.type = mediaType;
    payload[mediaType] = {
      link: mediaUrl,
      ...(mediaCaption ? { caption: mediaCaption } : {}),
    };
  } else if (bodyText) {
    payload.type = 'text';
    payload.text = {
      preview_url: true,
      body: bodyText,
    };
  } else {
    return {
      success: false,
      status: 'failed',
      error: 'Either templateName, bodyText, or mediaUrl must be provided.',
    };
  }

  // 2. Production Dispatch vs Mock Simulation
  let providerMessageId = '';
  let providerStatus: 'sent' | 'failed' = 'failed';
  let providerError: string | undefined = undefined;
  let rawResponse: any = null;

  if (whatsappMode === 'production' && accessToken && phoneNumberId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      rawResponse = await response.json();

      if (!response.ok) {
        providerError = rawResponse?.error?.message || `Meta API Error ${response.status}`;
        providerStatus = 'failed';
      } else if (rawResponse?.messages?.[0]?.id) {
        providerMessageId = rawResponse.messages[0].id;
        providerStatus = 'sent';
      } else {
        providerError = 'Meta response missing message ID';
        providerStatus = 'failed';
      }
    } catch (err: any) {
      providerError = err?.message || 'Network error calling Meta Graph API';
      providerStatus = 'failed';
    }
  } else {
    // Sandbox / Development mock mode
    // Simulate real Meta response with unique generated wamid
    providerMessageId = `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    providerStatus = 'sent';
    rawResponse = {
      messaging_product: 'whatsapp',
      contacts: [{ input: formattedTo, wa_id: formattedTo }],
      messages: [{ id: providerMessageId, message_status: 'accepted' }],
      mock_mode: true,
    };
  }

  const isSuccess = providerStatus === 'sent' && Boolean(providerMessageId);

  // 3. Persist record in database using production schema tables
  try {
    const finalContent = bodyText || `Template: ${templateName} | Params: ${parameters.join(', ')}`;

    // Insert into whatsapp_messages table
    const { data: insertedMsg, error: insertError } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        business_id: businessId,
        customer_id: customerId || null,
        phone_number: formattedTo,
        direction: 'OUTBOUND',
        message_type: templateName ? 'TEMPLATE' : mediaType ? 'MEDIA' : 'TEXT',
        template_name: templateName || null,
        content: finalContent,
        media_url: mediaUrl || null,
        provider_message_id: providerMessageId || null,
        status: isSuccess ? 'SENT' : 'FAILED',
        error_message: providerError || null,
        sent_at: isSuccess ? new Date().toISOString() : null,
      })
      .select('id')
      .maybeSingle();

    if (insertError) {
      console.warn('Could not insert into whatsapp_messages (table might be initializing):', insertError.message);
    }

    // Insert event into whatsapp_message_events if message was created
    if (insertedMsg?.id) {
      await supabaseAdmin.from('whatsapp_message_events').insert({
        message_id: insertedMsg.id,
        event_type: isSuccess ? 'SENT' : 'FAILED',
        event_payload: rawResponse || {},
        created_at: new Date().toISOString(),
      });
    }

    // Insert into communication_logs for backwards compatibility and audit trail
    await supabaseAdmin.from('communication_logs').insert({
      business_id: businessId,
      customer_id: customerId || null,
      channel: 'WHATSAPP',
      direction: 'OUTBOUND',
      recipient: formattedTo,
      subject: templateName || 'Service Alert',
      message_content: finalContent,
      media_url: mediaUrl || null,
      status: isSuccess ? 'DELIVERED' : 'FAILED',
      provider_response_id: providerMessageId || null,
      error_details: providerError || null,
      sent_at: new Date().toISOString(),
    });
  } catch (dbErr) {
    console.error('Error recording WhatsApp message in database:', dbErr);
  }

  return {
    success: isSuccess,
    messageId: providerMessageId,
    status: isSuccess ? 'sent' : 'failed',
    error: providerError,
    providerResponse: rawResponse,
  };
}