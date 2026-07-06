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

    return NextResponse.json({
      success: true,
      found: pendingPosts.length,
      message: `Found ${pendingPosts.length} posts due for publication`,
    });
  } catch (error) {
    console.error('Queue worker error:', error);
    return NextResponse.json({ error: 'Worker execution failed' }, { status: 500 });
  }
}
