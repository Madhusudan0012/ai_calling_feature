import { NextResponse } from 'next/server';
import { createAgent, listAgents, BolnaError } from '@/lib/bolna';
import { getAgentId, saveAgentId } from '@/lib/agentStore';
import { getTenant } from '@/lib/auth';

const denied = () =>
  NextResponse.json({ error: 'Tenant access only. Please log in.' }, { status: 401 });

function fail(err: unknown, fallback: string) {
  console.error(fallback, err);
  const message = err instanceof BolnaError ? `Bolna ${err.status}: ${err.message}` : fallback;
  return NextResponse.json({ error: message }, { status: 502 });
}

// List agents from Bolna + which one the app uses
export async function GET() {
  if (!(await getTenant())) return denied();
  try {
    return NextResponse.json({ selectedId: await getAgentId(), agents: await listAgents() });
  } catch (err) {
    return fail(err, 'Could not load agents.');
  }
}

// Create a new agent in Bolna
export async function POST(req: Request) {
  if (!(await getTenant())) return denied();

  const { name, welcomeMessage, prompt } = await req.json().catch(() => ({}));
  if (!name || !welcomeMessage || !prompt) {
    return NextResponse.json({ error: 'Name, welcome message and prompt are required.' }, { status: 400 });
  }

  try {
    const agent = await createAgent({ name, welcomeMessage, prompt });
    await saveAgentId(agent.agent_id);
    return NextResponse.json({ ok: true, agentId: agent.agent_id });
  } catch (err) {
    return fail(err, 'Could not create the agent.');
  }
}

// Choose which agent the AI Calling page uses
export async function PUT(req: Request) {
  if (!(await getTenant())) return denied();

  const { agentId } = await req.json().catch(() => ({}));
  if (typeof agentId !== 'string' || !/^[\w-]{8,64}$/.test(agentId)) {
    return NextResponse.json({ error: 'Invalid agent ID.' }, { status: 400 });
  }
  await saveAgentId(agentId);
  return NextResponse.json({ ok: true });
}