import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch shift logs and active shift status
export async function GET() {
  try {
    // Find the first chatter to act as the current logged-in user in this local workspace
    const user = await db.user.findFirst({
      where: { role: 'CHATTER' },
    });

    if (!user) {
      return NextResponse.json({ error: 'No chatter user found' }, { status: 404 });
    }

    // Find active shift
    const activeShift = await db.shiftLog.findFirst({
      where: {
        userId: user.id,
        endTime: null,
      },
    });

    // Find completed shift logs
    const completedShifts = await db.shiftLog.findMany({
      where: {
        userId: user.id,
        endTime: { not: null },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      activeShift,
      completedShifts,
    });
  } catch (error) {
    console.error('Error fetching shift logs:', error);
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
  }
}

// POST: Manage shift actions (start, end, simulate_earning)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, amount = 0 } = body;

    const user = await db.user.findFirst({
      where: { role: 'CHATTER' },
    });

    if (!user) {
      return NextResponse.json({ error: 'No chatter user found' }, { status: 404 });
    }

    if (action === 'start') {
      // Ensure no active shift exists
      const existing = await db.shiftLog.findFirst({
        where: {
          userId: user.id,
          endTime: null,
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'Shift already active', shift: existing }, { status: 400 });
      }

      const newShift = await db.shiftLog.create({
        data: {
          userId: user.id,
          startTime: new Date(),
          revenue: 0.00,
        },
      });

      return NextResponse.json({ message: 'Shift started successfully', shift: newShift });
    }

    if (action === 'end') {
      const activeShift = await db.shiftLog.findFirst({
        where: {
          userId: user.id,
          endTime: null,
        },
      });

      if (!activeShift) {
        return NextResponse.json({ error: 'No active shift found' }, { status: 400 });
      }

      const endedShift = await db.shiftLog.update({
        where: { id: activeShift.id },
        data: {
          endTime: new Date(),
        },
      });

      return NextResponse.json({ message: 'Shift ended successfully', shift: endedShift });
    }

    if (action === 'simulate_earning') {
      const activeShift = await db.shiftLog.findFirst({
        where: {
          userId: user.id,
          endTime: null,
        },
      });

      if (!activeShift) {
        return NextResponse.json({ error: 'No active shift to credit earnings to' }, { status: 400 });
      }

      const updatedShift = await db.shiftLog.update({
        where: { id: activeShift.id },
        data: {
          revenue: {
            increment: amount,
          },
        },
      });

      return NextResponse.json({ message: 'Earning simulated successfully', shift: updatedShift });
    }

    return NextResponse.json({ error: 'Invalid shift action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling shift action:', error);
    return NextResponse.json({ error: 'Failed to process shift action' }, { status: 500 });
  }
}
