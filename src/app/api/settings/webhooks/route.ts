import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { creatorId, eventType, text, fanUsername, amount } = await request.json();

    if (!creatorId || !eventType) {
      return NextResponse.json(
        { error: 'creatorId and eventType are required' },
        { status: 400 }
      );
    }

    const logs: string[] = [];
    
    // Find creator
    const creator = await db.creator.findUnique({
      where: { id: creatorId },
    });
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Helper to find or create fan
    let fan = await db.fan.findFirst({
      where: { creatorId, username: fanUsername || 'simulated_fan' },
    });

    if (!fan) {
      fan = await db.fan.create({
        data: {
          ofId: `of_${Math.floor(100000 + Math.random() * 900000)}`,
          creatorId,
          username: fanUsername || 'simulated_fan',
          displayName: fanUsername ? `Simulated ${fanUsername}` : 'Simulated Fan',
          isSubscriber: true,
          totalSpent: 0,
          subscribedAt: new Date(),
        },
      });
      logs.push(`Created new simulated subscriber @${fan.username}`);
    }

    if (eventType === 'new_subscriber') {
      logs.push(`Simulating event: new_subscriber @${fan.username}`);
      
      // Log notification
      await db.notification.create({
        data: {
          creatorId,
          type: 'NEW_SUBSCRIBER',
          title: 'New Subscriber Registered! 👤',
          message: `@${fan.username} just subscribed to your feed.`,
          metadata: JSON.stringify({ fanId: fan.id }),
        },
      });

      // Look for automation rules matching 'new_subscriber'
      const rules = await db.automationRule.findMany({
        where: { creatorId, triggerType: 'new_subscriber', isActive: true },
      });

      for (const rule of rules) {
        logs.push(`Matched active rule: "${rule.name}"`);
        const actionType = rule.actionType;
        const actionData = typeof rule.actionData === 'string' ? JSON.parse(rule.actionData) : rule.actionData;
        const messageText = actionData?.text || 'Welcome to my feed! 💕';

        // Create outgoing automated message
        await db.message.create({
          data: {
            ofMessageId: `msg_${Math.floor(10000000 + Math.random() * 90000000)}`,
            creatorId,
            fanId: fan.id,
            direction: 'out',
            text: messageText,
            sentAt: new Date(),
          },
        });
        logs.push(`Fired action [${actionType}]: Sent welcome message template.`);
      }
    } else if (eventType === 'incoming_message') {
      const msgText = text || 'Hey babe!';
      logs.push(`Simulating event: incoming_message from @${fan.username} ("${msgText}")`);

      // Create incoming message
      await db.message.create({
        data: {
          ofMessageId: `msg_${Math.floor(10000000 + Math.random() * 90000000)}`,
          creatorId,
          fanId: fan.id,
          direction: 'in',
          text: msgText,
          sentAt: new Date(),
        },
      });

      // Look for keyword responders
      const rules = await db.automationRule.findMany({
        where: { creatorId, triggerType: 'keyword_match', isActive: true },
      });

      for (const rule of rules) {
        const conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
        const keywords: string[] = conditions?.keywords || [];
        const match = keywords.some((kw) => msgText.toLowerCase().includes(kw.toLowerCase()));

        if (match) {
          logs.push(`Matched keyword rule: "${rule.name}" (keywords: ${keywords.join(', ')})`);
          const actionData = typeof rule.actionData === 'string' ? JSON.parse(rule.actionData) : rule.actionData;
          const replyText = actionData?.text || 'Thank you! 😘';

          await db.message.create({
            data: {
              ofMessageId: `msg_${Math.floor(10000000 + Math.random() * 90000000)}`,
              creatorId,
              fanId: fan.id,
              direction: 'out',
              text: replyText,
              sentAt: new Date(),
            },
          });
          logs.push(`Fired autoresponder: Sent message reply.`);
        }
      }
    } else if (eventType === 'tip_received') {
      const tipVal = Number(amount) || 10;
      logs.push(`Simulating event: tip_received from @${fan.username} ($${tipVal.toFixed(2)})`);

      // Create incoming message indicating tip
      await db.message.create({
        data: {
          ofMessageId: `msg_${Math.floor(10000000 + Math.random() * 90000000)}`,
          creatorId,
          fanId: fan.id,
          direction: 'in',
          text: `[Tip Received: $${tipVal.toFixed(2)}]`,
          isTip: true,
          tipAmount: tipVal,
          sentAt: new Date(),
        },
      });

      // Update fan spent
      const newSpent = Number(fan.totalSpent) + tipVal;
      await db.fan.update({
        where: { id: fan.id },
        data: { totalSpent: newSpent },
      });
      logs.push(`Updated fan LTV spent to $${newSpent.toFixed(2)}`);

      // Log earning record
      await db.earningRecord.create({
        data: {
          creatorId,
          source: 'tip',
          amount: tipVal,
          netAmount: tipVal * 0.8, // 80% agency/creator cut
          fanOfId: fan.ofId,
          loggedAt: new Date(),
        },
      });
      logs.push(`Logged $${tipVal.toFixed(2)} earnings record (Net: $${(tipVal * 0.8).toFixed(2)})`);

      // Log notification
      await db.notification.create({
        data: {
          creatorId,
          type: 'TIP',
          title: 'Tip Received! 💸',
          message: `@${fan.username} tipped you $${tipVal.toFixed(2)}.`,
          metadata: JSON.stringify({ fanId: fan.id, amount: tipVal }),
        },
      });

      // Update active shift log revenue
      const activeShift = await db.shiftLog.findFirst({
        where: { endTime: null },
      });
      if (activeShift) {
        await db.shiftLog.update({
          where: { id: activeShift.id },
          data: {
            revenue: {
              increment: tipVal,
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('Webhook simulation failed:', error);
    return NextResponse.json(
      { error: 'Simulation failed' },
      { status: 500 }
    );
  }
}
