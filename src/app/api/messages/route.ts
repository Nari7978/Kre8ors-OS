import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch message history between creator and fan
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const fanId = searchParams.get('fanId');

    if (!creatorId || !fanId) {
      return NextResponse.json(
        { error: 'Both creatorId and fanId query parameters are required' },
        { status: 400 }
      );
    }

    const messages = await db.message.findMany({
      where: {
        creatorId,
        fanId,
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
