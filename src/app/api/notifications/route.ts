import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch notifications for a creator
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId parameter is required' }, { status: 400 });
    }

    const notifications = await db.notification.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH: Mark notification(s) as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, creatorId, markAll = false } = body;

    if (markAll && creatorId) {
      // Mark all as read for this creator
      await db.notification.updateMany({
        where: { creatorId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE: Remove notification(s)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');
    const creatorId = searchParams.get('creatorId');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll && creatorId) {
      await db.notification.deleteMany({
        where: { creatorId },
      });
      return NextResponse.json({ success: true, message: 'All notifications cleared' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId parameter is required' }, { status: 400 });
    }

    await db.notification.delete({
      where: { id: notificationId },
    });

    return NextResponse.json({ success: true, deletedId: notificationId });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
