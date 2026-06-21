import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Find the message and include fan relations
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        fan: true,
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

    const price = Number(message.tipAmount);

    // Perform updates inside an atomic database transaction
    const [updatedMessage, updatedFan, earningRecord] = await db.$transaction([
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
    ]);

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
