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
