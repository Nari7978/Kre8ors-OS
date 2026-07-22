import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Count or list queue items
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const countOnly = searchParams.get('countOnly') === 'true';

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId parameter is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        if (countOnly) {
          const countRes = await client.getQueueCount();
          return NextResponse.json({ count: countRes?.data?.count || countRes?.data || 0 });
        } else {
          const queueRes = await client.getQueue();
          return NextResponse.json(queueRes?.data || queueRes || []);
        }
      } catch (err: any) {
        console.warn('GET /api/posts/queue OnlyFans API call failed, using local fallback:', err.message);
      }
    }

    // SQLite Fallback
    const queuedPosts = await db.post.findMany({
      where: {
        creatorId,
        status: 'SCHEDULED',
      },
      orderBy: {
        scheduledFor: 'asc',
      }
    });

    if (countOnly) {
      return NextResponse.json({ count: queuedPosts.length });
    }

    const formattedQueue = queuedPosts.map((p) => ({
      id: p.id,
      text: p.text,
      scheduledFor: p.scheduledFor?.toISOString(),
      mediaUrls: JSON.parse(p.mediaUrls || '[]'),
      price: Number(p.price),
    }));

    return NextResponse.json(formattedQueue);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Publish queue item immediately (converts from SCHEDULED/DRAFT to PUBLISHED)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, queueId } = body;

    if (!creatorId || !queueId) {
      return NextResponse.json({ error: 'creatorId and queueId are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        await client.publishQueueItem(queueId);
      } catch (err: any) {
        console.warn('PUT /api/posts/queue OnlyFans API call failed, using local updates:', err.message);
      }
    }

    // Update in local SQLite DB to status = PUBLISHED and nullify scheduledFor
    try {
      await db.post.update({
        where: { id: queueId },
        data: {
          status: 'PUBLISHED',
          scheduledFor: null,
        }
      });
    } catch (dbErr) {
      // Ignore if not in local DB
    }

    return NextResponse.json({ success: true, publishedQueueId: queueId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
