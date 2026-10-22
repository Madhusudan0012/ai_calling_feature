import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user';
import { createCall, updateCall, lastCallAt } from '@/lib/db';



const COOLDOWN_MS = 60_000;
const E164 = /^\+[1-9]\d{7,14}$/;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to get a call.' }, { status: 401 });
  }
  console.log('PHONE VALUE:', JSON.stringify(user.phone));
  if (!E164.test(user.phone)) {
    return NextResponse.json(
      { error: 'Your phone number is missing or invalid. Update it in your profile.' },
      { status: 400 }
    );
  }

  const last = lastCallAt(user.id);
  if (last && Date.now() - last < COOLDOWN_MS) {
    const retryAfter = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
    return NextResponse.json(
      { error: `Please wait ${retryAfter}s before requesting another call.`, retryAfter },
      { status: 429 }
    );
  }

  const call = createCall(user.id);

  try {
    const res = await fetch('https://api.bolna.ai/call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: process.env.BOLNA_AGENT_ID,
        recipient_phone_number: user.phone,
        user_data: { name: user.name, call_id: call.id },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Bolna error', res.status, detail);
      updateCall(call.id, { status: 'failed' });
      return NextResponse.json(
        { error: `Bolna ${res.status}: ${detail}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    updateCall(call.id, {
      status: 'queued',
      bolnaExecutionId: data.execution_id ?? data.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Call request failed', err);
    updateCall(call.id, { status: 'failed' });
    return NextResponse.json(
      { error: 'The calling service did not respond. Please try again.' },
      { status: 504 }
    );
  }
}