import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/auth';
import { WhatsAppMessageSendSchema } from '@/lib/server/validation';
import { sendWhatsAppMessage } from '@/lib/server/whatsappCloudApi';
import { addMockWhatsAppMessage } from '@/lib/server/mockWhatsAppStore';
import { appendBusinessFooter } from '@/lib/services/whatsappEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = WhatsAppMessageSendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const payload = validation.data;
    const businessId = user.businessId;

    const rawBody = payload.bodyText || payload.messageText;
    const formattedBody = rawBody ? appendBusinessFooter(rawBody) : undefined;

    // Send via Meta Cloud API or mock engine
    const sendResult = await sendWhatsAppMessage({
      businessId,
      recipientPhone: payload.recipientPhone,
      customerId: payload.customerId,
      bodyText: formattedBody,
      templateName: payload.templateName,
      languageCode: payload.languageCode,
      mediaUrl: payload.mediaUrl,
      mediaType: payload.mediaType,
      mediaCaption: payload.mediaCaption,
      renewalId: payload.renewalId,
      serviceId: payload.serviceId,
    });

    // Also record in mock store for instant UI sync
    const recordedMessage = addMockWhatsAppMessage({
      businessId,
      customerId: payload.customerId,
      customerName: payload.customerName,
      area: payload.area,
      purifierBrand: payload.purifierBrand,
      purifierModel: payload.purifierModel,
      nextDueDate: payload.nextDueDate,
      outputTds: payload.outputTds,
      phoneNumber: payload.recipientPhone,
      direction: 'OUTBOUND',
      messageType: payload.templateName ? 'TEMPLATE' : payload.mediaUrl ? 'MEDIA' : 'TEXT',
      templateName: payload.templateName || null,
      content: formattedBody || payload.templateName || 'Media message',
      mediaUrl: payload.mediaUrl || null,
      mediaType: payload.mediaType || null,
      providerMessageId: sendResult.messageId,
      status: sendResult.success ? 'DELIVERED' : 'FAILED',
    });

    return NextResponse.json({
      success: sendResult.success,
      messageId: sendResult.messageId,
      status: sendResult.status,
      message: recordedMessage,
      error: sendResult.error,
    });
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}
