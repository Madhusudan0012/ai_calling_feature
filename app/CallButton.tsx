'use client';

import { useEffect, useRef, useState } from 'react';

type State = 'idle' | 'calling' | 'sent' | 'error';

export default function CallButton() {
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function startCooldown(seconds: number) {
    setCooldown(seconds);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function requestCall() {
    setState('calling');
    setMessage('');
    try {
      const res = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, consent }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setState('sent');
        setMessage(
          data.demo
            ? 'Demo mode: no real call was placed.'
            : 'Your phone will ring in a few seconds. Pick up to talk.'
        );
        startCooldown(data.demo ? 10 : 60);
      } else {
        setState('error');
        setMessage(data.error ?? 'Something went wrong. Please try again.');
        if (data.retryAfter) startCooldown(data.retryAfter);
      }
    } catch {
      setState('error');
      setMessage('No connection. Check your internet and try again.');
    }
  }

  const busy = state === 'calling' || cooldown > 0;
  const ringing = state === 'calling' || state === 'sent';
  const label =
    state === 'calling' ? 'Calling…' :
    cooldown > 0 ? `${cooldown}s` :
    'Call now';

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-5">
      <label className="flex w-full flex-col gap-1">
        Your phone number
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-gray-400 bg-transparent p-3 text-lg"
        />
        <span className="text-sm opacity-70">10-digit Indian number, or full number with country code.</span>
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        I agree to receive a call from an AI assistant on this number.
      </label>

      <button
        type="button"
        onClick={requestCall}
        disabled={busy || !phone.trim() || !consent}
        aria-busy={state === 'calling'}
        className="relative flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full bg-foreground text-xl font-semibold text-background transition hover:scale-105 active:scale-95 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-500 disabled:cursor-default disabled:opacity-60 disabled:hover:scale-100"
      >
        {ringing && (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full border-4 border-amber-500 motion-reduce:animate-none"
          />
        )}
        <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true" fill="currentColor">
          <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02L6.6 10.8Z" />
        </svg>
        <span>{label}</span>
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`min-h-12 text-center text-base ${state === 'error' ? 'text-red-600' : ''}`}
      >
        {message}
      </p>
    </div>
  );
}