import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all users with their assignments and shift logs
    const users = await db.user.findMany({
      include: {
        assignments: {
          include: {
            creator: true,
          },
        },
        shifts: true,
      },
      orderBy: {
        role: 'asc',
      },
    });

    // Process operators list to include custom calculated metadata
    const processedUsers = users.map((user) => {
      const activeShift = user.shifts.find((s) => s.endTime === null);
      const totalShiftRevenue = user.shifts.reduce((sum, s) => sum + Number(s.revenue), 0);
      const totalShiftDurationMinutes = user.shifts.reduce((sum, s) => {
        const start = new Date(s.startTime).getTime();
        const end = s.endTime ? new Date(s.endTime).getTime() : Date.now();
        return sum + Math.round((end - start) / (1000 * 60));
      }, 0);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        assignments: user.assignments.map((a) => ({
          assignmentId: a.id,
          creatorId: a.creatorId,
          creatorName: a.creator.displayName,
          creatorUsername: a.creator.username,
          creatorAvatar: a.creator.avatarUrl,
        })),
        stats: {
          totalRevenue: totalShiftRevenue,
          totalShiftsCount: user.shifts.length,
          totalDurationMinutes: totalShiftDurationMinutes,
          isShiftActive: !!activeShift,
          activeShiftId: activeShift ? activeShift.id : null,
        },
      };
    });

    return NextResponse.json(processedUsers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
