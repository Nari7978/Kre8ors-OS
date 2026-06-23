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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { postId, action } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    const existingPost = await db.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    let updatedPost;

    if (action === 'publish_now') {
      updatedPost = await db.post.update({
        where: { id: postId },
        data: {
          status: PostStatus.PUBLISHED,
          ofPostId: `post_of_${Math.floor(Math.random() * 1000000)}`,
          scheduledFor: null,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action parameter' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...updatedPost,
      mediaUrls: JSON.parse(updatedPost.mediaUrls || '[]') as string[],
      price: Number(updatedPost.price),
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId query parameter is required' },
        { status: 400 }
      );
    }

    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    await db.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true, message: 'Post successfully cancelled' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete/cancel post' },
      { status: 500 }
    );
  }
}
