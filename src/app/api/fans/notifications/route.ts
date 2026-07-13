import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const getMockOnlyFansNotificationsPath = async (creatorId: string) => {
  const dir = path.join(process.cwd(), '.gemini');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'mock_onlyfans_notifications.json');
  
  if (!fs.existsSync(file)) {
    // Find fans from the DB to make mock notifications feel highly realistic
    const dbFans = await db.fan.findMany({
      where: { creatorId },
      take: 5
    });

    const fansList = dbFans.length > 0 ? dbFans : [
      { id: 'mock_fan_1', displayName: 'Johnny Rich', username: 'johnny_rich', avatarUrl: '' },
      { id: 'mock_fan_2', displayName: 'Crypto Boss', username: 'crypto_boss', avatarUrl: '' },
      { id: 'mock_fan_3', displayName: 'Sarah Jenkins', username: 'sarah_j', avatarUrl: '' }
    ];

    const initialNotifications = [
      {
        id: 'notif_1',
        type: 'tip',
        title: 'New Tip Received',
        message: 'Sent you a $20.00 tip: "You look absolutely stunning in this dress! 💖"',
        isRead: false,
        user: {
          id: fansList[0].id,
          displayName: fansList[0].displayName,
          username: fansList[0].username,
          avatarUrl: (fansList[0] as any).avatarUrl || ''
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
      },
      {
        id: 'notif_2',
        type: 'subscribed',
        title: 'New Subscriber',
        message: 'Subscribed to your feed (1-Month Subscription).',
        isRead: false,
        user: {
          id: fansList[1 % fansList.length].id,
          displayName: fansList[1 % fansList.length].displayName,
          username: fansList[1 % fansList.length].username,
          avatarUrl: (fansList[1 % fansList.length] as any).avatarUrl || ''
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 mins ago
      },
      {
        id: 'notif_3',
        type: 'purchases',
        title: 'Exclusive Set Unlocked',
        message: 'Unlocked your PPV template "Teaser Set 2" for $15.00.',
        isRead: true,
        user: {
          id: fansList[2 % fansList.length].id,
          displayName: fansList[2 % fansList.length].displayName,
          username: fansList[2 % fansList.length].username,
          avatarUrl: (fansList[2 % fansList.length] as any).avatarUrl || ''
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
      },
      {
        id: 'notif_4',
        type: 'commented',
        title: 'New Comment',
        message: 'Commented on your post: "Stunning! Can\'t wait to see the next release! 😍🔥"',
        isRead: false,
        user: {
          id: fansList[0].id,
          displayName: fansList[0].displayName,
          username: fansList[0].username,
          avatarUrl: (fansList[0] as any).avatarUrl || ''
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString() // 3.3 hours ago
      },
      {
        id: 'notif_5',
        type: 'mentioned',
        title: 'User Mention',
        message: 'Mentioned you in their post caption.',
        isRead: true,
        user: {
          id: fansList[1 % fansList.length].id,
          displayName: fansList[1 % fansList.length].displayName,
          username: fansList[1 % fansList.length].username,
          avatarUrl: (fansList[1 % fansList.length] as any).avatarUrl || ''
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 400).toISOString()
      },
      {
        id: 'notif_6',
        type: 'favorited',
        title: 'Post Favorited',
        message: 'Liked/Favorited your latest photo post.',
        isRead: false,
        user: {
          id: fansList[2 % fansList.length].id,
          displayName: fansList[2 % fansList.length].displayName,
          username: fansList[2 % fansList.length].username,
          avatarUrl: (fansList[2 % fansList.length] as any).avatarUrl || ''
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString()
      },
      {
        id: 'notif_7',
        type: 'tags',
        title: 'User Tagged',
        message: 'Tagged you in a collaborative post.',
        isRead: true,
        user: {
          id: fansList[0].id,
          displayName: fansList[0].displayName,
          username: fansList[0].username,
          avatarUrl: (fansList[0] as any).avatarUrl || ''
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 1200).toISOString()
      }
    ];

    fs.writeFileSync(file, JSON.stringify(initialNotifications, null, 2), 'utf8');
  }
  return file;
};

// GET: Fetch OnlyFans notifications counts, tabs, search results, or general listings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const action = searchParams.get('action');
    const type = searchParams.get('type') || 'all';
    const query = searchParams.get('query') || '';

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);

        if (action === 'counts') {
          const res = await client.getNotificationCounts();
          return NextResponse.json(res);
        } else if (action === 'tabs') {
          const res = await client.getNotificationTabsOrder();
          return NextResponse.json(res);
        } else if (action === 'search') {
          const res = await client.searchUsersInNotifications(query);
          return NextResponse.json(res);
        } else {
          const res = await client.listNotifications(50, undefined, type !== 'all' ? type : undefined);
          return NextResponse.json(res);
        }
      } catch (err: any) {
        console.warn('GET /api/fans/notifications OnlyFans API call failed, using mock notifications:', err.message);
      }
    }

    const file = await getMockOnlyFansNotificationsPath(creatorId);
    const notifications = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (action === 'counts') {
      const counts: Record<string, number> = {
        all: 0,
        subscribed: 0,
        purchases: 0,
        tip: 0,
        tags: 0,
        commented: 0,
        mentioned: 0,
        favorited: 0
      };

      notifications.forEach((n: any) => {
        if (!n.isRead) {
          counts.all++;
          if (counts[n.type] !== undefined) {
            counts[n.type]++;
          }
        }
      });

      return NextResponse.json({ success: true, data: counts });
    }

    if (action === 'tabs') {
      return NextResponse.json({
        success: true,
        data: ['all', 'subscribed', 'purchases', 'tip', 'tags', 'commented', 'mentioned', 'favorited']
      });
    }

    if (action === 'search') {
      const lower = query.toLowerCase().trim();
      const filtered = notifications.filter((n: any) => 
        n.user.displayName.toLowerCase().includes(lower) ||
        n.user.username.toLowerCase().includes(lower) ||
        n.message.toLowerCase().includes(lower)
      );
      return NextResponse.json(filtered);
    }

    // Default: list notifications (filtered by type)
    const list = type === 'all' 
      ? notifications 
      : notifications.filter((n: any) => n.type === type);

    // Sort by createdAt descending
    list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Mark single notification read or mark all read
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, action, notificationId } = body;

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        if (action === 'mark-all') {
          await client.markAllNotificationsAsRead();
        }
      } catch (err: any) {
        console.warn(`POST /api/fans/notifications OnlyFans API update failed:`, err.message);
      }
    }

    const file = await getMockOnlyFansNotificationsPath(creatorId);
    const notifications = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (action === 'mark-all') {
      notifications.forEach((n: any) => { n.isRead = true; });
    } else if (action === 'mark-read' && notificationId) {
      const notif = notifications.find((n: any) => n.id === notificationId);
      if (notif) notif.isRead = true;
    }

    fs.writeFileSync(file, JSON.stringify(notifications, null, 2), 'utf8');
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Clear all notifications or delete a single notification
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const action = searchParams.get('action');
    const notificationId = searchParams.get('notificationId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId parameter is required' }, { status: 400 });
    }

    const file = await getMockOnlyFansNotificationsPath(creatorId);
    let notifications = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (action === 'clear') {
      notifications = [];
    } else if (action === 'delete' && notificationId) {
      notifications = notifications.filter((n: any) => n.id !== notificationId);
    }

    fs.writeFileSync(file, JSON.stringify(notifications, null, 2), 'utf8');
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
