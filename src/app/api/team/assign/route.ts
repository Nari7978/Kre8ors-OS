import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, creatorId } = body;

    if (!userId || !creatorId) {
      return NextResponse.json(
        { error: 'userId and creatorId are required fields' },
        { status: 400 }
      );
    }

    // Check if user and creator exist
    const userExists = await db.user.findUnique({ where: { id: userId } });
    const creatorExists = await db.creator.findUnique({ where: { id: creatorId } });

    if (!userExists || !creatorExists) {
      return NextResponse.json(
        { error: 'Specified User or Creator does not exist' },
        { status: 404 }
      );
    }

    // Find if the assignment already exists
    const existingAssignment = await db.chatterAssignment.findUnique({
      where: {
        userId_creatorId: {
          userId,
          creatorId,
        },
      },
    });

    if (existingAssignment) {
      // Unassign
      await db.chatterAssignment.delete({
        where: {
          id: existingAssignment.id,
        },
      });
      return NextResponse.json({ message: 'Assignment removed successfully', assigned: false });
    } else {
      // Assign
      const newAssignment = await db.chatterAssignment.create({
        data: {
          userId,
          creatorId,
        },
      });
      return NextResponse.json({ message: 'Assignment created successfully', assignment: newAssignment, assigned: true });
    }
  } catch (error) {
    console.error('Error modifying chatter assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update chatter assignment' },
      { status: 500 }
    );
  }
}
