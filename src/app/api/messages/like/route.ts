import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, messageId, unlike } = body;

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
        if (unlike) {
          await client.unlikeMessage(messageId);
        } else {
          await client.likeMessage(messageId);
        }
      } catch (err: any) {
        console.warn('POST /api/messages/like API call failed, using mock toggle:', err.message);
      }
    }

    return NextResponse.json({ success: true, isLiked: !unlike });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
