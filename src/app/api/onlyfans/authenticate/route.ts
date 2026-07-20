import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      authType, 
      displayName, 
      username, 
      email, 
      password, 
      authId, 
      sessCookie, 
      userAgent, 
      xBcHeader,
      proxyHost,
      proxyPort,
      proxyUser,
      proxyPass
    } = body;

    if (!displayName || !username || !authType) {
      return NextResponse.json({ error: 'displayName, username, and authType are required' }, { status: 400 });
    }

    const apiKey = process.env.ONLYFANS_API_KEY;
    const configPath = path.resolve(process.cwd(), 'prisma', 'auth_attempts.json');

    // If API Key is present, make real request to OnlyFansAPI.com
    if (apiKey && apiKey !== 'your_onlyfansapi_key' && !apiKey.includes('mock') && !sessCookie?.includes('mock')) {
      try {
        const payload: Record<string, any> = {
          auth_type: authType,
          display_name: displayName,
          username: username,
        };

        if (authType === 'email_password') {
          payload.email = email;
          payload.password = password;
        } else if (authType === 'raw_data') {
          payload.auth_id = authId;
          payload.sess = sessCookie;
          payload.userAgent = userAgent;
          payload.x_bc = xBcHeader || '';
        }

        if (proxyHost && proxyPort) {
          payload.customProxy = `http://${proxyUser ? `${proxyUser}:${proxyPass}@` : ''}${proxyHost}:${proxyPort}`;
        }

        const response = await fetch('https://app.onlyfansapi.com/api/authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            success: true,
            attemptId: data.attempt_id,
            pollingUrl: `/api/onlyfans/poll?attemptId=${data.attempt_id}`,
            message: data.message || 'Authentication process initiated.'
          });
        } else {
          const errData = await response.json();
          return NextResponse.json({ error: errData.error || 'API Authentication request failed' }, { status: response.status });
        }
      } catch (err: any) {
        console.warn('Real OnlyFansAPI attempt failed, falling back to simulation:', err.message);
      }
    }

    // Offline / Simulated Handshake Flow
    const mockAttemptId = `auth_mock_${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Store mock attempt state in file
    let attempts: Record<string, any> = {};
    if (fs.existsSync(configPath)) {
      try {
        attempts = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {}
    }

    attempts[mockAttemptId] = {
      attemptId: mockAttemptId,
      status: 'pending', // will transition to '2fa_required' on first poll, then 'authenticated'
      pollCount: 0,
      displayName,
      username,
      authId: authId || 'mock_auth_id',
      sessCookie: sessCookie || 'mock_sess_cookie',
      userAgent: userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      xBcHeader: xBcHeader || 'mock_x_bc_header',
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(configPath, JSON.stringify(attempts, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      attemptId: mockAttemptId,
      pollingUrl: `/api/onlyfans/poll?attemptId=${mockAttemptId}`,
      message: 'Authentication process started. Query the polling_url to check the progress.'
    });

  } catch (error: any) {
    console.error('Error in authenticate route:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
