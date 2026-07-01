import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId query parameter is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Load extra proxy/webhook configurations from local file store if present
    const configPath = path.join(process.cwd(), 'prisma', 'creator_configs.json');
    let extraConfig = {
      webhookUrl: '',
      proxyHost: '',
      proxyPort: '',
      proxyUser: '',
      proxyPass: '',
    };

    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const configs = JSON.parse(fileContent);
        if (configs[creatorId]) {
          extraConfig = configs[creatorId];
        }
      } catch (e) {
        console.error('Error reading configuration file:', e);
      }
    }

    return NextResponse.json({
      creator: {
        id: creator.id,
        username: creator.username,
        displayName: creator.displayName,
        authId: creator.authId ? '••••••••••••' : '',
        sessCookie: creator.sessCookie ? '••••••••••••' : '',
        userAgent: creator.userAgent,
        xBcHeader: creator.xBcHeader ? '••••••••••••' : '',
      },
      config: extraConfig,
    });
  } catch (error) {
    console.error('Error fetching creator settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      creatorId, 
      authId, 
      sessCookie, 
      userAgent, 
      xBcHeader,
      webhookUrl,
      proxyHost,
      proxyPort,
      proxyUser,
      proxyPass 
    } = body;

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    // Get existing creator credentials for password masking check
    const existing = await db.creator.findUnique({
      where: { id: creatorId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const { encrypt } = require('@/lib/crypto');

    // Keep database value if masked, otherwise encrypt new value
    const finalAuthId = authId === '••••••••••••' ? existing.authId : (authId ? encrypt(authId) : '');
    const finalSessCookie = sessCookie === '••••••••••••' ? existing.sessCookie : (sessCookie ? encrypt(sessCookie) : '');
    const finalXBcHeader = xBcHeader === '••••••••••••' ? existing.xBcHeader : (xBcHeader ? encrypt(xBcHeader) : null);

    // Update main credentials in DB
    const updatedCreator = await db.creator.update({
      where: { id: creatorId },
      data: {
        authId: finalAuthId,
        sessCookie: finalSessCookie,
        userAgent: userAgent || '',
        xBcHeader: finalXBcHeader,
      },
    });

    // Update proxy/webhooks in local config file
    const configPath = path.join(process.cwd(), 'prisma', 'creator_configs.json');
    let configs: Record<string, any> = {};

    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        configs = JSON.parse(fileContent);
      } catch (e) {
        configs = {};
      }
    }

    configs[creatorId] = {
      webhookUrl: webhookUrl || '',
      proxyHost: proxyHost || '',
      proxyPort: proxyPort || '',
      proxyUser: proxyUser || '',
      proxyPass: proxyPass || '',
    };

    // Ensure the prisma directory exists (it does, but safety first)
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(configs, null, 2), 'utf-8');

    return NextResponse.json({
      message: 'Creator settings updated successfully',
      creator: {
        id: updatedCreator.id,
        username: updatedCreator.username,
        displayName: updatedCreator.displayName,
      },
      config: configs[creatorId],
    });
  } catch (error) {
    console.error('Error updating creator settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 550 });
  }
}
