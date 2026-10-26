import { NextResponse } from 'next/server';
import { getTenant } from '@/lib/auth';

export async function GET() {
  return NextResponse.json({ tenant: !!(await getTenant()) });
}