import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch all PPV templates for a creator
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId query parameter is required' }, { status: 400 });
    }

    const templates = await db.ppvTemplate.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching PPV templates:', error);
    return NextResponse.json({ error: 'Failed to fetch PPV templates' }, { status: 500 });
  }
}

// POST: Create or update a PPV template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      templateId,
      creatorId,
      name,
      description,
      price,
      pricingRules,
      messageText,
      mediaUrls,
      lockType,
      previewSeconds,
    } = body;

    const numericPrice = parseFloat(price) || 0;

    // Update existing template
    if (templateId) {
      const updatedTemplate = await db.ppvTemplate.update({
        where: { id: templateId },
        data: {
          name,
          description: description || null,
          price: numericPrice,
          pricingRules: pricingRules || [],
          messageText: messageText || '',
          mediaUrls: mediaUrls || [],
          lockType: lockType || 'single',
          previewSeconds: parseInt(previewSeconds) || 0,
        },
      });

      return NextResponse.json({
        message: 'PPV template updated successfully',
        template: updatedTemplate,
      });
    }

    // Create new template
    if (!creatorId || !name) {
      return NextResponse.json({ error: 'creatorId and name are required' }, { status: 400 });
    }

    const newTemplate = await db.ppvTemplate.create({
      data: {
        creatorId,
        name,
        description: description || null,
        price: numericPrice,
        pricingRules: pricingRules || [],
        messageText: messageText || '',
        mediaUrls: mediaUrls || [],
        lockType: lockType || 'single',
        previewSeconds: parseInt(previewSeconds) || 0,
      },
    });

    return NextResponse.json({
      message: 'PPV template created successfully',
      template: newTemplate,
    });
  } catch (error) {
    console.error('Error saving PPV template:', error);
    return NextResponse.json({ error: 'Failed to save PPV template' }, { status: 500 });
  }
}

// DELETE: Delete a PPV template
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'templateId query parameter is required' }, { status: 400 });
    }

    await db.ppvTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ message: 'PPV template deleted successfully' });
  } catch (error) {
    console.error('Error deleting PPV template:', error);
    return NextResponse.json({ error: 'Failed to delete PPV template' }, { status: 500 });
  }
}
