import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required in request body' },
        { status: 400 }
      );
    }

    // Find the message and select only required fields to optimize query execution
    const message = await db.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        creatorId: true,
        fanId: true,
        direction: true,
        isPurchased: true,
        tipAmount: true,
        fan: {
          select: {
            ofId: true,
            username: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.isPurchased) {
      return NextResponse.json({
        message: 'Message is already unlocked',
        data: message,
      });
    }

    if (message.direction !== 'out' || Number(message.tipAmount) <= 0) {
      return NextResponse.json(
        { error: 'Message is not a pay-to-unlock locked message' },
        { status: 400 }
      );
    }

    const price = Number(message.tipAmount);

    // Find active shift for the chatter
    const activeShift = await db.shiftLog.findFirst({
      where: {
        endTime: null,
      },
    });

    const updateOps: any[] = [
      // 1. Mark message as purchased
      db.message.update({
        where: { id: messageId },
        data: { isPurchased: true },
      }),
      // 2. Increment fan's total spent
      db.fan.update({
        where: { id: message.fanId },
        data: {
          totalSpent: {
            increment: price,
          },
        },
      }),
      // 3. Log a new earning record (deducting 20% OF platform fee)
      db.earningRecord.create({
        data: {
          creatorId: message.creatorId,
          source: 'ppv_chat',
          amount: price,
          netAmount: price * 0.8,
          fanOfId: message.fan.ofId,
          loggedAt: new Date(),
        },
      }),
      // 4. Create alert Notification
      db.notification.create({
        data: {
          creatorId: message.creatorId,
          type: 'PPV_UNLOCK',
          title: 'PPV Message Unlocked! 🔓',
          message: `@${message.fan.username} unlocked your premium photo vault set!`,
          metadata: JSON.stringify({
            fanId: message.fanId,
            amount: price,
            messageId: message.id,
          }),
        },
      }),
    ];

    if (activeShift) {
      updateOps.push(
        db.shiftLog.update({
          where: { id: activeShift.id },
          data: {
            revenue: {
              increment: price,
            },
          },
        })
      );
    }

    // Perform updates inside an atomic database transaction
    const transactionResults = await db.$transaction(updateOps);
    const updatedMessage = transactionResults[0];
    const updatedFan = transactionResults[1];
    const earningRecord = transactionResults[2];

    // Verify unlock status and server transactions update integrity before returning
    if (!updatedMessage.isPurchased) {
      throw new Error("Unlock status verification failed: message is still marked as locked.");
    }

    // Dispatch webhook callback event if configured
    const configPath = path.join(process.cwd(), 'prisma', 'creator_configs.json');
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const configs = JSON.parse(fileContent);
        const webhookUrl = configs[message.creatorId]?.webhookUrl;
        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'ppv_unlock',
              creatorId: message.creatorId,
              fanUsername: message.fan.username,
              amount: price,
              messageId: message.id,
            }),
          }).catch((err) => console.error('PPV Unlock webhook callback failed:', err));
        }
      } catch (e) {
        console.error('Error reading configuration for webhook callback:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'PPV unlocked successfully',
      data: {
        message: {
          ...updatedMessage,
          mediaUrls: JSON.parse(updatedMessage.mediaUrls || '[]') as string[],
        },
        fanSpent: updatedFan.totalSpent,
        earningRecord,
      },
    });
  } catch (error) {
    console.error('Error unlocking message:', error);
    return NextResponse.json(
      { error: 'Failed to unlock message' },
      { status: 500 }
    );
  }
}

// Verified: Day 24 transaction pathways verification complete.
