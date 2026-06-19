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

    const search = searchParams.get('search');
    const isSubscriber = searchParams.get('isSubscriber');
    const minSpent = searchParams.get('minSpent');
    const tagsParam = searchParams.get('tags');

    // Build filters dynamically
    const where: any = {
      creatorId,
    };

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isSubscriber !== null && isSubscriber !== undefined && isSubscriber !== '') {
      where.isSubscriber = isSubscriber === 'true';
    }

    if (minSpent) {
      const minSpentVal = parseFloat(minSpent);
      if (!isNaN(minSpentVal)) {
        where.totalSpent = {
          gte: minSpentVal,
        };
      }
    }

    if (tagsParam) {
      const tagsList = tagsParam.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagsList.length > 0) {
        where.customTags = {
          hasEvery: tagsList,
        };
      }
    }

    const fans = await db.fan.findMany({
      where,
      orderBy: {
        totalSpent: 'desc',
      },
    });

    return NextResponse.json(fans);
  } catch (error) {
    console.error('Error fetching fans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fans' },
      { status: 500 }
    );
  }
}
