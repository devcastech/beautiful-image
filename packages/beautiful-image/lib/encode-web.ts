import init, { processImage } from '../wasm/beautiful_image.js';
import type { EncodePayload } from './worker/worker-protocol.js';
import type { OptimizeResult } from './types.js';

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

export async function encodeWeb({
  file,
  targetWidth,
  ops,
  quality,
}: EncodePayload): Promise<OptimizeResult> {
  await ensureInit();

  const bitmap = await createImageBitmap(file);
  const aspectRatio = bitmap.height / bitmap.width;
  const finalWidth = targetWidth ? Math.min(targetWidth, bitmap.width) : bitmap.width;
  const finalHeight = Math.round(finalWidth * aspectRatio);

  let result: Uint8Array;
  try {
    const canvas = new OffscreenCanvas(finalWidth, finalHeight);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, finalWidth, finalHeight);

    const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
    const rgbaBytes = new Uint8Array(imageData.data.buffer);

    result = processImage(
      rgbaBytes,
      finalWidth,
      finalHeight,
      quality,
      ops.sharpenSigma ?? null,
      ops.sharpenThreshold ?? null,
      ops.blurSigma ?? null,
      ops.brightness ?? null,
      ops.contrast ?? null,
      ops.grayscale,
      ops.invert,
      ops.hueRotate ?? null
    );
  } finally {
    bitmap.close();
  }

  const originalSize = file.size;
  const optimizedSize = result.length;
  return {
    blob: new Blob([new Uint8Array(result)], { type: 'image/jpeg' }),
    originalSize,
    optimizedSize,
    compressionRatio: 1 - optimizedSize / originalSize,
    width: finalWidth,
    height: finalHeight,
  };
}
