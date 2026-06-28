import init, { processImageFromBytes } from '../wasm/beautiful_image.js';
import wasmDataUrl from '../wasm/beautiful_image_bg.wasm?url&inline';
import type { NodeOptimizeResult } from './types.js';
import { ImageProcessor } from './image-processor.js';

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    const base64 = wasmDataUrl.slice(wasmDataUrl.indexOf(',') + 1);
    await init({ module_or_path: Buffer.from(base64, 'base64') });
    initialized = true;
  }
}

export class ImageProcessorNode extends ImageProcessor<Buffer | Uint8Array, NodeOptimizeResult> {
  constructor(file: Buffer | Uint8Array) {
    super(file);
  }

  async toJpeg(quality: number): Promise<NodeOptimizeResult> {
    await ensureInit();

    const file = new Uint8Array(this.file.buffer, this.file.byteOffset, this.file.byteLength);

    const result = processImageFromBytes(
      file,
      this.targetWidth ?? null,
      quality,
      this.ops.sharpenSigma ?? null,
      this.ops.sharpenThreshold ?? null,
      this.ops.blurSigma ?? null,
      this.ops.brightness ?? null,
      this.ops.contrast ?? null,
      this.ops.grayscale,
      this.ops.invert,
      this.ops.hueRotate ?? null
    );

    const originalSize = this.file.byteLength;
    const optimizedSize = result.length;

    return {
      data: Buffer.from(result),
      originalSize,
      optimizedSize,
      compressionRatio: 1 - optimizedSize / originalSize,
    };
  }
}

export const image = (file: Buffer | Uint8Array): ImageProcessorNode =>
  new ImageProcessorNode(file);
