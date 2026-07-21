import { db } from './db';

export async function seedCreatorMockData(creatorId: string) {
  try {
    const now = new Date();
    
    // 1. Create a few Mock Fans for this creator
    const fan1 = await db.fan.create({
      data: {
        creatorId,
        ofId: `fan_of_${Math.floor(Math.random() * 100000)}`,
        username: 'johnny_rich',
        displayName: 'John Rich',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
        isSubscriber: true,
        totalSpent: 1250.00,
        notes: 'VIP whale. Likes customized good morning videos. Tips generously on chat PPV.',
        customTags: JSON.stringify(['vip', 'whale', 'active']),
        subscribedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      }
    });

    const fan2 = await db.fan.create({
      data: {
        creatorId,
        ofId: `fan_of_${Math.floor(Math.random() * 100000)}`,
        username: 'crypto_boss',
        displayName: 'Crypto Boss',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
        isSubscriber: true,
        totalSpent: 890.00,
        notes: 'Interested in exclusive dynamic sets. Responds well to direct audio notes.',
        customTags: JSON.stringify(['whale', 'crypto']),
        subscribedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      }
    });

    const fan3 = await db.fan.create({
      data: {
        creatorId,
        ofId: `fan_of_${Math.floor(Math.random() * 100000)}`,
        username: 'silent_buyer',
        displayName: 'Marcus Aurelius',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        isSubscriber: true,
        totalSpent: 95.00,
        notes: 'Quiet subscriber. Always unlocks text/image PPVs, rarely chats.',
        customTags: JSON.stringify(['active', 'quiet']),
        subscribedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      }
    });

    // 2. Create message histories for them
    await db.message.createMany({
      data: [
        // Fan 1 conversation
        {
          ofMessageId: `msg_${Math.floor(10000000 + Math.random() * 90000000)}`,
          creatorId,
          fanId: fan1.id,
          direction: 'in',
          text: 'Hey! Hope you are having a wonderful day!',
          sentAt: new Date(now.getTime() - 10 * 60 * 1000),
        },
        {
          ofMessageId: `msg_${Math.floor(10000000 + Math.random() * 90000000)}`,
          creatorId,
          fanId: fan1.id,
          direction: 'out',
          text: 'Hey Johnny! Thank you so much, wishing you the same! ❤️',
          sentAt: new Date(now.getTime() - 9 * 60 * 1000),
        },
        // Fan 2 conversation
        {
          ofMessageId: `msg_${Math.floor(10000000 + Math.random() * 90000000)}`,
          creatorId,
          fanId: fan2.id,
          direction: 'in',
          text: 'Did you see the market today? Crypto is pumping!',
          sentAt: new Date(now.getTime() - 5 * 60 * 1000),
        },
        // Fan 3 conversation
        {
          ofMessageId: `msg_${Math.floor(10000000 + Math.random() * 90000000)}`,
          creatorId,
          fanId: fan3.id,
          direction: 'in',
          text: 'Love the new posts on your feed.',
          sentAt: new Date(now.getTime() - 2 * 60 * 1000),
        }
      ]
    });

    console.log(`Successfully seeded mock chats for creator ${creatorId}`);
  } catch (error) {
    console.error('Error seeding mock chats for onboarded creator:', error);
  }
}
