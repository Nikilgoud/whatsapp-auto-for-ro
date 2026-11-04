import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Use requireAuth for proper authentication
    let user;
    try {
      user = await requireAuth(req, ['OWNER']);
    } catch (authErr: any) {
      const status = authErr.message.includes('UNAUTHORIZED') ? 401 : 403;
      return NextResponse.json(
        { error: authErr.message.replace('UNAUTHORIZED: ', '').replace('FORBIDDEN: ', '') },
        { status }
      );
    }

    const data = await req.json();
    const businessId = user.businessId;

    // Validate required fields
    if (!data.name || !data.ownerName) {
      return NextResponse.json(
        { error: 'Business name and owner name are required' },
        { status: 400 }
      );
    }

    // Prepare settings object from request
    const settings = {
      default_service_interval_months: data.defaultServiceIntervalMonths || 3,
      sediment_filter_interval_months: data.sedimentFilterIntervalMonths || 3,
      carbon_filter_interval_months: data.carbonFilterIntervalMonths || 6,
      membrane_interval_months: data.membraneIntervalMonths || 18,
      uv_lamp_interval_months: data.uvLampIntervalMonths || 12,
      working_hours_start: data.workingHoursStart || '09:00',
      working_hours_end: data.workingHoursEnd || '19:30',
      quiet_hours_enabled: data.quietHoursEnabled !== false,
      currency: data.currency || 'INR',
      gstin: data.gstin || null,
      enable_gst: data.enableGst || false,
      invoice_prefix: data.invoicePrefix || 'RO-',
      average_service_cost: data.averageServiceCost || 0,
      average_filter_cost: data.averageFilterCost || 0,
      average_amc_cost: data.averageAmcCost || 0,
      service_charges: {
        general_service: data.serviceCharges?.generalService || 0,
        periodic_service: data.serviceCharges?.periodicService || 0,
        installation: data.serviceCharges?.installation || 0,
        uninstallation: data.serviceCharges?.uninstallation || 0,
        filter_replacement: data.serviceCharges?.filterReplacement || 0,
        membrane_replacement: data.serviceCharges?.membraneReplacement || 0,
        uv_replacement: data.serviceCharges?.uvReplacement || 0,
        leakage_repair: data.serviceCharges?.leakageRepair || 0,
        tds_adjustment: data.serviceCharges?.tdsAdjustment || 0,
        emergency_service: data.serviceCharges?.emergencyService || 0,
        minimum_visiting_fee: data.serviceCharges?.minimumVisitingFee || 0,
      },
    };

    // 1. Persist to Supabase Database using production schema column names
    const { error: upsertError } = await supabaseAdmin
      .from('businesses')
      .upsert({
        id: businessId,
        name: data.name,
        owner_name: data.ownerName,
        tagline: data.tagline || 'Never miss a service. Never lose a customer.',
        phone: data.phone,
        whatsapp_number: data.whatsappNumber,
        email: data.email,
        website: data.website,
        payment_qr_code_url: data.paymentQrCodeUrl,
        signature_url: data.signatureUrl,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstin: data.gstin,
        logo_url: data.logoUrl,
        settings,
        updated_at: new Date().toISOString(),
      });

    // Also persist directly to src/config/businessProfile.json for offline/local resilience
    try {
      const fs = await import('fs');
      const path = await import('path');
      const profilePath = path.join(process.cwd(), 'src', 'config', 'businessProfile.json');
      if (fs.existsSync(profilePath)) {
        const existing = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        const updated = {
          ...existing,
          ...data,
          lastUpdated: new Date().toISOString(),
        };
        fs.writeFileSync(profilePath, JSON.stringify(updated, null, 2), 'utf8');
      }
    } catch (fsErr) {
      console.warn('Local businessProfile.json write skipped:', fsErr);
    }

    if (upsertError) {
      console.warn('Database business upsert skipped (offline/mock mode):', upsertError.message);
      return NextResponse.json({
        success: true,
        offlineMode: true,
        profile: { ...data, id: businessId, settings },
      });
    }

    return NextResponse.json({ success: true, profile: { ...data, id: businessId, settings } });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update profile' }, { status: 500 });
  }
}