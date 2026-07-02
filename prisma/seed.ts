import { PrismaClient, Role, CreatorStatus, PostStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import 'dotenv/config';

const isPostgres = process.env.DATABASE_URL?.startsWith('postgresql');
let prisma: PrismaClient;

if (isPostgres) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./dev.db',
  });
  prisma = new PrismaClient({ adapter });
}

async function main() {
  console.log('Cleaning up existing database records...');
  
  // Clean up in reverse dependency order
  await prisma.automationRule.deleteMany();
  await prisma.earningRecord.deleteMany();
  await prisma.post.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.message.deleteMany();
  await prisma.fan.deleteMany();
  await prisma.shiftLog.deleteMany();
  await prisma.chatterAssignment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.ppvTemplate.deleteMany();
  await prisma.creator.deleteMany();
  await prisma.agency.deleteMany();

  console.log('Database cleaned. Starting seeding...');

  // 1. Create primary Agency
  const agency = await prisma.agency.create({
    data: {
      name: 'Kre8ors Elite Management',
    },
  });
  console.log(`Created Agency: ${agency.name} (${agency.id})`);

  // 2. Create Users (Owner, Manager, Chatters)
  const passwordHash = '$2b$10$EPX9kY9bH2K2iT.P581aXeG1W1XzU4b6i.yWnJg55xH9X.32F6P.G'; 

  const owner = await prisma.user.create({
    data: {
      email: 'owner@kre8ors.com',
      name: 'Agency Owner',
      passwordHash,
      role: Role.AGENCY_OWNER,
      agencyId: agency.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@kre8ors.com',
      name: 'Sarah Jenkins',
      passwordHash,
      role: Role.MANAGER,
      agencyId: agency.id,
    },
  });

  const chatter1 = await prisma.user.create({
    data: {
      email: 'chatter1@kre8ors.com',
      name: 'Alex Rivera',
      passwordHash,
      role: Role.CHATTER,
      agencyId: agency.id,
    },
  });

  const chatter2 = await prisma.user.create({
    data: {
      email: 'chatter2@kre8ors.com',
      name: 'David Kim',
      passwordHash,
      role: Role.CHATTER,
      agencyId: agency.id,
    },
  });
  
  console.log('Created Users: Owner, Manager, and 2 Chatters');

  // 3. Create Creators
  const creator1 = await prisma.creator.create({
    data: {
      username: 'sophiasweet',
      displayName: 'Sophia Sweet',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      status: CreatorStatus.ACTIVE,
      authId: 'auth_user_sophia_987',
      sessCookie: 'sess_cookie_val_sophia_xyz123',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      xBcHeader: 'x_bc_token_sophia_abc456',
      agencyId: agency.id,
    },
  });

  const creator2 = await prisma.creator.create({
    data: {
      username: 'emmarose',
      displayName: 'Emma Rose',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      status: CreatorStatus.ACTIVE,
      authId: 'auth_user_emma_654',
      sessCookie: 'sess_cookie_val_emma_uvw456',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      xBcHeader: 'x_bc_token_emma_def789',
      agencyId: agency.id,
    },
  });

  const creator3 = await prisma.creator.create({
    data: {
      username: 'pending_creator',
      displayName: 'Pending Onboarding',
      avatarUrl: null,
      status: CreatorStatus.PENDING,
      authId: 'auth_pending_creator',
      sessCookie: '',
      userAgent: 'Mozilla/5.0',
      xBcHeader: null,
      agencyId: agency.id,
    },
  });

  console.log('Created Creators: Sophia Sweet, Emma Rose, Pending Creator');

  // 4. Assign Chatters to Creators
  await prisma.chatterAssignment.createMany({
    data: [
      { userId: chatter1.id, creatorId: creator1.id },
      { userId: chatter1.id, creatorId: creator2.id },
      { userId: chatter2.id, creatorId: creator1.id },
    ],
  });
  console.log('Created Chatter Assignments');

  // 5. Create Shift Logs
  const now = new Date();
  await prisma.shiftLog.create({
    data: {
      userId: chatter1.id,
      startTime: new Date(now.getTime() - 8 * 60 * 60 * 1000), 
      endTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), 
      revenue: 450.50,
    },
  });
  await prisma.shiftLog.create({
    data: {
      userId: chatter2.id,
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), 
      endTime: null, 
      revenue: 120.00,
    },
  });
  console.log('Created Shift Logs');

  // 6. Create Fans for Sophia Sweet (creator1)
  const fansDataSophia = [
    {
      ofId: 'fan_of_001',
      username: 'johnny_rich',
      displayName: 'John Rich',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      isSubscriber: true,
      totalSpent: 1250.00,
      notes: 'VIP whale. Likes customized good morning videos. Tips generously on chat PPV.',
      customTags: JSON.stringify(['vip', 'whale', 'active']),
      subscribedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), 
      expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), 
    },
    {
      ofId: 'fan_of_002',
      username: 'crypto_boss',
      displayName: 'Crypto Boss',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
      isSubscriber: true,
      totalSpent: 890.00,
      notes: 'Interested in exclusive dynamic sets. Responds well to direct audio notes.',
      customTags: JSON.stringify(['whale', 'crypto']),
      subscribedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      ofId: 'fan_of_003',
      username: 'billy_boy',
      displayName: 'Billy',
      avatarUrl: null,
      isSubscriber: true,
      totalSpent: 150.00,
      notes: 'Budget subscriber. Occasionally buys cheap PPVs ($15-$25 range).',
      customTags: JSON.stringify(['regular', 'budget']),
      subscribedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
    },
    {
      ofId: 'fan_of_004',
      username: 'lurker_dan',
      displayName: 'Dan',
      avatarUrl: null,
      isSubscriber: false,
      totalSpent: 20.00,
      notes: 'Subscribed once, now expired. Send win-back discount rules.',
      customTags: JSON.stringify(['expired', 'dormant']),
      subscribedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
  ];

  const seededSophiaFans = [];
  for (const fanData of fansDataSophia) {
    const fan = await prisma.fan.create({
      data: {
        ...fanData,
        creatorId: creator1.id,
      },
    });
    seededSophiaFans.push(fan);
  }

  // Create Fans for Emma Rose (creator2)
  const fansDataEmma = [
    {
      ofId: 'fan_of_101',
      username: 'gentleman_sam',
      displayName: 'Samuel T.',
      avatarUrl: null,
      isSubscriber: true,
      totalSpent: 450.00,
      notes: 'Polite fan, chats regularly. Interested in behind-the-scenes content.',
      customTags: JSON.stringify(['active', 'friendly']),
      subscribedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
    },
    {
      ofId: 'fan_of_102',
      username: 'lonely_rider',
      displayName: 'Rider',
      avatarUrl: null,
      isSubscriber: true,
      totalSpent: 95.00,
      notes: 'New subscriber, active chat history. Send onboarding series.',
      customTags: JSON.stringify(['new-subscriber']),
      subscribedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
    },
  ];

  const seededEmmaFans = [];
  for (const fanData of fansDataEmma) {
    const fan = await prisma.fan.create({
      data: {
        ...fanData,
        creatorId: creator2.id,
      },
    });
    seededEmmaFans.push(fan);
  }
  
  console.log('Created Fans for both Sophia Sweet and Emma Rose');

  // 7. Create Messages
  const johnny = seededSophiaFans[0];
  const mockMessagesList = [];
  
  // Generate 60 historical messages to support scroll-top pagination testing
  for (let i = 60; i >= 1; i--) {
    const isOut = i % 2 === 0;
    const sentTime = new Date(now.getTime() - i * 15 * 60 * 1000 - 4 * 60 * 60 * 1000); // spaced 15 mins apart, before the main conversation
    mockMessagesList.push({
      ofMessageId: `msg_of_paginated_${60 - i + 1}`,
      creatorId: creator1.id,
      fanId: johnny.id,
      direction: isOut ? 'out' : 'in',
      text: isOut 
        ? `Message ${60 - i + 1} from Sophia Sweet: hope you like this historical update! #${60 - i + 1}`
        : `Reply ${60 - i + 1} from Johnny: thanks for keeping in touch! #${60 - i + 1}`,
      mediaUrls: JSON.stringify([]),
      isTip: false,
      tipAmount: 0.00,
      isPurchased: false,
      sentAt: sentTime,
    });
  }

  // Add the specific test messages at the end
  mockMessagesList.push(
    {
      ofMessageId: 'msg_of_001',
      creatorId: creator1.id,
      fanId: johnny.id,
      direction: 'in',
      text: 'Hey Sophia! Hope you had a great day! Can we chat?',
      mediaUrls: JSON.stringify([]),
      isTip: false,
      tipAmount: 0.00,
      isPurchased: false,
      sentAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      ofMessageId: 'msg_of_002',
      creatorId: creator1.id,
      fanId: johnny.id,
      direction: 'out',
      text: 'Hey Johnny! Yes, of course! ❤️ I just uploaded some new media to my vault. Check out this private message!',
      mediaUrls: JSON.stringify([]),
      isTip: false,
      tipAmount: 0.00,
      isPurchased: false,
      sentAt: new Date(now.getTime() - 2.8 * 60 * 60 * 1000),
    },
    {
      ofMessageId: 'msg_of_003',
      creatorId: creator1.id,
      fanId: johnny.id,
      direction: 'out',
      text: 'Exclusive lock set: Good morning outfit reveal! 😉',
      mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400']),
      isTip: false,
      tipAmount: 20.00,
      isPurchased: false, 
      sentAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1000),
    },
    {
      ofMessageId: 'msg_of_004',
      creatorId: creator1.id,
      fanId: johnny.id,
      direction: 'in',
      text: 'Wow, unlocked it immediately! Love the colors! Here is an extra tip.',
      mediaUrls: JSON.stringify([]),
      isTip: true,
      tipAmount: 50.00,
      isPurchased: true, 
      sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    }
  );

  await prisma.message.createMany({
    data: mockMessagesList,
  });
  console.log('Created Chat Messages');

  // 8. Create Media Vault Items
  await prisma.mediaItem.createMany({
    data: [
      {
        creatorId: creator1.id,
        name: 'morning_outfit_01.jpg',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400',
        thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=100',
        fileType: 'image',
        fileSize: 1048576, 
        folderName: 'Outfits',
      },
      {
        creatorId: creator1.id,
        name: 'beach_vlog_01.mp4',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=100',
        fileType: 'video',
        fileSize: 15728640, 
        folderName: 'Vlogs',
      },
      {
        creatorId: creator2.id,
        name: 'backstage_pic.jpg',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
        fileType: 'image',
        fileSize: 850000,
        folderName: 'Casual',
      },
    ],
  });
  console.log('Created Media Items');

  // 9. Create Posts
  await prisma.post.create({
    data: {
      creatorId: creator1.id,
      text: 'Good morning my loves! Starting the week with positive vibes. Check your DMs for a little surprise! 💖',
      mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400']),
      status: PostStatus.PUBLISHED,
      price: 0.00,
      ofPostId: 'post_of_100203',
      scheduledFor: null,
    },
  });

  await prisma.post.create({
    data: {
      creatorId: creator1.id,
      text: 'EXCLUSIVE set coming tomorrow! Pre-order now to unlock early! 🤫',
      mediaUrls: JSON.stringify([]),
      status: PostStatus.SCHEDULED,
      price: 15.00,
      ofPostId: null,
      scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000), 
    },
  });
  console.log('Created Posts');

  // 10. Create Earning Records
  const sources = ['subscription', 'tip', 'ppv_chat', 'ppv_post'] as const;
  
  for (let i = 1; i <= 30; i++) {
    const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const recordsCount = Math.floor(Math.random() * 3) + 1;
    for (let r = 0; r < recordsCount; r++) {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const amount = Math.floor(Math.random() * 80) + 10;
      const netAmount = amount * 0.8;

      await prisma.earningRecord.create({
        data: {
          creatorId: creator1.id,
          source,
          amount,
          netAmount,
          fanOfId: johnny.ofId,
          loggedAt: logDate,
        },
      });
    }
  }

  for (let i = 1; i <= 30; i++) {
    const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const recordsCount = Math.floor(Math.random() * 2) + 1;
    for (let r = 0; r < recordsCount; r++) {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const amount = Math.floor(Math.random() * 50) + 5;
      const netAmount = amount * 0.8;

      await prisma.earningRecord.create({
        data: {
          creatorId: creator2.id,
          source,
          amount,
          netAmount,
          fanOfId: 'fan_of_101',
          loggedAt: logDate,
        },
      });
    }
  }
  console.log('Created 30-Day Earning Records');

  // 11. Create Automation Rules
  await prisma.automationRule.create({
    data: {
      creatorId: creator1.id,
      name: 'Welcome Message to New Fans',
      triggerType: 'new_subscriber',
      conditions: JSON.stringify({ delayMinutes: 5, requireCustomNote: false }),
      actionType: 'send_message',
      actionData: JSON.stringify({ text: 'Hey babe! Thank you so much for subscribing! Tell me what you are looking for... 💋' }),
      isActive: true,
    },
  });

  await prisma.automationRule.create({
    data: {
      creatorId: creator1.id,
      name: 'Tip Auto-Thanks Responder',
      triggerType: 'keyword_match',
      conditions: JSON.stringify({ keywords: ['tip', 'sent', 'unlocked'] }),
      actionType: 'send_media',
      actionData: JSON.stringify({ text: 'Thank you so much for the tip sweetheart! You make my day. ❤️', mediaItemId: 'some-media-id' }),
      isActive: true,
    },
  });
  
  console.log('Created Automation Rules');
  
  // 12. Create PPV Templates
  await prisma.ppvTemplate.createMany({
    data: [
      {
        creatorId: creator1.id,
        name: 'VIP Shower Reveal',
        description: 'Premium shower clip lock for VIP subscribers',
        price: 25.00,
        pricingRules: JSON.stringify([
          { ruleType: 'spend_tier', minSpend: 200, priceOverride: 15.00 },
          { ruleType: 'tag_discount', tag: 'vip', discountPercent: 20 }
        ]),
        messageText: 'Hey baby! I created this special shower video just for you... 💋 Lock it in and let me know how much you love it! ❤️',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400']),
        lockType: 'single',
        previewSeconds: 5,
      },
      {
        creatorId: creator1.id,
        name: 'Good Morning Tease',
        description: 'Morning bedroom selfie set',
        price: 15.00,
        pricingRules: JSON.stringify([]),
        messageText: 'Woke up thinking of you... here is a little teaser to start your day off right. 😉 Send a reply when unlocked!',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400']),
        lockType: 'single',
        previewSeconds: 0,
      },
      {
        creatorId: creator2.id,
        name: 'Backstage VIP Set',
        description: 'Exclusive behind the scenes photo set',
        price: 35.00,
        pricingRules: JSON.stringify([
          { ruleType: 'spend_tier', minSpend: 500, priceOverride: 20.00 }
        ]),
        messageText: 'Hey sweetie! Just finished my backstage photoshoot... 📸 Want to see the unseen fits? Unlock below!',
        mediaUrls: JSON.stringify(['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400']),
        lockType: 'bundle',
        previewSeconds: 0,
      }
    ]
  });
  console.log('Created PPV Templates');

  console.log('Seeding process completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
