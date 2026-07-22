import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const getMockLabelsPath = () => {
  const dir = path.join(process.cwd(), '.gemini');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'mock_post_labels.json');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(['Vip promo', 'Summer sets', 'Exclusive chats', 'Footage'], null, 2), 'utf8');
  }
  return file;
};

// GET: Fetch post labels (live API or mock fallback)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        const apiRes = await client.getPostLabels();
        if (apiRes && apiRes.data) {
          return NextResponse.json(apiRes.data);
        }
      } catch (err: any) {
        console.warn('GET /api/posts/labels OnlyFans API call failed, using mock labels:', err.message);
      }
    }

    const file = getMockLabelsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new post label
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, name } = body;

    if (!creatorId || !name) {
      return NextResponse.json({ error: 'creatorId and name are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        const apiRes = await client.createPostLabel(name);
        if (apiRes && apiRes.data) {
          return NextResponse.json(apiRes.data);
        }
      } catch (err: any) {
        console.warn('POST /api/posts/labels OnlyFans API failed, using mock label creator:', err.message);
      }
    }

    const file = getMockLabelsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.includes(name)) {
      data.push(name);
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    }

    return NextResponse.json({ success: true, name });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
