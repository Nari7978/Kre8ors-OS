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
        const res = await client.getFollowing();
        return NextResponse.json(res?.data || res || []);
      } catch (err: any) {
        console.warn('GET /api/fans/following OnlyFans API failed, using mock list:', err.message);
      }
    }

    // Mock following list representing other creators this creator is following
    const mockFollowing = [
      {
        id: 'fol_1',
        username: 'sophia_luna',
        displayName: 'Sophia Luna 💋',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        followedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'fol_2',
        username: 'bellathorne',
        displayName: 'Bella Thorne 👑',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        followedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    return NextResponse.json(mockFollowing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
