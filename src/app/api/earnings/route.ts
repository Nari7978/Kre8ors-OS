import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    const where: any = {};
    if (creatorId) {
      where.creatorId = creatorId;
    }

    // Retrieve last 30 days of earning records
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    where.loggedAt = {
      gte: thirtyDaysAgo,
    };

    const earnings = await db.earningRecord.findMany({
      where,
      orderBy: {
        loggedAt: 'asc',
      },
    });

    // Aggregate totals
    let totalRevenue = 0;
    let totalNet = 0;
    const bySource = {
      subscription: 0,
      tip: 0,
      ppv_chat: 0,
      ppv_post: 0,
    };

    // Group by day for timeline chart
    const dailyMap: Record<string, typeof bySource> = {};

    earnings.forEach((record) => {
      const amount = Number(record.amount);
      const net = Number(record.netAmount);
      const source = record.source as keyof typeof bySource;

      totalRevenue += amount;
      totalNet += net;

      if (bySource[source] !== undefined) {
        bySource[source] += amount;
      }

      const dateStr = new Date(record.loggedAt).toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          subscription: 0,
          tip: 0,
          ppv_chat: 0,
          ppv_post: 0,
        };
      }
      dailyMap[dateStr][source] += amount;
    });

    const dailyTimeline = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      ...data,
      total: data.subscription + data.tip + data.ppv_chat + data.ppv_post,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalNet,
        bySource,
      },
      dailyTimeline,
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
