import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId query parameter is required' },
        { status: 400 }
      );
    }

    const folderName = searchParams.get('folderName');
    const fileType = searchParams.get('fileType');
    const search = searchParams.get('search');

    const where: any = {
      creatorId,
    };

    if (folderName) {
      where.folderName = folderName;
    }

    if (fileType) {
      where.fileType = fileType;
    }

    if (search) {
      where.name = {
        contains: search,
      };
    }

    const mediaItems = await db.mediaItem.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Error fetching media items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    );
  }
}
