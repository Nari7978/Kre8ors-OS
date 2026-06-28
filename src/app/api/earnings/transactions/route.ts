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

    const search = searchParams.get('search');
    const range = searchParams.get('range') || '30d';
    const source = searchParams.get('source');
    const sortBy = searchParams.get('sortBy') || 'loggedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 1. Search filter by resolving matching subscriber UIDs first
    if (search) {
      const matchingFans = await db.fan.findMany({
        where: {
          creatorId,
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { ofId: true },
      });
      const matchingOfIds = matchingFans.map(f => f.ofId);
      where.fanOfId = { in: matchingOfIds };
    }

    // 2. Date range filter
    const now = new Date();
    let startDate: Date | null = null;
    if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    if (startDate) {
      where.loggedAt = {
        gte: startDate,
      };
    }

    // 3. Source filter
    if (source && source !== 'all') {
      where.source = source;
    }

    // Retrieve earning records
    const earnings = await db.earningRecord.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc',
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
