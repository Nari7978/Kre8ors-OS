import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, sessCookie, xBcHeader } = body;

    if (!creatorId || !sessCookie) {
      return NextResponse.json(
        { error: 'creatorId and sessCookie are required fields' },
        { status: 400 }
      );
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Update session credentials
    const updatedCreator = await db.creator.update({
      where: { id: creatorId },
      data: {
        sessCookie,
        xBcHeader: xBcHeader || creator.xBcHeader,
        status: 'ACTIVE', // Reset status back to active upon credential update
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Creator credentials successfully rotated and session verified.',
      creator: {
        id: updatedCreator.id,
        username: updatedCreator.username,
        status: updatedCreator.status,
        updatedAt: updatedCreator.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error rotating creator credentials:', error);
    return NextResponse.json(
      { error: 'Failed to rotate creator credentials' },
      { status: 500 }
    );
  }
}
