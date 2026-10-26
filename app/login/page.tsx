'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push('/agent');
        router.refresh();
        return;
      }
      setMsg(data.error ?? 'Could not log in.');
    } catch {
      setMsg('No connection. Try again.');
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-gray-900">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold">Tenant login</h1>
        <p className="mt-1 mb-5 opacity-70">
          Enter your access code to create and manage your AI agents.
        </p>

        <form onSubmit={login} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            Access code
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full rounded-lg border border-gray-400 bg-white p-3 pr-12 text-gray-900"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide access code' : 'Show access code'}
                aria-pressed={show}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-700 hover:bg-brand focus-visible:outline-2 focus-visible:outline-gray-900"
              >
                {show ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <path d="M1 1l22 22" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="rounded-lg bg-brand p-3 font-semibold text-gray-900 hover:brightness-95 disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Log in'}
          </button>
        </form>

        <p role="status" aria-live="polite" className="mt-3 min-h-6 text-red-600">{msg}</p>

        <Link href="/" className="mt-2 inline-block text-sm underline opacity-70 hover:opacity-100">
          ← Back to AI Calling
        </Link>
      </div>
    </main>
  );
}