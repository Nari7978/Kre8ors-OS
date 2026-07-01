import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MOCK_NOTIFICATION_TEMPLATES = [
  {
    type: 'NEW_SUBSCRIBER',
    title: 'New Subscriber Joined',
    messageTemplate: 'Just subscribed to your feed!',
    metadataGenerator: (fan: any) => ({
      fanId: fan?.id || 'mock-fan-1',
      username: fan?.username || 'sweet_cherry',
      displayName: fan?.displayName || 'Cherry',
    }),
  },
  {
    type: 'TIP',
    title: 'Tip Received! 💸',
    messageTemplate: 'sent you a tip of $20.00 for your latest post.',
    metadataGenerator: (fan: any) => ({
      fanId: fan?.id || 'mock-fan-2',
      username: fan?.username || 'big_spender99',
      displayName: fan?.displayName || 'John Doe',
      amount: 20.00,
    }),
  },
  {
    type: 'PPV_UNLOCK',
    title: 'PPV Message Unlocked! 🔓',
    messageTemplate: 'unlocked your premium photo vault set!',
    metadataGenerator: (fan: any) => ({
      fanId: fan?.id || 'mock-fan-3',
      username: fan?.username || 'anonymous_boss',
      displayName: fan?.displayName || 'VIP Fan',
      price: 35.00,
    }),
  },
  {
    type: 'CHAT_MESSAGE',
    title: 'New Chat Message 💬',
    messageTemplate: 'Hey babe, are you online right now? Check my message...',
    metadataGenerator: (fan: any) => ({
      fanId: fan?.id || 'mock-fan-4',
      username: fan?.username || 'chatter_boy',
      displayName: fan?.displayName || 'Liam',
    }),
  },
  {
    type: 'SYSTEM_ALERT',
    title: 'OnlyFans Integration Warning ⚠️',
    messageTemplate: 'Session cookie expires in 2 hours. Please rotate sessCookie key.',
    metadataGenerator: () => ({
      code: 'AUTH_EXPIRING_SOON',
    }),
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, type } = body;

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    // Try to find a real fan to assign to this notification
    const randomFan = await db.fan.findFirst({
      where: { creatorId },
    });

    // Select templates matching the type or get a random template
    let template = MOCK_NOTIFICATION_TEMPLATES.find((t) => t.type === type);
    if (!template) {
      template = MOCK_NOTIFICATION_TEMPLATES[Math.floor(Math.random() * MOCK_NOTIFICATION_TEMPLATES.length)];
    }

    const metadata = template.metadataGenerator(randomFan) as any;
    const displayName = randomFan ? randomFan.displayName : (metadata.displayName || 'Someone');
    const title = template.title;
    const message = type === 'SYSTEM_ALERT' 
      ? template.messageTemplate 
      : `${displayName} ${template.messageTemplate}`;

    const newNotification = await db.notification.create({
      data: {
        creatorId,
        type: template.type,
        title,
        message,
        isRead: false,
        metadata: metadata || undefined,
      },
    });

    return NextResponse.json(newNotification);
  } catch (error) {
    console.error('Error generating notification:', error);
    return NextResponse.json({ error: 'Failed to generate notification' }, { status: 500 });
  }
}

// GET: Seed some historical notifications for testing purposes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId parameter is required' }, { status: 400 });
    }

    // Clear existing notifications first to keep dev DB clean
    await db.notification.deleteMany({
      where: { creatorId },
    });

    // Generate 5 historical notifications
    const fans = await db.fan.findMany({
      where: { creatorId },
      take: 4,
    });

    const historicalNotifications = [];

    for (let i = 0; i < 5; i++) {
      const template = MOCK_NOTIFICATION_TEMPLATES[i % MOCK_NOTIFICATION_TEMPLATES.length];
      const fan = fans[i % Math.max(fans.length, 1)] || null;
      const metadata = template.metadataGenerator(fan) as any;
      const displayName = fan ? fan.displayName : (metadata.displayName || 'Someone');
      const message = template.type === 'SYSTEM_ALERT' 
        ? template.messageTemplate 
        : `${displayName} ${template.messageTemplate}`;

      const created = await db.notification.create({
        data: {
          creatorId,
          type: template.type,
          title: template.title,
          message,
          isRead: i > 2, // Mark older ones as read
          metadata: metadata || undefined,
          createdAt: new Date(Date.now() - i * 3600000), // 1 hour intervals
        },
      });
      historicalNotifications.push(created);
    }

    return NextResponse.json({ success: true, seededCount: historicalNotifications.length });
  } catch (error) {
    console.error('Error seeding notifications:', error);
    return NextResponse.json({ error: 'Failed to seed notifications' }, { status: 500 });
  }
}
