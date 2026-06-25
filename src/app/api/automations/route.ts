import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch all automation rules for a creator
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const rules = await db.automationRule.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 });
  }
}

// POST: Toggle rule isActive state OR create a new rule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ruleId,
      isActive,
      creatorId,
      name,
      triggerType,
      conditions,
      actionType,
      actionData,
    } = body;

    // Toggle rule
    if (ruleId !== undefined && isActive !== undefined) {
      const updatedRule = await db.automationRule.update({
        where: { id: ruleId },
        data: { isActive },
      });

      return NextResponse.json({
        message: 'Rule status updated successfully',
        rule: updatedRule,
      });
    }

    // Create new rule
    if (!creatorId || !name || !triggerType || !actionType) {
      return NextResponse.json({ error: 'Missing required creation fields' }, { status: 400 });
    }

    const parsedConditions = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
    const parsedActionData = typeof actionData === 'string' ? JSON.parse(actionData) : actionData;

    const newRule = await db.automationRule.create({
      data: {
        creatorId,
        name,
        triggerType,
        conditions: parsedConditions || {},
        actionType,
        actionData: parsedActionData || {},
        isActive: true,
      },
    });

    return NextResponse.json({
      message: 'Rule created successfully',
      rule: newRule,
    });
  } catch (error) {
    console.error('Error handling automations POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
