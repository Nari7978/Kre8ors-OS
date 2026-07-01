import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory template storage (simulated database)
const templates: Map<string, {
  id: string;
  name: string;
  tone: string;
  category: string;
  promptText: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}> = new Map();

// Seed with default templates
const defaults = [
  {
    id: 'tpl-default-1',
    name: 'Warm Welcome',
    tone: 'flirty',
    category: 'openers',
    promptText: 'Hey {name}! Welcome to my page 💕 I\'m so happy you\'re here. Tell me about yourself!',
    isDefault: true,
    createdAt: new Date('2026-06-01').toISOString(),
    updatedAt: new Date('2026-06-01').toISOString(),
  },
  {
    id: 'tpl-default-2',
    name: 'Exclusive Content Tease',
    tone: 'aggressive-sales',
    category: 'ppv',
    promptText: '🚨 EXCLUSIVE DROP: {name}, I just released my most exclusive content set. Limited to my top supporters — want first access?',
    isDefault: true,
    createdAt: new Date('2026-06-01').toISOString(),
    updatedAt: new Date('2026-06-01').toISOString(),
  },
  {
    id: 'tpl-default-3',
    name: 'Thank You Follow-Up',
    tone: 'professional',
    category: 'gratitude',
    promptText: 'Thank you so much for your support, {name}! It truly means the world. As a token of appreciation, I\'d love to share something special with you.',
    isDefault: true,
    createdAt: new Date('2026-06-01').toISOString(),
    updatedAt: new Date('2026-06-01').toISOString(),
  },
];

// Initialize defaults
defaults.forEach((tpl) => templates.set(tpl.id, tpl));

export async function GET() {
  try {
    const allTemplates = Array.from(templates.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      templates: allTemplates,
      total: allTemplates.length,
    });
  } catch (error) {
    console.error('Error fetching AI templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, tone, category, promptText } = body;

    if (!name || !promptText) {
      return NextResponse.json(
        { error: 'name and promptText are required' },
        { status: 400 }
      );
    }

    const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const template = {
      id,
      name: name.trim(),
      tone: tone || 'flirty',
      category: category || 'openers',
      promptText: promptText.trim(),
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    templates.set(id, template);

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating AI template:', error);
    return NextResponse.json(
      { error: 'Failed to create AI template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template id is required' },
        { status: 400 }
      );
    }

    const template = templates.get(id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 403 }
      );
    }

    templates.delete(id);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting AI template:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI template' },
      { status: 500 }
    );
  }
}
