import OptimizerWorker from './optimizer.worker.ts?worker&inline';
import { encodeWeb } from '../encode-web.js';
import type { EncodePayload, PendingJob, WorkerResponse } from './worker-protocol.js';
import type { OptimizeResult } from '../types.js';


class WorkerClient {
  private worker: Worker | null = null;
  private disabled = false;
  private nextId = 0;
  private pending = new Map<number, PendingJob>();

  private canUse(): boolean {
    return (
      !this.disabled && typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
    );
  }

  private acquire(): Worker | null {
    if (!this.canUse()) return null;
    if (this.worker) return this.worker;
    try {
      this.worker = new OptimizerWorker();
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        const job = this.pending.get(msg.id);
        if (!job) return;
        this.pending.delete(msg.id);
        if (msg.ok) job.resolve(msg.result);
        else job.reject(new Error(msg.error));
      };
      this.worker.onerror = () => this.disable(new Error('Worker crashed'));
      return this.worker;
    } catch {
      this.disable();
      return null;
    }
  }

  private disable(err?: Error): void {
    this.disabled = true;
    this.worker?.terminate();
    this.worker = null;
    if (err) for (const job of this.pending.values()) job.reject(err);
    this.pending.clear();
  }

  async encode(payload: EncodePayload): Promise<OptimizeResult> {
    const w = this.acquire();
    if (!w) return encodeWeb(payload);

    for (const job of this.pending.values()) job.reject(new Error('cancelled'));
    this.pending.clear();

    try {
      return await new Promise<OptimizeResult>((resolve, reject) => {
        const id = this.nextId++;
        this.pending.set(id, { resolve, reject });
        w.postMessage({ id, payload });
      });
    } catch {
      // worker.onerror already calls disable() on crashes.
      // A processing-level error (ok:false) should not disable the worker.
      return encodeWeb(payload);
    }
  }
}

const client = new WorkerClient();

export const runEncode = (payload: EncodePayload): Promise<OptimizeResult> =>
  client.encode(payload);
