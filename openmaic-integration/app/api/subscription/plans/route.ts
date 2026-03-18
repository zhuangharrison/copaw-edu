import { NextResponse } from 'next/server';
import { PLANS, CREDIT_PACKS } from '@/lib/server/subscription/plans';

export async function GET() {
  return NextResponse.json({ plans: PLANS, creditPacks: CREDIT_PACKS });
}
