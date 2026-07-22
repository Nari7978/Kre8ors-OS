import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface PostComment {
  id: string;
  postId: string;
  text: string;
  username: string;
  createdAt: string;
}

const getMockCommentsPath = () => {
  const dir = path.join(process.cwd(), '.gemini');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'mock_post_comments.json');
  if (!fs.existsSync(file)) {
    const initialComments: PostComment[] = [
      { id: 'c1', postId: 'all', text: 'You look amazing in this set! ❤️', username: 'johnny_rich', createdAt: new Date().toISOString() },
      { id: 'c2', postId: 'all', text: 'Stunning! Can\'t wait to unlock the PPV set!', username: 'crypto_boss', createdAt: new Date().toISOString() },
      { id: 'c3', postId: 'all', text: 'Beautiful pictures, looking forward to next posts!', username: 'silent_buyer', createdAt: new Date().toISOString() }
    ];
    fs.writeFileSync(file, JSON.stringify(initialComments, null, 2), 'utf8');
  }
  return file;
};

// GET: Fetch post comments (live API or mock fallback)
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
        const apiRes = await client.getPostComments();
        if (apiRes && apiRes.data) {
          return NextResponse.json(apiRes.data);
        }
      } catch (err: any) {
        console.warn('GET /api/posts/comments OnlyFans API call failed, using mock comments:', err.message);
      }
    }

    const file = getMockCommentsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add comment to a post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, postId, text } = body;

    if (!creatorId || !text) {
      return NextResponse.json({ error: 'creatorId and text are required' }, { status: 400 });
    }

    const creator = await db.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator && process.env.ONLYFANS_API_KEY && !process.env.ONLYFANS_API_KEY.includes('mock') && !creator.sessCookie.includes('mock')) {
      try {
        const { OnlyFansApiClient } = require('@/lib/onlyfans-api');
        const client = new OnlyFansApiClient(creator.username);
        const apiRes = await client.createPostComment(postId || 'all', text);
        if (apiRes && apiRes.data) {
          return NextResponse.json(apiRes.data);
        }
      } catch (err: any) {
        console.warn('POST /api/posts/comments OnlyFans API failed, using mock comment creator:', err.message);
      }
    }

    const file = getMockCommentsPath();
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as PostComment[];
    
    const newComment: PostComment = {
      id: `c_${Math.floor(Math.random() * 1000000)}`,
      postId: postId || 'all',
      text,
      username: creator?.username || 'you',
      createdAt: new Date().toISOString()
    };

    data.push(newComment);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json(newComment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
