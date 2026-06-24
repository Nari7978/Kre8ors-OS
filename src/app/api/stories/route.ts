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

    const stories = await db.story.findMany({
      where: {
        creatorId,
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, mediaUrl, scheduledFor, status } = body;

    if (!creatorId || !mediaUrl || !scheduledFor) {
      return NextResponse.json(
        { error: 'creatorId, mediaUrl, and scheduledFor date are required' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid scheduledFor date format' },
        { status: 400 }
      );
    }

    const finalStatus = status || 'SCHEDULED';

    const story = await db.story.create({
      data: {
        creatorId,
        mediaUrl,
        scheduledFor: scheduledDate,
        status: finalStatus,
      },
    });

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error scheduling story:', error);
    return NextResponse.json(
      { error: 'Failed to schedule story' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        { error: 'storyId query parameter is required' },
        { status: 400 }
      );
    }

    const story = await db.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    await db.story.delete({
      where: { id: storyId },
    });

    return NextResponse.json({ success: true, message: 'Story successfully cancelled' });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { error: 'Failed to delete/cancel story' },
      { status: 500 }
    );
  }
}
