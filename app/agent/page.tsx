'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Agent = { id: string; name: string; status: string; createdAt: string };

const field = 'w-full rounded-lg border border-gray-400 bg-white p-3 text-gray-900';
const primary = 'rounded-lg bg-brand p-3 font-semibold text-gray-900 hover:brightness-95 disabled:opacity-50';
const json = { 'Content-Type': 'application/json' };

export default function AgentPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const [name, setName] = useState('LinkModus Assistant');
  const [welcomeMessage, setWelcomeMessage] = useState(
    'Hi! This is an AI assistant calling from LinkModus. How can I help you today?'
  );
  const [prompt, setPrompt] = useState(
    'You are a friendly AI assistant. Say you are an AI. Keep every reply under two sentences. Help the person with their question, then end the call politely.'
  );
  const [result, setResult] = useState('');
  const [creating, setCreating] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listMsg, setListMsg] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  async function loadAgents() {
    setLoadingList(true);
    setListMsg('');
    try {
      const res = await fetch('/api/agent');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAgents(data.agents ?? []);
        setSelectedId(data.selectedId ?? null);
        if (!data.agents?.length) setListMsg('No agents in your Bolna account yet.');
      } else {
        setListMsg(data.error ?? 'Could not load agents.');
      }
    } catch {
      setListMsg('No connection. Try again.');
    }
    setLoadingList(false);
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        setAllowed(!!d.tenant);
        if (d.tenant) loadAgents();
      })
      .catch(() => setAllowed(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    setCreating(true);
    setResult('');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: json,
        body: JSON.stringify({ name, welcomeMessage, prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResult(`Agent created in Bolna. ID: ${data.agentId}`);
        await loadAgents();
      } else {
        setResult(data.error ?? 'Something went wrong.');
      }
    } catch {
      setResult('No connection. Try again.');
    }
    setCreating(false);
  }

  async function select(id: string) {
    const res = await fetch('/api/agent', {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ agentId: id }),
    });
    if (res.ok) setSelectedId(id);
    else setListMsg('Could not select that agent.');
  }

  if (allowed === null) {
    return <main className="mx-auto max-w-xl p-6">Checking access…</main>;
  }

  if (!allowed) {
    return (
      <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Tenant access only</h1>
        <p className="opacity-70">Creating agents is available to subscribers. Log in with your access code to continue.</p>
        <Link href="/login" className={`${primary} text-center`}>Tenant login</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Create your AI agent</h1>

      <section className="flex flex-col gap-4">
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
          <textarea className={field} rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </label>

        <button
          type="button"
          onClick={create}
          disabled={creating}
          className={`${primary} flex items-center justify-center gap-2`}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {creating ? 'Creating…' : 'Create agent in Bolna'}
        </button>

        <p role="status" aria-live="polite" className="break-words">{result}</p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agents in your Bolna account</h2>
          <button
            type="button"
            onClick={loadAgents}
            disabled={loadingList}
            className="rounded-lg border border-gray-400 bg-white px-3 py-1 text-gray-900 disabled:opacity-50"
          >
            {loadingList ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {listMsg && <p className="break-words">{listMsg}</p>}

        <ul className="flex flex-col gap-2">
          {agents.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-400 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{a.name}</p>
                <p className="truncate text-sm opacity-70">
                  {a.status} {a.createdAt && `· ${a.createdAt.slice(0, 10)}`}
                </p>
                <p className="truncate text-xs opacity-60">{a.id}</p>
              </div>
              {a.id === selectedId ? (
                <span className="shrink-0 rounded-full bg-brand px-3 py-1 text-sm font-semibold text-gray-900">
                  In use
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => select(a.id)}
                  className="shrink-0 rounded-lg bg-brand px-3 py-1 font-medium text-gray-900 hover:brightness-95"
                >
                  Use this agent
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}