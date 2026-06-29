/// <reference lib="webworker" />
import { encodeWeb } from '../encode-web.js';
import type { WorkerRequest, WorkerResponse } from './worker-protocol.js';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, payload } = e.data;
  try {
    const result = await encodeWeb(payload);
    ctx.postMessage({ id, ok: true, result } satisfies WorkerResponse);
  } catch (err) {
    ctx.postMessage({
      id,
      ok: false,
      error: err instanceof Error ? err.message : 'Optimization failed',
    } satisfies WorkerResponse);
  }
};
