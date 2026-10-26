import { NextResponse } from 'next/server';
import { startCall,BolnaError } from '@/lib/bolna';
import { getAgentId } from '@/lib/agentStore';
import { createCall, updateCall, lastCallAt } from '@/lib/db';

const COOLDOWN_MS = process.env.DEMO_MODE === 'true' ? 10_000 : 60_000;
const E164 = /^\+[1-9]\d{7,14}$/;

function normalize(input: string) {
  const digits = input.replace(/[^\d+]/g, '');
  if (/^\d{10}$/.test(digits)) return `+91${digits}`;
  if (/^91\d{10}$/.test(digits)) return `+${digits}`;
  return digits;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = normalize(String(body.phone ?? ''));

  if (!body.consent) {
    return NextResponse.json({ error: 'Please agree to receive an AI call.' }, { status: 400 });
  }
  if (!E164.test(phone)) {
    return NextResponse.json({ error: 'Enter a valid phone number, like 9876543210.' }, { status: 400 });
  }

  const last = lastCallAt(phone);
  if (last && Date.now() - last < COOLDOWN_MS) {
    const retryAfter = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
    return NextResponse.json(
      { error: `Please wait ${retryAfter}s before calling this number again.`, retryAfter },
      { status: 429 }
    );
  }

  const call = createCall(phone);

  if (process.env.DEMO_MODE === 'true') {
    await new Promise((r) => setTimeout(r, 1500));
    updateCall(call.id, { status: 'demo' });
    return NextResponse.json({ ok: true, demo: true });
  }

  const agentId = await getAgentId();
  if (!agentId) {
    return NextResponse.json({ error: 'No agent yet. Create one at /agent first.' }, { status: 400 });
  }

  try {
    const data = await startCall(agentId, phone, { call_id: call.id });
    updateCall(call.id, { status: 'queued', bolnaExecutionId: data.execution_id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Call failed', err);
    updateCall(call.id, { status: 'failed' });
    const message =
      err instanceof BolnaError && (err.status === 400 || err.status === 422)
        ? err.message
        : 'We could not start the call. Please try again in a moment.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}