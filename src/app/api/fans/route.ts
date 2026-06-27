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
    const maxSpent = searchParams.get('maxSpent');
    const joinedBefore = searchParams.get('joinedBefore');
    const joinedAfter = searchParams.get('joinedAfter');
    const expiresBefore = searchParams.get('expiresBefore');
    const expiresAfter = searchParams.get('expiresAfter');
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

    if (minSpent || maxSpent) {
      where.totalSpent = {};
      if (minSpent) {
        const minVal = parseFloat(minSpent);
        if (!isNaN(minVal)) {
          where.totalSpent.gte = minVal;
        }
      }
      if (maxSpent) {
        const maxVal = parseFloat(maxSpent);
        if (!isNaN(maxVal)) {
          where.totalSpent.lte = maxVal;
        }
      }
    }

    if (joinedBefore || joinedAfter) {
      where.subscribedAt = {};
      if (joinedBefore) {
        where.subscribedAt.lte = new Date(joinedBefore);
      }
      if (joinedAfter) {
        where.subscribedAt.gte = new Date(joinedAfter);
      }
    }

    if (expiresBefore || expiresAfter) {
      where.expiresAt = {};
      if (expiresBefore) {
        where.expiresAt.lte = new Date(expiresBefore);
      }
      if (expiresAfter) {
        where.expiresAt.gte = new Date(expiresAfter);
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

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    if (pageParam || limitParam) {
      const page = parseInt(pageParam || '1');
      const limit = parseInt(limitParam || '10');
      const totalCount = parsedFans.length;
      const paginatedFans = parsedFans.slice((page - 1) * limit, page * limit);
      
      // Calculate summary metrics on the filtered dataset
      const totalFans = parsedFans.length;
      const activeSubscribers = parsedFans.filter((f) => f.isSubscriber).length;
      const expiredSubscribers = totalFans - activeSubscribers;
      const totalLTV = parsedFans.reduce((acc, cur) => acc + Number(cur.totalSpent || 0), 0);

      return NextResponse.json({
        fans: paginatedFans,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        summary: {
          totalFans,
          activeSubscribers,
          expiredSubscribers,
          totalLTV,
        }
      });
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
    const { fanId, fanIds, notes, customTags, bulkAction, tag } = body;

    // Handle bulk updates
    if (fanIds && Array.isArray(fanIds)) {
      if (!tag || !bulkAction) {
        return NextResponse.json(
          { error: 'tag and bulkAction are required for bulk updates' },
          { status: 400 }
        );
      }

      const normalizedTag = tag.trim().toLowerCase();

      const updatedFans = await Promise.all(
        fanIds.map(async (id) => {
          const fan = await db.fan.findUnique({ where: { id } });
          if (!fan) return null;

          let tagsList = JSON.parse(fan.customTags || '[]') as string[];
          if (bulkAction === 'add') {
            if (!tagsList.includes(normalizedTag)) {
              tagsList.push(normalizedTag);
            }
          } else if (bulkAction === 'remove') {
            tagsList = tagsList.filter((t) => t !== normalizedTag);
          }

          return db.fan.update({
            where: { id },
            data: {
              customTags: JSON.stringify(tagsList),
            },
          });
        })
      );

      return NextResponse.json({
        success: true,
        updatedCount: updatedFans.filter(Boolean).length,
      });
    }

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
