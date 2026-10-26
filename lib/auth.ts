import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE = 'tenant_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE,
};

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error('SESSION_SECRET is missing or too short');
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function tenantIdFromCode(code: string) {
  return createHash('sha256').update(code).digest('hex').slice(0, 12);
}

export function validCode(input: string): boolean {
  const codes = (process.env.TENANT_ACCESS_CODES ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  return codes.some((c) => same(input, c));
}

export function createToken(tenantId: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${tenantId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): { tenantId: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [tenantId, exp, sig] = parts;
  if (!same(sig, sign(`${tenantId}.${exp}`))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return { tenantId };
}

export async function getTenant() {
  try {
    const store = await cookies();
    return verifyToken(store.get(COOKIE)?.value);
  } catch {
    return null;
  }
}