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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, name, url, fileType, fileSize, folderName } = body;

    if (!creatorId || !name || !url || !fileType) {
      return NextResponse.json(
        { error: 'creatorId, name, url, and fileType are required' },
        { status: 400 }
      );
    }

    const size = parseInt(fileSize) || 1024 * 1024; // default 1MB
    const folder = folderName || 'uncategorized';

    const mediaItem = await db.mediaItem.create({
      data: {
        creatorId,
        name,
        url,
        thumbnail: fileType === 'video' ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=100' : url,
        fileType,
        fileSize: size,
        folderName: folder,
      },
    });

    return NextResponse.json(mediaItem);
  } catch (error) {
    console.error('Error creating media item:', error);
    return NextResponse.json(
      { error: 'Failed to create media item' },
      { status: 500 }
    );
  }
}
