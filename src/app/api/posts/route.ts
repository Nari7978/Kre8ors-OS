import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PostStatus } from '@prisma/client';

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

    const posts = await db.post.findMany({
      where: {
        creatorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedPosts = posts.map((post) => ({
      ...post,
      mediaUrls: JSON.parse(post.mediaUrls || '[]') as string[],
      price: Number(post.price),
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, text, mediaUrls, scheduledFor, price, status } = body;

    if (!creatorId || text === undefined) {
      return NextResponse.json(
        { error: 'creatorId and text are required' },
        { status: 400 }
      );
    }

    const priceVal = parseFloat(price) || 0.00;
    const media = Array.isArray(mediaUrls) ? mediaUrls : [];
    
    // Parse scheduled date
    let scheduledDate: Date | null = null;
    let finalStatus = (status as PostStatus) || PostStatus.DRAFT;

    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduledFor date format' },
          { status: 400 }
        );
      }
      finalStatus = PostStatus.SCHEDULED;
    } else if (finalStatus === PostStatus.SCHEDULED) {
      // If status is SCHEDULED but no date provided, fail
      return NextResponse.json(
        { error: 'scheduledFor date is required for scheduled posts' },
        { status: 400 }
      );
    }

    const ofPostId = finalStatus === PostStatus.PUBLISHED ? `post_of_${Math.floor(Math.random() * 1000000)}` : null;

    const post = await db.post.create({
      data: {
        creatorId,
        text,
        mediaUrls: JSON.stringify(media),
        scheduledFor: scheduledDate,
        status: finalStatus,
        price: priceVal,
        ofPostId,
      },
    });

    return NextResponse.json({
      ...post,
      mediaUrls: media,
      price: Number(post.price),
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
