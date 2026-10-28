import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const configPath = path.join(process.cwd(), 'src', 'config', 'businessProfile.json');
    
    // 1. Persist to Supabase Database (production-safe multi-tenant)
    const businessId = data.businessId || '00000000-0000-0000-0000-000000000001';
    try {
      await supabaseAdmin
        .from('businesses')
        .upsert({
          id: businessId,
          name: data.companyName || data.name || 'Niki Aquapure RO Solutions',
          business_phone: data.businessPhone || data.phone || '+91 98765 43210',
          support_email: data.supportEmail || data.email || 'support@nikiaquapure.com',
          address: data.address || 'Kukatpally, Hyderabad, Telangana',
          tax_gstin: data.gstin || null,
          timezone: data.timezone || 'Asia/Kolkata',
          updated_at: new Date().toISOString(),
        });
    } catch (dbErr) {
      console.warn('Database business upsert warning (falling back to config):', dbErr);
    }

    // 2. Read existing local file config if available
    let existing = {};
    try {
      if (fs.existsSync(configPath)) {
        existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch {}

    const updated = {
      ...existing,
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    // 3. Write to local file safely (catch EROFS in read-only production environments)
    try {
      fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (fsErr) {
      // Safely ignore read-only file system on Vercel/production
      console.log('Skipping local file write on read-only platform environment.');
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update profile' }, { status: 500 });
  }
}
