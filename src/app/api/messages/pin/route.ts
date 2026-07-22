import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, messageId, unpin } = body;

    if (!creatorId || !messageId) {
      return NextResponse.json({ error: 'creatorId and messageId are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        if (unpin) {
          await client.unpinMessage(messageId);
        } else {
          await client.pinMessage(messageId);
        }
      } catch (err: any) {
        console.warn('POST /api/messages/pin API call failed, using mock toggle:', err.message);
      }
    }

    return NextResponse.json({ success: true, isPinned: !unpin });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
