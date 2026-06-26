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

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, role' },
        { status: 400 }
      );
    }

    // Find the first agency in DB
    const agency = await db.agency.findFirst();
    if (!agency) {
      return NextResponse.json(
        { error: 'No agency registered in database' },
        { status: 500 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
        { status: 400 }
      );
    }

    // Create user
    const newUser = await db.user.create({
      data: {
        email,
        passwordHash: password, // In production, this would be hashed via bcrypt or similar
        name,
        role,
        agencyId: agency.id,
      },
    });

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt,
      assignments: [],
      stats: {
        totalRevenue: 0,
        totalShiftsCount: 0,
        totalDurationMinutes: 0,
        isShiftActive: false,
        activeShiftId: null,
      },
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}
