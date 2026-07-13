import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const getMockBlockedUsersPath = () => {
  const dir = path.join(process.cwd(), '.gemini');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'mock_onlyfans_blocked_users.json');
  
  if (!fs.existsSync(file)) {
    const initialBlocked = [
      {
        id: 'blocked_1',
        username: 'chargeback_charlie',
        displayName: 'Charlie Payback',
        avatarUrl: '',
        type: 'block',
        reason: 'Repeated credit card chargebacks on premium unlock purchases.',
        blockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() // 5 days ago
      },
      {
        id: 'blocked_2',
        username: 'leaker_anon',
        displayName: 'Anonymous Leaker',
        avatarUrl: '',
        type: 'block',
        reason: 'Flagged by watermark tracking for distributing exclusive media.',
        blockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
      },
      {
        id: 'blocked_3',
        username: 'harasser_99',
        displayName: 'Toxic Subscriber',
        avatarUrl: '',
        type: 'restrict',
        reason: 'Inappropriate and harassing direct messages.',
        blockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      }
    ];
    fs.writeFileSync(file, JSON.stringify(initialBlocked, null, 2), 'utf8');
  }
  return file;
};

// GET: List blocked/restricted users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const file = getMockBlockedUsersPath();
    const blocked = JSON.parse(fs.readFileSync(file, 'utf8'));
    return NextResponse.json(blocked);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Block/Restrict a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, username, displayName, type, reason } = body;

    if (!creatorId || !username) {
      return NextResponse.json({ error: 'creatorId and username are required' }, { status: 400 });
    }

    const file = getMockBlockedUsersPath();
    const blocked = JSON.parse(fs.readFileSync(file, 'utf8'));

    // Check if already blocked
    if (blocked.some((b: any) => b.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ error: 'User is already blocked/restricted' }, { status: 400 });
    }

    const newBlocked = {
      id: `blocked_${Date.now()}`,
      username: username.replace('@', '').trim().toLowerCase(),
      displayName: displayName || username,
      avatarUrl: '',
      type: type || 'block',
      reason: reason || 'Blocked by administrator',
      blockedAt: new Date().toISOString()
    };

    blocked.unshift(newBlocked);
    fs.writeFileSync(file, JSON.stringify(blocked, null, 2), 'utf8');

    return NextResponse.json({ success: true, data: blocked });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Unblock a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const blockedId = searchParams.get('blockedId');

    if (!creatorId || !blockedId) {
      return NextResponse.json({ error: 'creatorId and blockedId parameters are required' }, { status: 400 });
    }

    const file = getMockBlockedUsersPath();
    let blocked = JSON.parse(fs.readFileSync(file, 'utf8'));
    blocked = blocked.filter((b: any) => b.id !== blockedId);

    fs.writeFileSync(file, JSON.stringify(blocked, null, 2), 'utf8');
    return NextResponse.json({ success: true, data: blocked });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
