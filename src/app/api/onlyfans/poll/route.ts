import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

// GET: Poll authentication status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.ONLYFANS_API_KEY;
    const configPath = path.resolve(process.cwd(), 'prisma', 'auth_attempts.json');

    // Real API polling
    if (apiKey && apiKey !== 'your_onlyfansapi_key' && !attemptId.startsWith('auth_mock_')) {
      try {
        const response = await fetch(`https://app.onlyfansapi.com/api/authenticate/${attemptId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // If authenticated, permanently save to database
          if (data.status === 'authenticated' && data.session) {
            const agency = await db.agency.findFirst();
            if (agency) {
              const existing = await db.creator.findUnique({
                where: { username: data.session.username }
              });

              if (!existing) {
                await db.creator.create({
                  data: {
                    displayName: data.session.displayName || data.session.name || 'Verified Creator',
                    username: data.session.username,
                    authId: encrypt(data.session.auth_id),
                    sessCookie: encrypt(data.session.sess),
                    userAgent: data.session.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    xBcHeader: data.session.x_bc ? encrypt(data.session.x_bc) : null,
                    agencyId: agency.id,
                    status: 'ACTIVE',
                    avatarUrl: data.session.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.session.username}`
                  }
                });
              }
            }
          }

          return NextResponse.json({
            status: data.status, // 'pending', '2fa_required', 'authenticated', 'failed'
            errorMessage: data.error_message || null,
            errorCode: data.error_code || null,
            session: data.session ? {
              username: data.session.username,
              name: data.session.name
            } : null
          });
        }
      } catch (err: any) {
        console.warn('Real OnlyFansAPI polling failed, falling back to simulation:', err.message);
      }
    }

    // Simulated Polling Flow
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: 'No active session attempt found' }, { status: 404 });
    }

    const attempts = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const attempt = attempts[attemptId];

    if (!attempt) {
      return NextResponse.json({ error: 'Session attempt not found' }, { status: 404 });
    }

    attempt.pollCount = (attempt.pollCount || 0) + 1;

    // Transition status to simulate real user experience
    if (attempt.status === 'pending') {
      if (attempt.pollCount >= 2) {
        attempt.status = '2fa_required'; // simulate 2FA requirement on 2nd poll
      }
    }

    // Update session storage
    attempts[attemptId] = attempt;
    fs.writeFileSync(configPath, JSON.stringify(attempts, null, 2), 'utf8');

    return NextResponse.json({
      status: attempt.status, // 'pending', '2fa_required', 'authenticated', 'failed'
      errorMessage: attempt.errorMessage || null,
      errorCode: attempt.errorCode || null,
      session: attempt.status === 'authenticated' ? {
        username: attempt.username,
        name: attempt.displayName
      } : null
    });

  } catch (error: any) {
    console.error('Error in polling endpoint:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// PUT: Submit 2FA Code
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');
    const body = await request.json();
    const { code } = body;

    if (!attemptId || !code) {
      return NextResponse.json({ error: 'attemptId and code are required' }, { status: 400 });
    }

    const apiKey = process.env.ONLYFANS_API_KEY;
    const configPath = path.resolve(process.cwd(), 'prisma', 'auth_attempts.json');

    // Real API 2FA Submission
    if (apiKey && apiKey !== 'your_onlyfansapi_key' && !attemptId.startsWith('auth_mock_')) {
      try {
        const response = await fetch(`https://app.onlyfansapi.com/api/authenticate/${attemptId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ code })
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({ success: true, status: data.status });
        } else {
          const errData = await response.json();
          return NextResponse.json({ error: errData.error || 'Failed to submit 2FA' }, { status: response.status });
        }
      } catch (err: any) {
        console.warn('Real OnlyFansAPI 2FA submit failed, falling back to simulation:', err.message);
      }
    }

    // Simulated 2FA Submission
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: 'No active session attempt found' }, { status: 404 });
    }

    const attempts = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const attempt = attempts[attemptId];

    if (!attempt) {
      return NextResponse.json({ error: 'Session attempt not found' }, { status: 404 });
    }

    // Authenticate successfully upon receiving any 2FA code (simulated)
    attempt.status = 'authenticated';
    attempts[attemptId] = attempt;
    fs.writeFileSync(configPath, JSON.stringify(attempts, null, 2), 'utf8');

    // Permanently save new creator to database
    const agency = await db.agency.findFirst();
    if (agency) {
      const existing = await db.creator.findUnique({
        where: { username: attempt.username }
      });

      if (!existing) {
        await db.creator.create({
          data: {
            displayName: attempt.displayName,
            username: attempt.username,
            authId: encrypt(attempt.authId),
            sessCookie: encrypt(attempt.sessCookie),
            userAgent: attempt.userAgent,
            xBcHeader: attempt.xBcHeader ? encrypt(attempt.xBcHeader) : null,
            agencyId: agency.id,
            status: 'ACTIVE',
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${attempt.username}`
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: 'authenticated',
      message: '2FA verified successfully. Creator added to agency roster.'
    });

  } catch (error: any) {
    console.error('Error in submit 2FA endpoint:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
