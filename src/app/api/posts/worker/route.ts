import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ success: true, message: 'Queue worker initialized' });
  } catch (error) {
    console.error('Queue worker error:', error);
    return NextResponse.json({ error: 'Worker execution failed' }, { status: 500 });
  }
}
