import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateFanProfileSchema = z.object({
  fanId: z.string().uuid(),
  displayName: z.string().min(1).max(50).optional(),
  notes: z.string().max(1000).optional(),
  customTags: z.array(z.string().min(1).max(24).regex(/^[a-zA-Z0-9-_#]+$/)).optional(),
  isSubscriber: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
});

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

    const tagsOnly = searchParams.get('tagsOnly') === 'true';
    if (tagsOnly) {
      const fansForCreator = await db.fan.findMany({
        where: { creatorId },
        select: { customTags: true },
      });
      const uniqueTags = new Set<string>();
      fansForCreator.forEach((f) => {
        try {
          const tags = JSON.parse(f.customTags || '[]') as string[];
          tags.forEach((t) => uniqueTags.add(t.trim().toLowerCase()));
        } catch {}
      });
      return NextResponse.json(Array.from(uniqueTags));
    }

    // Try live OnlyFans API call first
    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        const apiRes = await client.getFans();
        if (apiRes && Array.isArray(apiRes.data)) {
          const formattedFans = apiRes.data.map((f: any) => ({
            id: f.id?.toString() || `fan_${Math.random()}`,
            ofId: f.id?.toString() || `of_${Math.random()}`,
            creatorId,
            username: f.username || 'unknown',
            displayName: f.displayName || f.name || 'OnlyFans Fan',
            avatarUrl: f.avatarUrl || f.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
            isSubscriber: f.subscribed || true,
            totalSpent: f.totalSpent || 0.00,
            notes: f.notes || '',
            customTags: JSON.stringify(f.tags || []),
            subscribedAt: new Date(f.subscribedAt || Date.now()),
            expiresAt: f.expiresAt ? new Date(f.expiresAt) : null,
          }));
          
          for (const f of formattedFans) {
            await db.fan.upsert({
              where: {
                ofId_creatorId: {
                  ofId: f.ofId,
                  creatorId: f.creatorId,
                }
              },
              update: {
                displayName: f.displayName,
                avatarUrl: f.avatarUrl,
                isSubscriber: f.isSubscriber,
                totalSpent: f.totalSpent,
              },
              create: f,
            });
          }
          return NextResponse.json(formattedFans);
        }
      } catch (err: any) {
        console.warn('GET /api/fans OnlyFans API call failed, falling back to local DB:', err.message);
      }
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
        { notes: { contains: search } },
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
    const { fanId, fanIds, creatorId, globalAction, oldTag, newTag, notes, customTags, bulkAction, tag, displayName, isSubscriber, expiresAt } = body;

    // Validate single fan profile updates
    if (!globalAction && !fanIds && fanId) {
      const validation = updateFanProfileSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid profile payload parameters', details: validation.error.flatten() },
          { status: 400 }
        );
      }
    }

    // Handle global tag operations
    if (globalAction) {
      if (!creatorId) {
        return NextResponse.json(
          { error: 'creatorId is required for global tag updates' },
          { status: 400 }
        );
      }

      if (globalAction === 'rename') {
        if (!oldTag || !newTag) {
          return NextResponse.json(
            { error: 'oldTag and newTag are required for global rename' },
            { status: 400 }
          );
        }
        
        const oldTagNorm = oldTag.trim().toLowerCase();
        const newTagNorm = newTag.trim().toLowerCase();

        // Fetch all fans for this creator
        const fans = await db.fan.findMany({
          where: { creatorId },
        });

        // Update fans that have oldTagNorm
        const updatedCount = await db.$transaction(
          fans
            .filter((fan) => {
              const tags = JSON.parse(fan.customTags || '[]') as string[];
              return tags.includes(oldTagNorm);
            })
            .map((fan) => {
              let tags = JSON.parse(fan.customTags || '[]') as string[];
              tags = tags.map((t) => (t === oldTagNorm ? newTagNorm : t));
              const uniqueTags = Array.from(new Set(tags));
              return db.fan.update({
                where: { id: fan.id },
                data: {
                  customTags: JSON.stringify(uniqueTags),
                },
              });
            })
        );

        return NextResponse.json({ success: true, updatedCount: updatedCount.length });
      }

      if (globalAction === 'delete') {
        if (!tag) {
          return NextResponse.json(
            { error: 'tag is required for global delete' },
            { status: 400 }
          );
        }

        const tagNorm = tag.trim().toLowerCase();

        // Fetch all fans for this creator
        const fans = await db.fan.findMany({
          where: { creatorId },
        });

        // Update fans that have tagNorm
        const updatedCount = await db.$transaction(
          fans
            .filter((fan) => {
              const tags = JSON.parse(fan.customTags || '[]') as string[];
              return tags.includes(tagNorm);
            })
            .map((fan) => {
              let tags = JSON.parse(fan.customTags || '[]') as string[];
              tags = tags.filter((t) => t !== tagNorm);
              return db.fan.update({
                where: { id: fan.id },
                data: {
                  customTags: JSON.stringify(tags),
                },
              });
            })
        );

        return NextResponse.json({ success: true, updatedCount: updatedCount.length });
      }
    }

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
    if (displayName !== undefined) {
      data.displayName = displayName;
    }
    if (isSubscriber !== undefined) {
      data.isSubscriber = isSubscriber;
    }
    if (expiresAt !== undefined) {
      data.expiresAt = expiresAt ? new Date(expiresAt) : null;
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
