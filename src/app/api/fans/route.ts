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
    const sortBy = searchParams.get('sortBy') || 'totalSpent';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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

    // Resolve sorting rules safely
    const allowedSortFields = ['totalSpent', 'subscribedAt', 'expiresAt', 'displayName', 'username'];
    const resolvedSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'totalSpent';
    const resolvedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const orderBy: any = {};
    orderBy[resolvedSortBy] = resolvedSortOrder;

    const fans = await db.fan.findMany({
      where,
      orderBy,
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { fanId, notes, customTags } = body;

    if (!fanId) {
      return NextResponse.json(
        { error: 'fanId is required' },
        { status: 400 }
      );
    }

    const data: any = {};
    if (notes !== undefined) {
      data.notes = notes;
    }
    if (customTags !== undefined) {
      data.customTags = JSON.stringify(customTags);
    }

    const updatedFan = await db.fan.update({
      where: { id: fanId },
      data,
    });

    return NextResponse.json({
      ...updatedFan,
      customTags: JSON.parse(updatedFan.customTags || '[]') as string[],
    });
  } catch (error) {
    console.error('Error updating fan details:', error);
    return NextResponse.json(
      { error: 'Failed to update fan details' },
      { status: 500 }
    );
  }
}
