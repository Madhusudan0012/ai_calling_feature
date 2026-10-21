import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { findByExecutionId, updateCall } from '@/lib/db';

export const runtime = 'nodejs';

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret') ?? '';
  if (!safeEqual(secret, process.env.BOLNA_WEBHOOK_SECRET ?? '')) {
    return new NextResponse('forbidden', { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ ok: true });

  const executionId = payload.id ?? payload.execution_id;
  const call = executionId ? findByExecutionId(executionId) : undefined;

  if (call) {
    updateCall(call.id, {
      status: payload.status ?? call.status,
      transcript: payload.transcript,
      durationSec: payload.conversation_duration,
      rawPayload: payload,
    });
    // TODO: save the transcript to your database / playbook here.
  }

  return NextResponse.json({ ok: true });
}