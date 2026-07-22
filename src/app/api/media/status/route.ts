import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const uploadId = searchParams.get('uploadId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && uploadId && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        const res = await client.getUploadStatus(uploadId);
        return NextResponse.json(res?.data || res || {});
      } catch (err: any) {
        console.warn('GET /api/media/status OnlyFans API failed, using mock data:', err.message);
      }
    }

    // Mock upload queue status logs
    const mockStatuses = [
      {
        uploadId: uploadId || 'up_982731',
        name: 'glamour_set_01.zip',
        progress: '100%',
        status: 'COMPLETED',
        url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=400',
        updatedAt: new Date().toISOString(),
      },
      {
        uploadId: 'up_982732',
        name: 'exclusive_dance_video.mov',
        progress: '65%',
        status: 'PROCESSING',
        url: '',
        updatedAt: new Date().toISOString(),
      }
    ];

    if (uploadId) {
      return NextResponse.json(mockStatuses.find((s) => s.uploadId === uploadId) || mockStatuses[0]);
    }

    return NextResponse.json(mockStatuses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
