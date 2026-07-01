import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simulated preference storage in memory
let preferences = {
  NEW_SUBSCRIBER: { inApp: true, email: false, webhook: true },
  TIP: { inApp: true, email: true, webhook: true },
  PPV_UNLOCK: { inApp: true, email: false, webhook: true },
  CHAT_MESSAGE: { inApp: true, email: false, webhook: false },
  SYSTEM_ALERT: { inApp: true, email: true, webhook: true },
};

export async function GET() {
  try {
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Update preferences in-memory
    preferences = {
      ...preferences,
      ...body,
    };

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
