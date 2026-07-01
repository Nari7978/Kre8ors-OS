import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const creators = await db.creator.findMany({
      include: {
        fans: {
          select: { id: true, isSubscriber: true },
        },
        earnings: {
          select: { amount: true, netAmount: true },
        },
        messages: {
          select: { id: true, isTip: true, isPurchased: true },
        },
      },
    });

    const compareMetrics = creators.map((creator) => {
      const totalRevenue = creator.earnings.reduce((sum, item) => sum + Number(item.amount), 0);
      const totalNet = creator.earnings.reduce((sum, item) => sum + Number(item.netAmount), 0);
      const subscribersCount = creator.fans.filter((f) => f.isSubscriber).length;
      const fanCount = creator.fans.length;
      
      const totalMessages = creator.messages.length;
      const tipsCount = creator.messages.filter((m) => m.isTip).length;
      const unlockedCount = creator.messages.filter((m) => m.isPurchased).length;

      // Simulated conversion metrics
      const totalPPVAttempts = Math.max(unlockedCount + 15, 20);
      const ppvConversionRate = Math.min(100, Math.round((unlockedCount / totalPPVAttempts) * 100)) || 18;

      return {
        id: creator.id,
        username: creator.username,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl,
        status: creator.status,
        subscribersCount,
        fanCount,
        totalRevenue,
        totalNet,
        totalMessages,
        tipsCount,
        ppvConversionRate,
      };
    });

    return NextResponse.json(compareMetrics);
  } catch (error) {
    console.error('Error generating creator comparison metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate comparison metrics' },
      { status: 500 }
    );
  }
}
