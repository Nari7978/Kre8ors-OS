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
      welcomeMessageEnabled: true,
      blockedCountries: ['US', 'CA'],
      drmEnabled: true,
      profile: {
        displayName: 'Sophia Sweet',
        about: 'Welcome to my exclusive playground! 💖 Chatting with fans is my absolute favorite, so send me a message and say hi!',
        website: 'https://sophiasweet.com',
        location: 'Miami, FL'
      },
      subscriptionPrice: 9.99,
      socialMediaButtons: [
        { id: 'btn_1', label: 'Twitter', url: 'https://twitter.com/sophiasweet', order: 1 },
        { id: 'btn_2', label: 'Instagram', url: 'https://instagram.com/sophiasweet', order: 2 },
        { id: 'btn_3', label: 'TikTok', url: 'https://tiktok.com/@sophiasweet', order: 3 }
      ]
    };
    fs.writeFileSync(file, JSON.stringify(initialSettings, null, 2), 'utf8');
  }
  return file;
};

// GET: Fetch OnlyFans Settings (welcome message, blocked countries, DRM, profile, price, social buttons)
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
        const settingsRes = await client.getSettings();
        const socialButtonsRes = await client.listSocialMediaButtons();

        return NextResponse.json({
          welcomeMessage: welcomeRes?.data?.message || welcomeRes?.data || '',
          welcomeMessageEnabled: welcomeRes?.data?.enabled ?? true,
          blockedCountries: countriesRes?.data?.countries || countriesRes?.data || [],
          drmEnabled: drmRes?.data?.enabled || drmRes?.data || false,
          profile: {
            displayName: settingsRes?.data?.displayName || creator.displayName,
            about: settingsRes?.data?.about || '',
            website: settingsRes?.data?.website || '',
            location: settingsRes?.data?.location || ''
          },
          subscriptionPrice: settingsRes?.data?.subscriptionPrice || 9.99,
          socialMediaButtons: socialButtonsRes?.data || []
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

// POST: Update Profile, welcome message, check username availability, add social buttons, reorder social buttons
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, type, welcomeMessage, profile, username, label, url, buttonIds } = body;

    if (type !== 'check-username' && !creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const creator = creatorId ? await db.creator.findUnique({ where: { id: creatorId } }) : null;

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        if (type === 'welcome') {
          await client.updateWelcomeMessage(welcomeMessage);
        } else if (type === 'profile') {
          await client.updateProfile(profile);
        } else if (type === 'check-username') {
          const res = await client.checkUsernameAvailability(username);
          return NextResponse.json(res);
        } else if (type === 'add-social-btn') {
          await client.addSocialMediaButton(label, url);
        } else if (type === 'reorder-social-btns') {
          await client.reorderSocialMediaButtons(buttonIds);
        }
      } catch (err: any) {
        console.warn(`POST /api/settings/onlyfans OnlyFans API update failed for ${type}:`, err.message);
      }
    }

    // Mock implementation fallback
    const file = getMockOnlyFansSettingsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (type === 'welcome') {
      data.welcomeMessage = welcomeMessage;
    } else if (type === 'profile') {
      data.profile = { ...data.profile, ...profile };
    } else if (type === 'check-username') {
      // Simulate availability check
      const takenUsernames = ['sophiasweet', 'admin', 'moderator', 'onlyfans'];
      const available = !takenUsernames.includes((username || '').toLowerCase().trim());
      return NextResponse.json({ success: true, available });
    } else if (type === 'add-social-btn') {
      const newBtn = {
        id: `btn_${Date.now()}`,
        label,
        url,
        order: data.socialMediaButtons.length + 1
      };
      data.socialMediaButtons.push(newBtn);
    } else if (type === 'reorder-social-btns') {
      const reordered = (buttonIds || []).map((id: string, index: number) => {
        const btn = data.socialMediaButtons.find((b: any) => b.id === id);
        if (btn) btn.order = index + 1;
        return btn;
      }).filter(Boolean);
      data.socialMediaButtons = reordered;
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update Blocked countries, Update Social media button
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, type, blockedCountries, buttonId, label, url } = body;

    if (!creatorId || !type) {
      return NextResponse.json({ error: 'creatorId and type are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({ where: { id: creatorId } });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        if (type === 'blocked-countries') {
          await client.updateBlockedCountries(blockedCountries);
        } else if (type === 'update-social-btn') {
          await client.updateSocialMediaButton(buttonId, label, url);
        }
      } catch (err: any) {
        console.warn(`PUT /api/settings/onlyfans OnlyFans API update failed for ${type}:`, err.message);
      }
    }

    // Mock implementation fallback
    const file = getMockOnlyFansSettingsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (type === 'blocked-countries') {
      data.blockedCountries = blockedCountries || [];
    } else if (type === 'update-social-btn') {
      const btn = data.socialMediaButtons.find((b: any) => b.id === buttonId);
      if (btn) {
        btn.label = label;
        btn.url = url;
      }
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update Subscription Price, Enable/Disable Welcome Message
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, type, price, enabled, drmEnabled } = body;

    if (!creatorId || !type) {
      return NextResponse.json({ error: 'creatorId and type are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({ where: { id: creatorId } });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        if (type === 'subscription-price') {
          await client.updateSubscriptionPrice(price);
        } else if (type === 'toggle-welcome') {
          await client.enableDisableWelcomeMessage(enabled);
        } else if (type === 'drm') {
          await client.updateDRMStatus(drmEnabled);
        }
      } catch (err: any) {
        console.warn(`PATCH /api/settings/onlyfans OnlyFans API update failed for ${type}:`, err.message);
      }
    }

    // Mock implementation fallback
    const file = getMockOnlyFansSettingsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (type === 'subscription-price') {
      data.subscriptionPrice = price;
    } else if (type === 'toggle-welcome') {
      data.welcomeMessageEnabled = enabled;
    } else if (type === 'drm') {
      data.drmEnabled = drmEnabled;
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete Social media button
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const buttonId = searchParams.get('buttonId');
    const type = searchParams.get('type');

    if (!creatorId || !buttonId || type !== 'delete-social-btn') {
      return NextResponse.json({ error: 'creatorId, buttonId and correct type are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({ where: { id: creatorId } });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        await client.deleteSocialMediaButton(buttonId);
      } catch (err: any) {
        console.warn(`DELETE /api/settings/onlyfans OnlyFans API delete failed:`, err.message);
      }
    }

    // Mock implementation fallback
    const file = getMockOnlyFansSettingsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    data.socialMediaButtons = data.socialMediaButtons.filter((b: any) => b.id !== buttonId);

    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
