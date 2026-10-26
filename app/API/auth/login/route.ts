import { NextResponse } from 'next/server';
import { COOKIE, cookieOptions, createToken, tenantIdFromCode, validCode } from '@/lib/auth';

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  const clean = typeof code === 'string' ? code.trim() : '';

  if (!clean || !validCode(clean)) {
    const loaded = (process.env.TENANT_ACCESS_CODES ?? '').split(',').filter((c) => c.trim()).length;
    console.log('Login failed. Access codes loaded:', loaded);
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Wrong access code.' }, { status: 401 });
  }

  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, createToken(tenantIdFromCode(clean)), cookieOptions);
    return res;
  } catch (err) {
    console.error('Login failed', err);
    return NextResponse.json({ error: 'Server is missing SESSION_SECRET.' }, { status: 500 });
  }
}