import OptimizerWorker from './optimizer.worker.ts?worker&inline';
import { encodeWeb } from '../encode-web.js';
import type { EncodePayload, PendingJob, WorkerResponse } from './worker-protocol.js';
import type { OptimizeResult } from '../types.js';

class WorkerClient {
  private worker: Worker | null = null;
  private disabled = false;
  private nextId = 0;
  private pending = new Map<number, PendingJob>();
  private queued: { id: number; payload: EncodePayload; job: PendingJob } | null = null;

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

        if (this.queued && this.worker) {
          const { id, payload, job: nextJob } = this.queued;
          this.queued = null;
          this.pending.set(id, nextJob);
          this.worker.postMessage({ id, payload });
          console.debug('[WorkerClient] dispatching queued job', id);
        }
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
    if (err) {
      for (const job of this.pending.values()) job.reject(err);
      this.queued?.job.reject(err);
    }
    this.pending.clear();
    this.queued = null;
  }

  async encode(payload: EncodePayload): Promise<OptimizeResult> {
    if (!this.canUse()) {
      console.warn('[WorkerClient] worker unavailable — running on main thread', {
        disabled: this.disabled,
        workerSupported: typeof Worker !== 'undefined',
        offscreenCanvasSupported: typeof OffscreenCanvas !== 'undefined',
      });
      return encodeWeb(payload);
    }

    const w = this.acquire();
    if (!w) return encodeWeb(payload);

    if (this.pending.size > 0) {
      if (this.queued) {
        console.debug('[WorkerClient] dropping queued job', this.queued.id, '— replaced by newer');
        this.queued.job.reject(new Error('cancelled'));
      }
      return new Promise<OptimizeResult>((resolve, reject) => {
        const id = this.nextId++;
        console.debug('[WorkerClient] worker busy — queuing job', id);
        this.queued = { id, payload, job: { resolve, reject } };
      });
    }

    try {
      return await new Promise<OptimizeResult>((resolve, reject) => {
        const id = this.nextId++;
        this.pending.set(id, { resolve, reject });
        w.postMessage({ id, payload });
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'cancelled') throw err;
      console.warn('[WorkerClient] worker error — falling back to main thread', err);
      return encodeWeb(payload);
    }
  }
}

const client = new WorkerClient();

export const runEncode = (payload: EncodePayload): Promise<OptimizeResult> =>
  client.encode(payload);
