import type { Operations, OptimizeResult } from '../types.js';

export interface EncodePayload {
  file: File | Blob;
  targetWidth?: number;
  ops: Operations;
  quality: number;
}

export interface WorkerRequest {
  id: number;
  payload: EncodePayload;
}

export type WorkerResponse =
  { id: number; ok: true; result: OptimizeResult } | { id: number; ok: false; error: string };

export type PendingJob = {
  resolve: (r: OptimizeResult) => void;
  reject: (e: Error) => void;
};
