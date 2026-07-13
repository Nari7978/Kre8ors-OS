import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const getMockDataExportsPath = () => {
  const dir = path.join(process.cwd(), '.gemini');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'mock_onlyfans_exports.json');
  
  if (!fs.existsSync(file)) {
    const initialExports = [
      {
        id: 'export_1',
        type: 'messages',
        status: 'completed',
        downloadUrl: 'https://onlyfans-exports.s3.amazonaws.com/sophiasweet_messages_2026_07_01.zip',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days ago
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12 + 1000 * 60 * 15).toISOString()
      },
      {
        id: 'export_2',
        type: 'earnings',
        status: 'completed',
        downloadUrl: 'https://onlyfans-exports.s3.amazonaws.com/sophiasweet_earnings_2026_07_10.zip',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 8).toISOString()
      }
    ];
    fs.writeFileSync(file, JSON.stringify(initialExports, null, 2), 'utf8');
  }
  return file;
};

// GET: List exports or check status of single export
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const action = searchParams.get('action');
    const exportId = searchParams.get('exportId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId parameter is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({ where: { id: creatorId } });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        
        if (action === 'status' && exportId) {
          const status = await client.getDataExportStatus(exportId);
          return NextResponse.json(status);
        } else {
          const list = await client.listDataExports();
          return NextResponse.json(list);
        }
      } catch (err: any) {
        console.warn('GET /api/settings/exports OnlyFans API call failed, using mock:', err.message);
      }
    }

    const file = getMockDataExportsPath();
    const exports = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (action === 'status' && exportId) {
      const exp = exports.find((e: any) => e.id === exportId);
      if (!exp) return NextResponse.json({ error: 'Export record not found' }, { status: 404 });
      return NextResponse.json(exp);
    }

    return NextResponse.json(exports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create export or Start export
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, action, type, exportId } = body;

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({ where: { id: creatorId } });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        if (action === 'create') {
          const res = await client.createDataExport();
          return NextResponse.json(res);
        } else if (action === 'start' && exportId) {
          const res = await client.startDataExport(exportId);
          return NextResponse.json(res);
        }
      } catch (err: any) {
        console.warn('POST /api/settings/exports OnlyFans API call failed, using mock:', err.message);
      }
    }

    const file = getMockDataExportsPath();
    const exports = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (action === 'create') {
      const newExport = {
        id: `export_${Date.now()}`,
        type: type || 'messages',
        status: 'pending',
        downloadUrl: '',
        createdAt: new Date().toISOString(),
        completedAt: ''
      };
      exports.unshift(newExport);
      fs.writeFileSync(file, JSON.stringify(exports, null, 2), 'utf8');
      return NextResponse.json({ success: true, data: newExport });
    }

    if (action === 'start' && exportId) {
      const exp = exports.find((e: any) => e.id === exportId);
      if (exp) {
        exp.status = 'processing';
        fs.writeFileSync(file, JSON.stringify(exports, null, 2), 'utf8');
        
        // Auto-complete mock export after 5 seconds asynchronously
        setTimeout(() => {
          try {
            const currentExports = JSON.parse(fs.readFileSync(file, 'utf8'));
            const matched = currentExports.find((e: any) => e.id === exportId);
            if (matched && matched.status === 'processing') {
              matched.status = 'completed';
              matched.downloadUrl = `https://onlyfans-exports.s3.amazonaws.com/sophiasweet_${matched.type}_${Date.now()}.zip`;
              matched.completedAt = new Date().toISOString();
              fs.writeFileSync(file, JSON.stringify(currentExports, null, 2), 'utf8');
            }
          } catch (e) {
            console.error('Error auto-completing mock data export:', e);
          }
        }, 5000);
      }
      return NextResponse.json({ success: true, data: exp });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Cancel/Delete export
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const exportId = searchParams.get('exportId');

    if (!creatorId || !exportId) {
      return NextResponse.json({ error: 'creatorId and exportId parameters are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({ where: { id: creatorId } });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        await client.cancelDataExport(exportId);
      } catch (err: any) {
        console.warn('DELETE /api/settings/exports OnlyFans API call failed, using mock:', err.message);
      }
    }

    const file = getMockDataExportsPath();
    let exports = JSON.parse(fs.readFileSync(file, 'utf8'));
    exports = exports.filter((e: any) => e.id !== exportId);

    fs.writeFileSync(file, JSON.stringify(exports, null, 2), 'utf8');
    return NextResponse.json({ success: true, data: exports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
