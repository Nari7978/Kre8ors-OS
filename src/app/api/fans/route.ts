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
        { username: { contains: search } },
        { displayName: { contains: search } },
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

    const fans = await db.fan.findMany({
      where,
      orderBy: {
        totalSpent: 'desc',
      },
    });

    let parsedFans = fans.map((fan) => ({
      ...fan,
      customTags: JSON.parse(fan.customTags || '[]') as string[],
    }));

    if (tagsParam) {
      const tagsList = tagsParam.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (tagsList.length > 0) {
        parsedFans = parsedFans.filter((fan) =>
          tagsList.every((t) => fan.customTags.map((ct) => ct.toLowerCase()).includes(t))
        );
      }
    }

    return NextResponse.json(parsedFans);
  } catch (error) {
    console.error('Error fetching fans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fans' },
      { status: 500 }
    );
  }
}
