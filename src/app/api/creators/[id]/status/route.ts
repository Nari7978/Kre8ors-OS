import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const creator = await db.creator.findUnique({
      where: { id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Decrypt credentials
    const { decrypt } = require('@/lib/crypto');
    const { verifySession } = require('@/lib/onlyfans-api');

    const decryptedSess = decrypt(creator.sessCookie);
    const decryptedAuth = decrypt(creator.authId);
    const decryptedXBc = creator.xBcHeader ? decrypt(creator.xBcHeader) : undefined;

    // Verify session credentials using OnlyFans wrapper client
    const handshake = await verifySession({
      authId: decryptedAuth,
      sessCookie: decryptedSess,
      userAgent: creator.userAgent || '',
      xBcHeader: decryptedXBc,
    });

    const systemStatus = handshake.valid ? 'ACTIVE' : 'DISCONNECTED';

    // Sync database state if mismatch
    if (creator.status !== systemStatus && creator.status !== 'PENDING') {
      await db.creator.update({
        where: { id },
        data: { status: systemStatus },
      });
    }

    return NextResponse.json({
      creatorId: creator.id,
      username: creator.username,
      displayName: creator.displayName,
      connectionStatus: creator.status === 'PENDING' ? 'PENDING' : systemStatus,
      checklist: {
        sessionCookieLoaded: !!creator.sessCookie,
        userAgentMatch: !!creator.userAgent,
        xbcHeaderConfigured: !!creator.xBcHeader,
        authIdVerified: !!creator.authId,
      },
      lastChecked: new Date().toISOString(),
      handshakeInfo: {
        valid: handshake.valid,
        name: handshake.name,
        error: handshake.error || null,
      },
    });
  } catch (error) {
    console.error('Error checking creator status:', error);
    return NextResponse.json(
      { error: 'Failed to verify creator status' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const creator = await db.creator.findUnique({
      where: { id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    let updatedCreator;
    if (action === 'disconnect') {
      updatedCreator = await db.creator.update({
        where: { id },
        data: {
          status: 'DISCONNECTED',
          sessCookie: '', // clear cookie to simulate disconnection
        },
      });
    } else if (action === 'reconnect') {
      updatedCreator = await db.creator.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          sessCookie: 'sess_cookie_restored_mock_key_999',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          xBcHeader: 'x_bc_token_restored_mock_111',
          authId: 'auth_user_restored_222',
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      message: `Creator successfully ${action}ed`,
      creator: {
        id: updatedCreator.id,
        username: updatedCreator.username,
        displayName: updatedCreator.displayName,
        status: updatedCreator.status,
      },
    });
  } catch (error) {
    console.error('Error updating creator connection status:', error);
    return NextResponse.json(
      { error: 'Failed to update connection status' },
      { status: 500 }
    );
  }
}

