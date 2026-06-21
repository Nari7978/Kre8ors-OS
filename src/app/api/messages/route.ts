import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch message history between creator and fan
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const fanId = searchParams.get('fanId');

    if (!creatorId || !fanId) {
      return NextResponse.json(
        { error: 'Both creatorId and fanId query parameters are required' },
        { status: 400 }
      );
    }

    const messages = await db.message.findMany({
      where: {
        creatorId,
        fanId,
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    const parsedMessages = messages.map((m) => ({
      ...m,
      mediaUrls: JSON.parse(m.mediaUrls || '[]') as string[],
    }));

    return NextResponse.json(parsedMessages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST: Send a message from creator/operator to fan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, fanId, text, mediaUrls = [], price = 0 } = body;

    if (!creatorId || !fanId) {
      return NextResponse.json(
        { error: 'Both creatorId and fanId are required in request body' },
        { status: 400 }
      );
    }

    // Generate standard mock OnlyFans message ID
    const ofMessageId = 'msg_mock_' + Math.random().toString(36).substring(2, 11);
    
    // If PPV price is set, message is locked (isPurchased = false)
    const isPpv = price > 0;
    const isPurchased = !isPpv;

    const message = await db.message.create({
      data: {
        ofMessageId,
        creatorId,
        fanId,
        direction: 'out', // Outgoing from creator
        text: text || null,
        mediaUrls: JSON.stringify(mediaUrls),
        isTip: false,
        tipAmount: isPpv ? price : 0.00,
        isPurchased,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      ...message,
      mediaUrls: JSON.parse(message.mediaUrls || '[]') as string[],
    });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
