import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

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
        const res = await client.getUserListCollections();
        return NextResponse.json(res?.data || res || []);
      } catch (err: any) {
        console.warn('GET /api/fans/lists OnlyFans API failed, using mock list:', err.message);
      }
    }

    // Mock collections/user list collections
    const mockLists = [
      {
        id: 'list_1',
        name: 'High Spenders (LTV > $500)',
        userCount: 42,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'list_2',
        name: 'Promo Campaign Leads',
        userCount: 120,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'list_3',
        name: 'Expired - Attempt Winback',
        userCount: 89,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    return NextResponse.json(mockLists);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
