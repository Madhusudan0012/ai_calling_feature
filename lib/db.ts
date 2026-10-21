export type CallRecord = {
  id: string;
  userId: string;
  status: string;
  bolnaExecutionId?: string;
  transcript?: unknown;
  durationSec?: number;
  rawPayload?: unknown;
  createdAt: number;
};

const g = globalThis as unknown as { __calls?: Map<string, CallRecord> };
const calls = (g.__calls ??= new Map<string, CallRecord>());

export function createCall(userId: string): CallRecord {
  const rec: CallRecord = {
    id: crypto.randomUUID(),
    userId,
    status: 'initiated',
    createdAt: Date.now(),
  };
  calls.set(rec.id, rec);
  return rec;
}

export function updateCall(id: string, patch: Partial<CallRecord>) {
  const rec = calls.get(id);
  if (rec) calls.set(id, { ...rec, ...patch });
}

export function findByExecutionId(executionId: string) {
  for (const rec of calls.values()) {
    if (rec.bolnaExecutionId === executionId) return rec;
  }
  return undefined;
}

export function lastCallAt(userId: string): number | undefined {
  let latest: number | undefined;
  for (const rec of calls.values()) {
    if (rec.userId === userId && (!latest || rec.createdAt > latest)) latest = rec.createdAt;
  }
  return latest;
}