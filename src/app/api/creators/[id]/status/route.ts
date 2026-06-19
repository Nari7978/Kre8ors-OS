import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Simulate OnlyFans authentication credential verification
    const cookieIsValid = creator.sessCookie && creator.sessCookie.length > 10;
    const systemStatus = cookieIsValid ? 'ACTIVE' : 'DISCONNECTED';

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
    });
  } catch (error) {
    console.error('Error checking creator status:', error);
    return NextResponse.json(
      { error: 'Failed to verify creator status' },
      { status: 500 }
    );
  }
}
