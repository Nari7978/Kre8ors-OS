import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// In-memory simple store for simulated payouts so they persist during session run
let mockPayoutsStore: Record<string, any[]> = {};

function getInitialPayouts(creatorId: string) {
  return [
    {
      id: `pay-1-${creatorId}`,
      creatorId,
      amount: 1450.00,
      payoutMethod: 'Bank Transfer (US ACH)',
      status: 'PROCESSED',
      requestedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
      processedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
      referenceId: 'REF-ACH-992104'
    },
    {
      id: `pay-2-${creatorId}`,
      creatorId,
      amount: 3200.00,
      payoutMethod: 'Paxum',
      status: 'PROCESSED',
      requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      processedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      referenceId: 'REF-PAX-330198'
    },
    {
      id: `pay-3-${creatorId}`,
      creatorId,
      amount: 1250.00,
      payoutMethod: 'Cosmopayment',
      status: 'PENDING',
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      processedAt: null,
      referenceId: 'REF-COS-448201'
    }
  ];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId query parameter is required' },
        { status: 400 }
      );
    }

    if (!mockPayoutsStore[creatorId]) {
      mockPayoutsStore[creatorId] = getInitialPayouts(creatorId);
    }

    return NextResponse.json(mockPayoutsStore[creatorId]);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { creatorId, amount, payoutMethod } = body;

    if (!creatorId || !amount || !payoutMethod) {
      return NextResponse.json(
        { error: 'creatorId, amount, and payoutMethod are required' },
        { status: 400 }
      );
    }

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const newPayout = {
      id: `pay-${Math.floor(Math.random() * 1000000)}-${creatorId}`,
      creatorId,
      amount: payoutAmount,
      payoutMethod,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      processedAt: null,
      referenceId: `REF-${payoutMethod.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`
    };

    if (!mockPayoutsStore[creatorId]) {
      mockPayoutsStore[creatorId] = getInitialPayouts(creatorId);
    }

    // Insert at front
    mockPayoutsStore[creatorId] = [newPayout, ...mockPayoutsStore[creatorId]];

    return NextResponse.json(newPayout);
  } catch (error) {
    console.error('Error creating payout:', error);
    return NextResponse.json(
      { error: 'Failed to request payout simulation' },
      { status: 500 }
    );
  }
}
