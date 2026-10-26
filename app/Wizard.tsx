'use client';

import { useEffect, useRef, useState } from 'react';

type Agent = { id: string; name: string; status: string; createdAt: string };
type CallState = 'idle' | 'calling' | 'sent' | 'error';

const field = 'w-full rounded-lg border border-gray-400 bg-white p-3 text-gray-900';
const primary = 'rounded-lg bg-brand p-3 font-semibold text-gray-900 hover:brightness-95 disabled:opacity-50';
const secondary = 'rounded-lg border border-gray-400 bg-white p-3 text-gray-900 disabled:opacity-50';
const steps = ['Agent', 'Phone', 'Call'];

export default function Wizard() {
  const [step, setStep] = useState(1);

  // Step 1: agent
  const [secret, setSecret] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [agentMsg, setAgentMsg] = useState('');
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('LinkModus Assistant');
  const [welcomeMessage, setWelcomeMessage] = useState(
    'Hi! This is an AI assistant calling from LinkModus. How can I help you today?'
  );
  const [prompt, setPrompt] = useState(
    'You are a friendly AI assistant. Say you are an AI. Keep every reply under two sentences. Help the person with their question, then end the call politely.'
  );
  const [creating, setCreating] = useState(false);

  // Step 2: phone
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);

  // Step 3: call
  const [callState, setCallState] = useState<CallState>('idle');
  const [callMsg, setCallMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const authHeaders = { 'Content-Type': 'application/json', 'x-admin-secret': secret };
  const selectedAgent = agents.find((a) => a.id === selectedId);

  async function loadAgents() {
    setLoadingAgents(true);
    setAgentMsg('');
    try {
      const res = await fetch('/api/agent', { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAgents(data.agents ?? []);
        setSelectedId(data.selectedId ?? null);
        if (!data.agents?.length) {
          setAgentMsg('No agents in your Bolna account yet. Create one below.');
          setShowCreate(true);
        }
      } else {
        setAgentMsg(data.error ?? 'Could not load agents.');
      }
    } catch {
      setAgentMsg('No connection. Try again.');
    }
    setLoadingAgents(false);
  }

  async function createAgent() {
    setCreating(true);
    setAgentMsg('');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name, welcomeMessage, prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowCreate(false);
        await loadAgents();
        setAgentMsg('Agent created in Bolna and selected.');
      } else {
        setAgentMsg(data.error ?? 'Something went wrong.');
      }
    } catch {
      setAgentMsg('No connection. Try again.');
    }
    setCreating(false);
  }

  async function selectAgent(id: string) {
    const res = await fetch('/api/agent', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ agentId: id }),
    });
    if (res.ok) setSelectedId(id);
    else setAgentMsg('Could not select that agent.');
  }

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
    setCallState('calling');
    setCallMsg('');
    try {
      const res = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, consent }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setCallState('sent');
        setCallMsg(
          data.demo
            ? 'Demo mode: no real call was placed.'
            : 'Your phone will ring in a few seconds. Pick up to talk.'
        );
        startCooldown(data.demo ? 10 : 60);
      } else {
        setCallState('error');
        setCallMsg(data.error ?? 'Something went wrong. Please try again.');
        if (data.retryAfter) startCooldown(data.retryAfter);
      }
    } catch {
      setCallState('error');
      setCallMsg('No connection. Check your internet and try again.');
    }
  }

  const busy = callState === 'calling' || cooldown > 0;
  const ringing = callState === 'calling' || callState === 'sent';
  const callLabel = callState === 'calling' ? 'Calling…' : cooldown > 0 ? `${cooldown}s` : 'Call now';

  return (
    <div className="flex flex-col gap-8">
      {/* Progress */}
      <ol className="flex items-center justify-center gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  active || done ? 'bg-brand text-gray-900' : 'border border-gray-400 text-gray-900'
                }`}
              >
                {done ? '✓' : n}
              </span>
              <span className={active ? 'font-semibold' : 'opacity-60'}>{label}</span>
              {n < steps.length && <span className="h-px w-6 bg-gray-400" />}
            </li>
          );
        })}
      </ol>

      {/* Step 1 */}
      {step === 1 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Step 1: Choose your AI agent</h1>
          <p className="opacity-70">Enter your admin secret, then load your agents from Bolna or create a new one.</p>

          <label className="flex flex-col gap-1">
            Admin secret
            <input className={field} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
          </label>

          <button type="button" className={secondary} onClick={loadAgents} disabled={!secret || loadingAgents}>
            {loadingAgents ? 'Loading…' : 'Load my agents from Bolna'}
          </button>

          {agentMsg && <p role="status" aria-live="polite" className="break-words">{agentMsg}</p>}

          <ul className="flex flex-col gap-2">
            {agents.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-400 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="truncate text-xs opacity-60">{a.id}</p>
                </div>
                {a.id === selectedId ? (
                  <span className="shrink-0 rounded-full bg-brand px-3 py-1 text-sm font-semibold text-gray-900">
                    Selected
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => selectAgent(a.id)}
                    className="shrink-0 rounded-lg bg-brand px-3 py-1 font-medium text-gray-900 hover:brightness-95"
                  >
                    Select
                  </button>
                )}
              </li>
            ))}
          </ul>

          <button type="button" className={secondary} onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Hide the create form' : 'Create a new agent'}
          </button>

          {showCreate && (
            <div className="flex flex-col gap-4 rounded-lg border border-gray-400 p-4">
              <label className="flex flex-col gap-1">
                Agent name
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                Welcome message
                <input className={field} value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                System prompt
                <textarea className={field} rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              </label>
              <button
                type="button"
                className={`${primary} flex items-center justify-center gap-2`}
                onClick={createAgent}
                disabled={creating || !secret}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {creating ? 'Creating…' : 'Create agent in Bolna'}
              </button>
            </div>
          )}

          <button type="button" className={primary} onClick={() => setStep(2)} disabled={!selectedId}>
            Next: phone number
          </button>
        </section>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <section className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Step 2: Who should we call?</h1>

          <label className="flex flex-col gap-1">
            Phone number
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${field} text-lg`}
            />
            <span className="text-sm opacity-70">10-digit Indian number, or full number with country code.</span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-green-500"
            />
            I agree to receive a call from an AI assistant on this number.
          </label>

          <div className="flex gap-3">
            <button type="button" className={secondary} onClick={() => setStep(1)}>Back</button>
            <button
              type="button"
              className={`${primary} flex-1`}
              onClick={() => setStep(3)}
              disabled={!phone.trim() || !consent}
            >
              Next: call
            </button>
          </div>
        </section>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <section className="flex flex-col items-center gap-5">
          <h1 className="text-2xl font-semibold">Step 3: Start the call</h1>

          <div className="w-full rounded-lg border border-gray-400 p-3 text-sm">
            <p>Agent: <strong>{selectedAgent?.name ?? selectedId}</strong></p>
            <p>Number: <strong>{phone}</strong></p>
          </div>

          <button
            type="button"
            onClick={requestCall}
            disabled={busy}
            aria-busy={callState === 'calling'}
            className="relative flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full bg-brand text-xl font-semibold text-gray-900 transition hover:scale-105 active:scale-95 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-gray-900 disabled:cursor-default disabled:opacity-60 disabled:hover:scale-100"
          >
            {ringing && (
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-ping rounded-full border-4 border-brand motion-reduce:animate-none"
              />
            )}
            <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true" fill="currentColor">
              <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02L6.6 10.8Z" />
            </svg>
            <span>{callLabel}</span>
          </button>

          <p
            role="status"
            aria-live="polite"
            className={`min-h-12 text-center ${callState === 'error' ? 'text-red-600' : ''}`}
          >
            {callMsg}
          </p>

          <button type="button" className={secondary} onClick={() => setStep(2)} disabled={callState === 'calling'}>
            Back
          </button>
        </section>
      )}
    </div>
  );
}