const BASE = 'https://api.bolna.ai';

export class BolnaError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function readError(res: Response) {
  const text = await res.text().catch(() => '');
  try {
    return JSON.parse(text).message ?? text;
  } catch {
    return text;
  }
}

export type AgentInput = { name: string; welcomeMessage: string; prompt: string };

export async function createAgent({ name, welcomeMessage, prompt }: AgentInput) {
  const body = {
    agent_config: {
      agent_name: name,
      agent_welcome_message: welcomeMessage,
      tasks: [
        {
          task_type: 'conversation',
          toolchain: {
            execution: 'sequential',
            pipelines: [['transcriber', 'llm', 'synthesizer']],
          },
          tools_config: {
            llm_agent: {
              agent_type: 'simple_llm_agent',
              agent_flow_type: 'streaming',
              llm_config: {
                provider: 'openai',
                model: 'gpt-4.1-mini',
                max_tokens: 150,
                temperature: 0.2,
              },
            },
            synthesizer: {
              provider: 'elevenlabs',
              provider_config: {
                voice: 'Angelica',
                voice_id: 'IkSv4tkouLJ6kYsQA7XD',
                model: 'eleven_turbo_v2_5',
              },
              stream: true,
              buffer_size: 250,
              audio_format: 'wav',
            },
            transcriber: {
              provider: 'deepgram',
              model: 'nova-3',
              language: 'en',
              stream: true,
              encoding: 'linear16',
              sampling_rate: 16000,
              endpointing: 250,
            },
            input: { provider: 'plivo', format: 'wav' },
            output: { provider: 'plivo', format: 'wav' },
          },
          task_config: { call_terminate: 90, hangup_after_silence: 10 },
        },
      ],
    },
    agent_prompts: { task_1: { system_prompt: prompt } },
  };

  const res = await fetch(`${BASE}/v2/agent`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new BolnaError(res.status, await readError(res));
  return (await res.json()) as { agent_id: string; state: string };
}

export async function startCall(agentId: string, phone: string, userData: Record<string, string> = {}) {
  const res = await fetch(`${BASE}/call`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      agent_id: agentId,
      recipient_phone_number: phone,
      ...(process.env.BOLNA_FROM_NUMBER ? { from_phone_number: process.env.BOLNA_FROM_NUMBER } : {}),
      user_data: userData,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new BolnaError(res.status, await readError(res));
  return (await res.json()) as { execution_id?: string; status?: string };
}

export async function listAgents() {
  const res = await fetch(`${BASE}/v2/agent/all`, {
    headers: headers(),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  if (!res.ok) throw new BolnaError(res.status, await readError(res));

  const data = await res.json();
  const rows = (Array.isArray(data) ? data : data.agents ?? data.data ?? []) as Record<string, string | undefined>[];

  return rows.map((a) => ({
    id: (a.id ?? a.agent_id ?? '') as string,
    name: a.agent_name ?? a.name ?? 'Unnamed agent',
    status: a.agent_status ?? a.status ?? '',
    createdAt: a.created_at ?? '',
  }));
}