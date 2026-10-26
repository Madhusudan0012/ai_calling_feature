import { promises as fs } from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), '.agent.json');

export async function getAgentId(): Promise<string | null> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw).agentId ?? process.env.BOLNA_AGENT_ID ?? null;
  } catch {
    return process.env.BOLNA_AGENT_ID ?? null;
  }
}

export async function saveAgentId(agentId: string) {
  await fs.writeFile(FILE, JSON.stringify({ agentId }), 'utf8');
}