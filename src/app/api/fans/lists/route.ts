import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const getMockUserListsPath = () => {
  const dir = path.join(process.cwd(), '.gemini');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'mock_user_lists.json');
  return file;
};

async function initializeMockUserLists(creatorId: string) {
  const file = getMockUserListsPath();
  let lists: any[] = [];
  if (fs.existsSync(file)) {
    try {
      lists = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      lists = [];
    }
  }
  
  if (lists.length === 0) {
    // Seed mock lists based on DB fans for this creator
    const fans = await db.fan.findMany({
      where: { creatorId }
    });

    const highSpendersIds = fans.filter(f => Number(f.totalSpent) > 500).map(f => f.id);
    const whaleTags = ['vip', 'whale', 'active'];
    const promoLeadsIds = fans.filter(f => {
      try {
        const tags = JSON.parse(f.customTags || '[]');
        return tags.some((t: string) => whaleTags.includes(t.toLowerCase()));
      } catch {
        return false;
      }
    }).map(f => f.id);
    const expiredLeadsIds = fans.filter(f => !f.isSubscriber).map(f => f.id);

    lists = [
      {
        id: 'list_1',
        name: 'High Spenders (LTV > $500)',
        userIds: highSpendersIds,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'list_2',
        name: 'Promo Campaign Leads',
        userIds: promoLeadsIds.length > 0 ? promoLeadsIds : (fans[0] ? [fans[0].id] : []),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'list_3',
        name: 'Expired - Attempt Winback',
        userIds: expiredLeadsIds,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
    fs.writeFileSync(file, JSON.stringify(lists, null, 2), 'utf8');
  }
  return lists;
}

// GET: Fetch user lists or list members
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const listId = searchParams.get('listId');
    const users = searchParams.get('users') === 'true';

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId parameter is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const isLive = process.env.ONLYFANS_API_KEY && 
                   !process.env.ONLYFANS_API_KEY.includes('mock') && 
                   !creator.sessCookie.includes('mock');

    if (isLive) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        
        if (listId && users) {
          const res = await client.listUserListUsers(listId);
          return NextResponse.json(res?.data || res || []);
        } else if (listId) {
          const listsRes = await client.getUserListCollections();
          const list = (listsRes?.data || listsRes || []).find((l: any) => l.id?.toString() === listId);
          if (!list) {
            return NextResponse.json({ error: 'List not found on OnlyFans API' }, { status: 404 });
          }
          return NextResponse.json(list);
        } else {
          const res = await client.getUserListCollections();
          return NextResponse.json(res?.data || res || []);
        }
      } catch (err: any) {
        console.warn('GET OnlyFans API call failed, using mock persistence fallback:', err.message);
      }
    }

    // Persisted Mock Implementation
    const mockLists = await initializeMockUserLists(creatorId);

    if (listId && users) {
      const list = mockLists.find(l => l.id === listId);
      if (!list) {
        return NextResponse.json({ error: 'User list not found' }, { status: 404 });
      }
      const fans = await db.fan.findMany({
        where: {
          id: { in: list.userIds },
          creatorId
        }
      });
      return NextResponse.json(fans);
    } else if (listId) {
      const list = mockLists.find(l => l.id === listId);
      if (!list) {
        return NextResponse.json({ error: 'User list not found' }, { status: 404 });
      }
      return NextResponse.json({
        ...list,
        userCount: list.userIds.length
      });
    }

    return NextResponse.json(mockLists.map(l => ({
      id: l.id,
      name: l.name,
      userCount: l.userIds.length,
      createdAt: l.createdAt
    })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create list or add members
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, name, action, listId, userIds } = body;

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const isLive = process.env.ONLYFANS_API_KEY && 
                   !process.env.ONLYFANS_API_KEY.includes('mock') && 
                   !creator.sessCookie.includes('mock');

    if (action === 'add-users') {
      if (!listId || !Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: 'listId and userIds (non-empty array) are required' }, { status: 400 });
      }

      if (isLive) {
        try {
          const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
          const client = new OnlyFansApiClient(creator.username);
          const fans = await db.fan.findMany({
            where: {
              id: { in: userIds },
              creatorId
            },
            select: { ofId: true }
          });
          const ofIds = fans.map(f => f.ofId);
          if (ofIds.length > 0) {
            await client.addUsersToUserList(listId, ofIds);
          }
          return NextResponse.json({ success: true, count: ofIds.length });
        } catch (err: any) {
          console.warn('POST /api/fans/lists (add-users) OnlyFans API failed, using mock fallback:', err.message);
        }
      }

      const file = getMockUserListsPath();
      const mockLists = await initializeMockUserLists(creatorId);
      const listIndex = mockLists.findIndex(l => l.id === listId);
      if (listIndex === -1) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
      }

      const validFans = await db.fan.findMany({
        where: { id: { in: userIds }, creatorId }
      });
      const validFanIds = validFans.map(f => f.id);

      const existingIds = new Set(mockLists[listIndex].userIds);
      validFanIds.forEach(id => existingIds.add(id));
      mockLists[listIndex].userIds = Array.from(existingIds);

      fs.writeFileSync(file, JSON.stringify(mockLists, null, 2), 'utf8');
      return NextResponse.json({ success: true, count: validFanIds.length, list: mockLists[listIndex] });
    }

    // Create User List
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    if (isLive) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        const res = await client.createUserList(name.trim());
        const data = res?.data || res;
        return NextResponse.json({
          id: data.id?.toString() || `list_${Math.floor(Math.random() * 1000000)}`,
          name: data.name || name.trim(),
          userCount: 0,
          createdAt: new Date().toISOString()
        });
      } catch (err: any) {
        console.warn('POST /api/fans/lists (create) OnlyFans API failed, using mock fallback:', err.message);
      }
    }

    const file = getMockUserListsPath();
    const mockLists = await initializeMockUserLists(creatorId);
    
    const newList = {
      id: `list_mock_${Math.floor(100000 + Math.random() * 900000)}`,
      name: name.trim(),
      userIds: [],
      createdAt: new Date().toISOString()
    };

    mockLists.push(newList);
    fs.writeFileSync(file, JSON.stringify(mockLists, null, 2), 'utf8');

    return NextResponse.json({
      id: newList.id,
      name: newList.name,
      userCount: 0,
      createdAt: newList.createdAt
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Rename list
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, listId, name } = body;

    if (!creatorId || !listId || !name || name.trim().length === 0) {
      return NextResponse.json({ error: 'creatorId, listId, and non-empty name are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const isLive = process.env.ONLYFANS_API_KEY && 
                   !process.env.ONLYFANS_API_KEY.includes('mock') && 
                   !creator.sessCookie.includes('mock');

    if (isLive) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        const res = await client.updateUserList(listId, name.trim());
        const data = res?.data || res;
        return NextResponse.json({
          id: listId,
          name: data.name || name.trim(),
          success: true
        });
      } catch (err: any) {
        console.warn('PUT /api/fans/lists (rename) OnlyFans API failed, using mock fallback:', err.message);
      }
    }

    const file = getMockUserListsPath();
    const mockLists = await initializeMockUserLists(creatorId);
    const listIndex = mockLists.findIndex(l => l.id === listId);

    if (listIndex === -1) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    mockLists[listIndex].name = name.trim();
    fs.writeFileSync(file, JSON.stringify(mockLists, null, 2), 'utf8');

    return NextResponse.json({
      id: listId,
      name: name.trim(),
      success: true
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete list, remove member, or clear list
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const listId = searchParams.get('listId');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    if (!creatorId || !listId) {
      return NextResponse.json({ error: 'creatorId and listId parameters are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const isLive = process.env.ONLYFANS_API_KEY && 
                   !process.env.ONLYFANS_API_KEY.includes('mock') && 
                   !creator.sessCookie.includes('mock');

    if (action === 'clear') {
      if (isLive) {
        try {
          const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
          const client = new OnlyFansApiClient(creator.username);
          await client.clearUserList(listId);
          return NextResponse.json({ success: true });
        } catch (err: any) {
          console.warn('DELETE /api/fans/lists (clear) OnlyFans API failed, using mock fallback:', err.message);
        }
      }

      const file = getMockUserListsPath();
      const mockLists = await initializeMockUserLists(creatorId);
      const listIndex = mockLists.findIndex(l => l.id === listId);

      if (listIndex === -1) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
      }

      mockLists[listIndex].userIds = [];
      fs.writeFileSync(file, JSON.stringify(mockLists, null, 2), 'utf8');
      return NextResponse.json({ success: true });

    } else if (action === 'remove-user') {
      if (!userId) {
        return NextResponse.json({ error: 'userId parameter is required for remove-user' }, { status: 400 });
      }

      if (isLive) {
        try {
          const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
          const client = new OnlyFansApiClient(creator.username);
          const fan = await db.fan.findUnique({
            where: { id: userId },
            select: { ofId: true }
          });
          if (fan) {
            await client.removeUserFromUserList(listId, fan.ofId);
          }
          return NextResponse.json({ success: true });
        } catch (err: any) {
          console.warn('DELETE /api/fans/lists (remove-user) OnlyFans API failed, using mock fallback:', err.message);
        }
      }

      const file = getMockUserListsPath();
      const mockLists = await initializeMockUserLists(creatorId);
      const listIndex = mockLists.findIndex(l => l.id === listId);

      if (listIndex === -1) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
      }

      mockLists[listIndex].userIds = mockLists[listIndex].userIds.filter((id: string) => id !== userId);
      fs.writeFileSync(file, JSON.stringify(mockLists, null, 2), 'utf8');
      return NextResponse.json({ success: true });

    } else {
      // Delete user list
      if (isLive) {
        try {
          const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
          const client = new OnlyFansApiClient(creator.username);
          await client.deleteUserList(listId);
          return NextResponse.json({ success: true });
        } catch (err: any) {
          console.warn('DELETE /api/fans/lists (delete) OnlyFans API failed, using mock fallback:', err.message);
        }
      }

      const file = getMockUserListsPath();
      const mockLists = await initializeMockUserLists(creatorId);
      const updatedLists = mockLists.filter(l => l.id !== listId);

      if (mockLists.length === updatedLists.length) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
      }

      fs.writeFileSync(file, JSON.stringify(updatedLists, null, 2), 'utf8');
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
