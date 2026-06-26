import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all shifts logs with associated users
    const shifts = await db.shiftLog.findMany({
      include: {
        user: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    const performanceMap: Record<string, {
      id: string;
      name: string;
      email: string;
      role: string;
      totalShifts: number;
      totalHours: number;
      totalRevenue: number;
    }> = {};

    shifts.forEach((shift) => {
      const user = shift.user;
      if (!user) return;

      if (!performanceMap[user.id]) {
        performanceMap[user.id] = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalShifts: 0,
          totalHours: 0,
          totalRevenue: 0,
        };
      }

      const perf = performanceMap[user.id];
      perf.totalShifts += 1;
      perf.totalRevenue += Number(shift.revenue || 0);

      if (shift.endTime) {
        const durationMs = new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        perf.totalHours += durationHours;
      } else {
        // Active shift duration so far
        const durationMs = new Date().getTime() - new Date(shift.startTime).getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        perf.totalHours += durationHours;
      }
    });

    const performanceArray = Object.values(performanceMap).map((p) => ({
      ...p,
      averageRevenuePerShift: p.totalShifts > 0 ? p.totalRevenue / p.totalShifts : 0,
      averageRevenuePerHour: p.totalHours > 0 ? p.totalRevenue / p.totalHours : 0,
    }));

    return NextResponse.json(performanceArray);
  } catch (error) {
    console.error('Error fetching operator performance analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operator analytics' },
      { status: 500 }
    );
  }
}
