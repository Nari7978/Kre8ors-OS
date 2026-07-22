import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const mediaId = searchParams.get('mediaId');

    if (!creatorId || !mediaId) {
      return NextResponse.json({ error: 'creatorId and mediaId parameters are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        const res = await client.downloadMediaFromCDN(mediaId);
        return NextResponse.json(res?.data || res || {});
      } catch (err: any) {
        console.warn('GET /api/media/download OnlyFans API failed, using mock data:', err.message);
      }
    }

    // Mock response details of CDN item
    const mockCdnItem = {
      mediaId,
      name: `downloaded_cdn_${mediaId}.jpg`,
      url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=400',
      fileType: 'image',
      fileSize: 1827391,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockCdnItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
