import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/server/whatsappCloudApi';
import { addMockWhatsAppMessage } from '@/lib/server/mockWhatsAppStore';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || (body.otp ? 'send_otp' : 'send_otp');
    const mobile = body.mobile || body.mobileNumber || '';
    const newPasscode = body.newPasscode || '';
    const providedOtp = body.otp;

    // Read current business profile to get registered phone & business info
    const profilePath = path.join(process.cwd(), 'src', 'config', 'businessProfile.json');
    let registeredPhone = '9849000000';
    let businessName = 'Apex RO Care Solutions';

    if (fs.existsSync(profilePath)) {
      try {
        const profileContent = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        if (profileContent.whatsappNumber) {
          registeredPhone = profileContent.whatsappNumber.replace(/\D/g, '').slice(-10);
        } else if (profileContent.phone) {
          registeredPhone = profileContent.phone.replace(/\D/g, '').slice(-10);
        }
        if (profileContent.name) {
          businessName = profileContent.name;
        }
      } catch (err) {
        console.warn('Failed to parse businessProfile.json:', err);
      }
    }

    const cleanInputMobile = (mobile || registeredPhone).replace(/\D/g, '').slice(-10);

    if (action === 'send_otp') {
      // Validate mobile
      if (!cleanInputMobile || cleanInputMobile.length !== 10) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' },
          { status: 400 }
        );
      }

      // Generate or use provided 6-digit OTP
      const otp = providedOtp || Math.floor(100000 + Math.random() * 900000).toString();
      const messageText = `Your RO Care Engine passcode reset OTP is: ${otp}. Valid for 5 minutes. Do not share this with anyone.`;

      // 1. Send via WhatsApp Meta Cloud API or mock engine
      const sendResult = await sendWhatsAppMessage({
        businessId: '00000000-0000-0000-0000-000000000001',
        recipientPhone: `91${cleanInputMobile}`,
        bodyText: messageText,
      });

      // 2. Also record in mock store for instant UI sync & local audit
      try {
        addMockWhatsAppMessage({
          businessId: '00000000-0000-0000-0000-000000000001',
          customerName: 'Business Owner (Passcode Recovery)',
          phoneNumber: `91${cleanInputMobile}`,
          direction: 'OUTBOUND',
          messageType: 'TEXT',
          content: messageText,
          providerMessageId: sendResult.messageId || `otp-${Date.now()}`,
          status: 'DELIVERED',
        });
      } catch (mockErr) {
        console.warn('Mock store recording error:', mockErr);
      }

      return NextResponse.json({
        success: true,
        otp, // Included for offline test environments and instant visual feedback
        recipientPhone: cleanInputMobile,
        expiresInSeconds: 300,
        message: 'Passcode reset OTP dispatched successfully to your registered WhatsApp.',
      });
    }

    if (action === 'update_passcode') {
      if (!newPasscode || newPasscode.trim().length < 4) {
        return NextResponse.json(
          { success: false, error: 'Passcode must be at least 4 digits.' },
          { status: 400 }
        );
      }

      // Update businessProfile.json directly if accessible
      try {
        if (fs.existsSync(profilePath)) {
          const profileContent = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
          profileContent.passcode = newPasscode.trim();
          profileContent.lastUpdated = new Date().toISOString();
          fs.writeFileSync(profilePath, JSON.stringify(profileContent, null, 2), 'utf8');
        }
      } catch (err) {
        console.warn('Failed to update passcode in businessProfile.json:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Passcode updated successfully.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action requested.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in whatsapp-otp handler:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error processing request.' },
      { status: 500 }
    );
  }
}
