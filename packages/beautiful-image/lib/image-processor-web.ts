import init, { processImage } from '../wasm/beautiful_image.js';
import { ImageProcessor } from './image-processor.js';
import type { OptimizeResult } from './types.js';

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

export class ImageProcessorWeb extends ImageProcessor<File | Blob, OptimizeResult> {
  constructor(file: File | Blob) {
    super(file);
  }

  async toJpeg(quality: number): Promise<OptimizeResult> {
    await ensureInit();

    const bitmap = await createImageBitmap(this.file);

    const aspectRatio = bitmap.height / bitmap.width;
    const finalWidth = this.targetWidth ? Math.min(this.targetWidth, bitmap.width) : bitmap.width;
    const finalHeight = Math.round(finalWidth * aspectRatio);

    const canvas = new OffscreenCanvas(finalWidth, finalHeight);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, finalWidth, finalHeight);

    const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
    const rgbaBytes = new Uint8Array(imageData.data.buffer);

    const result = processImage(
      rgbaBytes,
      finalWidth,
      finalHeight,
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

    bitmap.close();

    const originalSize = this.file.size;
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
}

export const image = (file: File | Blob): ImageProcessor<File | Blob, OptimizeResult> =>
  new ImageProcessorWeb(file);
