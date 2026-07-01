import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Simulated intent detection keywords
const INTENT_KEYWORDS: Record<string, string[]> = {
  purchasing: ['buy', 'purchase', 'unlock', 'send me', 'price', 'how much', 'ppv', 'exclusive', 'private'],
  flirting: ['cute', 'hot', 'beautiful', 'gorgeous', 'babe', 'baby', 'love', 'miss you', 'thinking of you'],
  complaining: ['slow', 'late', 'waiting', 'annoyed', 'disappointed', 'refund', 'cancel', 'unsubscribe'],
  grateful: ['thank', 'thanks', 'appreciate', 'amazing', 'best', 'love your', 'incredible'],
  curious: ['what', 'when', 'how', 'tell me', 'show me', 'can you', 'will you', 'do you'],
};

// Simulated mood detection
const MOOD_SIGNALS: Record<string, string[]> = {
  positive: ['😊', '💕', '🥰', '😘', '❤️', '🔥', '💋', 'haha', 'lol', 'love', 'great', 'awesome'],
  negative: ['😒', '😤', '😡', '💀', 'ugh', 'hate', 'boring', 'meh', 'whatever', 'nah'],
  neutral: [],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, fanId, recentMessages = [] } = body;

    if (!creatorId || !fanId) {
      return NextResponse.json(
        { error: 'creatorId and fanId are required' },
        { status: 400 }
      );
    }

    // Get fan context from database
    const fan = await db.fan.findUnique({
      where: { id: fanId },
    });

    const totalSpent = fan ? Number(fan.totalSpent) : 0;
    const fanName = fan ? fan.displayName : 'Unknown';

    // Analyze recent messages for intent
    const messageTexts = recentMessages
      .filter((m: any) => m.direction === 'in' && m.text)
      .map((m: any) => m.text.toLowerCase())
      .join(' ');

    // Detect intent
    let detectedIntent = 'general_chat';
    let highestScore = 0;
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      const matchCount = keywords.filter((kw) => messageTexts.includes(kw)).length;
      if (matchCount > highestScore) {
        highestScore = matchCount;
        detectedIntent = intent;
      }
    }

    // Detect mood
    let detectedMood = 'neutral';
    let positiveCount = 0;
    let negativeCount = 0;
    for (const signal of MOOD_SIGNALS.positive) {
      if (messageTexts.includes(signal)) positiveCount++;
    }
    for (const signal of MOOD_SIGNALS.negative) {
      if (messageTexts.includes(signal)) negativeCount++;
    }
    if (positiveCount > negativeCount) detectedMood = 'positive';
    else if (negativeCount > positiveCount) detectedMood = 'negative';

    // Detect spending signals
    const spendingSignals: string[] = [];
    if (totalSpent > 500) spendingSignals.push('High lifetime spender (>$500)');
    if (totalSpent > 100) spendingSignals.push('Above-average spend history');
    if (messageTexts.includes('tip') || messageTexts.includes('tipped')) {
      spendingSignals.push('Recent tipping behavior detected');
    }
    if (messageTexts.includes('unlock') || messageTexts.includes('ppv')) {
      spendingSignals.push('PPV purchase intent signals');
    }
    if (fan?.isSubscriber) spendingSignals.push('Active subscriber');

    // Recommend category based on intent
    type CategoryType = 'openers' | 'ppv' | 'gratitude' | 'reEngage';
    const categoryMap: Record<string, CategoryType> = {
      purchasing: 'ppv',
      flirting: 'openers',
      complaining: 'reEngage',
      grateful: 'gratitude',
      curious: 'openers',
      general_chat: 'openers',
    };
    const recommendedCategory = categoryMap[detectedIntent] || 'openers';

    // Recommend tone based on mood and spending
    type ToneType = 'flirty' | 'professional' | 'casual' | 'aggressive-sales';
    let recommendedTone: ToneType = 'flirty';
    if (detectedMood === 'negative') recommendedTone = 'professional';
    else if (totalSpent > 300 && detectedIntent === 'purchasing') recommendedTone = 'aggressive-sales';
    else if (detectedMood === 'neutral') recommendedTone = 'casual';

    // Calculate engagement score (0-100)
    const messageCount = recentMessages.length;
    const inboundCount = recentMessages.filter((m: any) => m.direction === 'in').length;
    const engagementScore = Math.min(100, Math.round(
      (inboundCount / Math.max(messageCount, 1)) * 40 +
      Math.min(totalSpent / 10, 30) +
      (detectedMood === 'positive' ? 20 : detectedMood === 'negative' ? 5 : 10) +
      (spendingSignals.length * 5)
    ));

    // Generate summary
    const summary = `${fanName} appears to be in a ${detectedMood} mood with ${detectedIntent.replace('_', ' ')} intent. ` +
      `Lifetime spend: $${totalSpent.toFixed(2)}. ` +
      `Engagement score: ${engagementScore}/100. ` +
      `Recommended approach: ${recommendedTone} tone with ${recommendedCategory} messaging.`;

    return NextResponse.json({
      fanIntent: detectedIntent,
      mood: detectedMood,
      spendingSignals,
      recommendedCategory,
      recommendedTone,
      engagementScore,
      summary,
      fanContext: {
        name: fanName,
        totalSpent,
        isSubscriber: fan?.isSubscriber ?? false,
        messageCount,
        inboundRatio: messageCount > 0 ? (inboundCount / messageCount * 100).toFixed(1) : '0',
      },
    });
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    return NextResponse.json(
      { error: 'Failed to analyze conversation context' },
      { status: 500 }
    );
  }
}
