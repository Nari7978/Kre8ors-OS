import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Fetch all outgoing PPV messages (messages with a tip amount / lock price)
    const ppvMessages = await db.message.findMany({
      where: {
        creatorId,
        direction: 'out',
        tipAmount: {
          gt: 0,
        },
      },
    });

    const totalSent = ppvMessages.length;
    const totalUnlocked = ppvMessages.filter((m) => m.isPurchased).length;
    const conversionRate = totalSent > 0 ? (totalUnlocked / totalSent) * 100 : 0;
    
    // Group by price tiers
    const priceTiers: Record<string, { sent: number; unlocked: number }> = {};
    ppvMessages.forEach((m) => {
      const price = Number(m.tipAmount);
      let tier = '$10-$20';
      if (price < 10) tier = '< $10';
      else if (price > 20 && price <= 50) tier = '$21-$50';
      else if (price > 50) tier = '> $50';

      if (!priceTiers[tier]) {
        priceTiers[tier] = { sent: 0, unlocked: 0 };
      }
      priceTiers[tier].sent += 1;
      if (m.isPurchased) {
        priceTiers[tier].unlocked += 1;
      }
    });

    const tiersArray = Object.entries(priceTiers).map(([tier, stats]) => ({
      tier,
      sent: stats.sent,
      unlocked: stats.unlocked,
      rate: stats.sent > 0 ? (stats.unlocked / stats.sent) * 100 : 0,
    }));

    return NextResponse.json({
      totalSent,
      totalUnlocked,
      conversionRate,
      priceTiers: tiersArray,
    });
  } catch (error) {
    console.error('Error fetching conversion analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion analytics' },
      { status: 500 }
    );
  }
}
