import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const configPath = path.join(process.cwd(), 'src', 'config', 'businessProfile.json');
    
    // Read existing
    let existing = {};
    if (fs.existsSync(configPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {}
    }

    const updated = {
      ...existing,
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf8');

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to write config' }, { status: 500 });
  }
}
