import { NextResponse } from 'next/server';
import { readdirSync } from 'fs';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available.' }, { status: 404 });
  }

  const cwd = process.cwd();
  let envFiles: string[] = [];
  try {
    envFiles = readdirSync(cwd).filter((f) => f.toLowerCase().includes('env'));
  } catch {}

  return NextResponse.json({
    folderRunningFrom: cwd,
    envFilesInThatFolder: envFiles,
    seen: {
      TENANT_ACCESS_CODES: !!process.env.TENANT_ACCESS_CODES,
      SESSION_SECRET_length: process.env.SESSION_SECRET?.length ?? 0,
      BOLNA_API_KEY: !!process.env.BOLNA_API_KEY,
      DEMO_PHONE: !!process.env.DEMO_PHONE,
    },
  });
}