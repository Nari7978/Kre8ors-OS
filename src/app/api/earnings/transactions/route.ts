import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    const where: any = {
      creatorId,
    };

    // Retrieve earning records
    const earnings = await db.earningRecord.findMany({
      where,
      orderBy: {
        loggedAt: 'desc',
      },
    });

    // Resolve associated Fan details in-memory
    const fanOfIds = Array.from(new Set(earnings.map((e) => e.fanOfId).filter(Boolean))) as string[];
    
    const fans = await db.fan.findMany({
      where: {
        ofId: { in: fanOfIds },
        creatorId,
      },
    });

    const fansMap = new Map(fans.map((f) => [f.ofId, f]));

    const transactions = earnings.map((e) => {
      const fan = e.fanOfId ? fansMap.get(e.fanOfId) : null;
      return {
        id: e.id,
        creatorId: e.creatorId,
        source: e.source,
        amount: Number(e.amount),
        netAmount: Number(e.netAmount),
        fanOfId: e.fanOfId,
        loggedAt: e.loggedAt,
        fan: fan ? {
          id: fan.id,
          username: fan.username,
          displayName: fan.displayName,
          avatarUrl: fan.avatarUrl,
        } : null,
      };
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
