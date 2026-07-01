import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Tone-specific reply templates for simulated AI suggestions
const TONE_TEMPLATES: Record<string, { openers: string[]; ppv: string[]; gratitude: string[]; reEngage: string[] }> = {
  flirty: {
    openers: [
      "Hey {name}! I was just lying in bed thinking about you… how's your night going? 💋",
      "Guess who just got out of the shower and thought of you first? 😏💕",
      "I've been waiting for you to say hi, {name}… don't keep me waiting 🥺",
    ],
    ppv: [
      "I just took something really special for you, {name}… want me to send it? It's 🔥",
      "I've got an exclusive set that only my favorites get to see. You're one of them 😉",
      "Just uploaded the spiciest content of the week to my vault. Want the private link? 💎",
    ],
    gratitude: [
      "Omg {name}, you are literally the sweetest!! I don't deserve you 🥰💕",
      "You always know how to make my day, {name}. Thank you so so much! 😘",
      "Stop being so amazing, {name}!! You're making me blush 🙈💕",
    ],
    reEngage: [
      "Hey stranger 👀 I haven't heard from you in a while, {name}… did you forget about me? 🥺",
      "I miss chatting with you, {name}! Come say hi, I've got something new for you 💋",
      "{name}! Where have you been?? I've been saving something special just for you 😏",
    ],
  },
  professional: {
    openers: [
      "Hi {name}! Thanks for subscribing — I really appreciate your support. How can I make your experience even better today?",
      "Welcome back, {name}! I just posted some new exclusive content that I think you'd really enjoy.",
      "Hey {name}, just wanted to check in and say thank you for being such a loyal supporter 🙏",
    ],
    ppv: [
      "Hi {name}, I've just released a premium content set that's available for a limited time. Would you like me to send you the preview?",
      "I've curated an exclusive collection that I think matches your interests, {name}. Shall I send the details?",
      "New premium drop just went live — it's some of my best work yet. Want me to share the link, {name}?",
    ],
    gratitude: [
      "Thank you so much for your generosity, {name}! Your support truly means the world to me.",
      "I really appreciate that, {name}. Supporters like you are the reason I love what I do!",
      "That's incredibly kind of you, {name}. Thank you — I'm so grateful! 🙏",
    ],
    reEngage: [
      "Hi {name}! It's been a while since we connected. I've been releasing some exciting new content — would love to catch you up!",
      "Hey {name}, just wanted to reach out and let you know about some exclusive content I've been working on. Hope you're doing well!",
      "Missing our conversations, {name}! I have some great new releases I think you'd love. Let me know if you're interested!",
    ],
  },
  casual: {
    openers: [
      "Heyyy {name}! What's good? 😊",
      "Yo {name}! Long time no chat, what's up? ✨",
      "Hey {name} 👋 Hope your day is going awesome!",
    ],
    ppv: [
      "Btw {name}, I just dropped some fire new content. Want me to slide it your way? 🔥",
      "Got some new stuff in the vault, {name}! Lmk if you wanna check it out 👀",
      "Just posted something special that I think you'd vibe with, {name}. Want the link? 💫",
    ],
    gratitude: [
      "Ayy thanks {name}!! You're the best fr fr 🙌",
      "No way, thank you so much {name}!! Made my whole day 😭💕",
      "You're actually the goat, {name}. Appreciate you!! 🐐💕",
    ],
    reEngage: [
      "Yooo {name}!! Where'd you go?? Come back and chat with me! 😄",
      "Haven't seen you around lately, {name}! What's been going on? Miss ya! 👋",
      "{name}!! It's been a min. I've got some cool new stuff, come check it out! 🎉",
    ],
  },
  'aggressive-sales': {
    openers: [
      "Hey {name}! Perfect timing — I've got an exclusive offer running RIGHT NOW that you don't want to miss 🚨",
      "{name}! You're one of my top supporters so I wanted to give you early access to my newest drop before anyone else 💎",
      "Good news, {name}! I'm running a flash deal just for my VIP supporters today ⚡",
    ],
    ppv: [
      "🚨 LIMITED TIME: {name}, I just dropped my most exclusive set ever. First 10 supporters get 50% off. Want in?",
      "{name}, this is selling FAST — my premium vault collection is almost sold out. Grab it before it's gone! 🔥",
      "EXCLUSIVE DEAL for you, {name}: unlock my newest content bundle at a special subscriber-only price. Don't sleep on this! 💰",
    ],
    gratitude: [
      "You're amazing, {name}!! As a thank you, I'm sending you something special in your DMs 🎁",
      "WOW {name}, that was so generous!! You just earned VIP status — special perks coming your way! 👑",
      "Incredible, {name}!! Because of your support, I'm unlocking a free bonus for you. Check your messages! 🎉",
    ],
    reEngage: [
      "⚡ {name}! You're about to miss out — I'm running my biggest sale of the month and it ends TONIGHT.",
      "{name}, comeback special just for you: 40% off my premium content for the next 24 hours. Don't miss it! 🔥",
      "🚨 {name}!! Special re-sub offer: come back now and get exclusive bonus content FREE. Limited spots! 💎",
    ],
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, fanId, tone = 'flirty', category = 'openers', recentMessages = [] } = body;

    if (!creatorId || !fanId) {
      return NextResponse.json(
        { error: 'creatorId and fanId are required' },
        { status: 400 }
      );
    }

    // Look up fan for personalization
    const fan = await db.fan.findUnique({
      where: { id: fanId },
    });

    const name = fan ? fan.displayName.split(' ')[0] : 'babe';
    const totalSpent = fan ? Number(fan.totalSpent) : 0;

    // Select tone templates
    const toneKey = TONE_TEMPLATES[tone] ? tone : 'flirty';
    const templates = TONE_TEMPLATES[toneKey];

    // Pick category
    const categoryKey = templates[category as keyof typeof templates] ? category : 'openers';
    const pool = templates[categoryKey as keyof typeof templates];

    // Generate 3 unique suggestions from the pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    // Analyze spending context for bonus suggestion
    let spendingContext = '';
    if (totalSpent > 500) {
      spendingContext = 'VIP whale — high spender, prioritize exclusive offers';
    } else if (totalSpent > 100) {
      spendingContext = 'Engaged supporter — warm lead for premium content';
    } else {
      spendingContext = 'Newer subscriber — focus on building rapport first';
    }

    const suggestions = selected.map((text, index) => ({
      id: `suggestion-${Date.now()}-${index}`,
      label: `${categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)} #${index + 1}`,
      text: text.replace(/{name}/g, name),
      tone: toneKey,
      category: categoryKey,
      confidence: Math.round(70 + Math.random() * 25),
    }));

    return NextResponse.json({
      suggestions,
      context: {
        fanName: name,
        totalSpent,
        spendingTier: spendingContext,
        activeTone: toneKey,
        messageHistoryLength: recentMessages.length,
      },
    });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI smart reply suggestions' },
      { status: 500 }
    );
  }
}
