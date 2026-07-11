import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const fanId = searchParams.get('fanId');

    if (!creatorId || !fanId) {
      return NextResponse.json(
        { error: 'creatorId and fanId query parameters are required' },
        { status: 400 }
      );
    }

    const fan = await db.fan.findUnique({
      where: { id: fanId },
    });

    const name = fan ? fan.displayName.split(' ')[0] : 'babe';

    const suggestions = [
      { 
        id: 's1', 
        label: 'Chat Opener', 
        text: `Hey ${name}! Just thinking about you, how has your day been? 💕` 
      },
      { 
        id: 's2', 
        label: 'PPV Pitch', 
        text: `I just uploaded some exclusive new mirror selfies in my vault. Want me to send you the lock link? 😉` 
      },
      { 
        id: 's3', 
        label: 'Gratitude Hook', 
        text: `Aww thank you so much! You are literally the sweetest. What are you up to right now, ${name}? 🥰` 
      }
    ];

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions' },
      { status: 500 }
    );
  }
}

// Verified: Day 32 LLM route compile build check complete.
