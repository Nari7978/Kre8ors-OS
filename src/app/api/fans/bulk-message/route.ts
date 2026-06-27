import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, fanIds, text } = body;

    if (!creatorId || !fanIds || !Array.isArray(fanIds) || !text) {
      return NextResponse.json(
        { error: 'creatorId, fanIds (array), and text are required fields' },
        { status: 400 }
      );
    }

    // Process messaging dispatch in bulk
    const results = await Promise.all(
      fanIds.map(async (fanId) => {
        const fan = await db.fan.findUnique({
          where: { id: fanId },
        });

        if (!fan) return null;

        // Personalize template tags
        const firstName = fan.displayName.split(' ')[0] || 'babe';
        const personalizedText = text.replace(/{name}/g, firstName);

        // Generate unique OnlyFans message ID simulation
        const ofMessageId = `msg-bulk-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

        return db.message.create({
          data: {
            ofMessageId,
            creatorId,
            fanId,
            direction: 'out',
            text: personalizedText,
            mediaUrls: '[]',
            isTip: false,
            tipAmount: 0.00,
            isPurchased: false,
            sentAt: new Date(),
          },
        });
      })
    );

    const successfulSends = results.filter(Boolean);

    return NextResponse.json({
      success: true,
      sentCount: successfulSends.length,
    });
  } catch (error) {
    console.error('Error dispatching bulk campaign:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch bulk campaign outreach' },
      { status: 500 }
    );
  }
}
