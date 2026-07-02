import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { displayName, username, authId, sessCookie, userAgent, xBcHeader } = body;

    // Validate fields
    if (!displayName || !username || !authId || !sessCookie || !userAgent) {
      return NextResponse.json(
        { error: 'Missing required credential fields: displayName, username, authId, sessCookie, userAgent' },
        { status: 400 }
      );
    }

    // Find agency
    const agency = await db.agency.findFirst();
    if (!agency) {
      return NextResponse.json(
        { error: 'No agency found in database to link creator' },
        { status: 500 }
      );
    }

    // Check if creator username already exists
    const existingCreator = await db.creator.findUnique({
      where: { username },
    });

    if (existingCreator) {
      return NextResponse.json(
        { error: `Creator with OnlyFans username @${username} is already integrated` },
        { status: 400 }
      );
    }

    // Simulate OnlyFans API wrappers credentials check
    // Wait for 1.5 seconds to feel realistic
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simple pattern check for OnlyFans cookie verification
    if (!sessCookie.includes('sess=') && sessCookie.length < 10) {
      return NextResponse.json(
        { error: 'Invalid OnlyFans session cookie structure. Cookie must be active.' },
        { status: 400 }
      );
    }

    // Create the creator in database
    const { encrypt } = require('@/lib/crypto');
    const newCreator = await db.creator.create({
      data: {
        displayName,
        username,
        authId: encrypt(authId),
        sessCookie: encrypt(sessCookie),
        userAgent,
        xBcHeader: xBcHeader ? encrypt(xBcHeader) : null,
        agencyId: agency.id,
        status: 'ACTIVE',
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
      },
    });

    return NextResponse.json({
      success: true,
      creator: newCreator,
    }, { status: 201 });
  } catch (error) {
    console.error('Error during creator onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error during creator onboarding validation' },
      { status: 500 }
    );
  }
}
