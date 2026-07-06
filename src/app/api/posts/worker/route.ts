import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    
    // Fetch all scheduled posts that are past due
    const pendingPosts = await db.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: now,
        },
      },
    });

    const updatePromises = pendingPosts.map((post) =>
      db.post.update({
        where: { id: post.id },
        data: {
          status: 'PUBLISHED',
          ofPostId: `post_of_${Math.floor(100000 + Math.random() * 900000)}`,
          scheduledFor: null,
        },
      })
    );

    const publishedResults = await db.$transaction(updatePromises);

    return NextResponse.json({
      success: true,
      found: pendingPosts.length,
      publishedCount: publishedResults.length,
      message: `Successfully published ${publishedResults.length} posts.`,
    });
  } catch (error) {
    console.error('Queue worker error:', error);
    return NextResponse.json({ error: 'Worker execution failed' }, { status: 500 });
  }
}
