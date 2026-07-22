import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const getMockOnlyFansSettingsPath = () => {
  const dir = path.join(process.cwd(), '.gemini');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'mock_onlyfans_settings.json');
  if (!fs.existsSync(file)) {
    const initialSettings = {
      welcomeMessage: 'Hey sweetie! Welcome to my OnlyFans! ❤️ I check my messages daily and love chatting with you. Unlock my feed to see exclusive sets!',
      blockedCountries: ['US', 'CA'],
      drmEnabled: true,
    };
    fs.writeFileSync(file, JSON.stringify(initialSettings, null, 2), 'utf8');
  }
  return file;
};

// GET: Fetch OnlyFans Settings (welcome message, blocked countries, DRM)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        const welcomeRes = await client.getWelcomeMessage();
        const countriesRes = await client.getBlockedCountries();
        const drmRes = await client.getDRMStatus();

        return NextResponse.json({
          welcomeMessage: welcomeRes?.data?.message || welcomeRes?.data || '',
          blockedCountries: countriesRes?.data?.countries || countriesRes?.data || [],
          drmEnabled: drmRes?.data?.enabled || drmRes?.data || false,
        });
      } catch (err: any) {
        console.warn('GET /api/settings/onlyfans OnlyFans API call failed, using mock settings:', err.message);
      }
    }

    const file = getMockOnlyFansSettingsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update OnlyFans Settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, type, welcomeMessage, blockedCountries, drmEnabled } = body;

    if (!creatorId || !type) {
      return NextResponse.json({ error: 'creatorId and type are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        if (type === 'welcome') {
          await client.updateWelcomeMessage(welcomeMessage);
        } else if (type === 'blocked-countries') {
          await client.updateBlockedCountries(blockedCountries);
        } else if (type === 'drm') {
          await client.updateDRMStatus(drmEnabled);
        }
      } catch (err: any) {
        console.warn(`POST /api/settings/onlyfans OnlyFans API update failed for ${type}:`, err.message);
      }
    }

    const file = getMockOnlyFansSettingsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    if (type === 'welcome') {
      data.welcomeMessage = welcomeMessage;
    } else if (type === 'blocked-countries') {
      data.blockedCountries = blockedCountries;
    } else if (type === 'drm') {
      data.drmEnabled = drmEnabled;
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
