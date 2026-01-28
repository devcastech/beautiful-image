import init, { processImage } from '../wasm/beautiful_image.js';
import type { OptimizeResult } from './types.js';

interface Operations {
  sharpenSigma?: number;
  sharpenThreshold?: number;
  blurSigma?: number;
  brightness?: number;
  contrast?: number;
  grayscale: boolean;
  invert: boolean;
  hueRotate?: number;
}

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

export class ImageProcessor {
  private file: File | Blob;
  private targetWidth?: number;
  private ops: Operations = {
    grayscale: false,
    invert: false,
  };

  constructor(file: File | Blob) {
    this.file = file;
  }

  resize(width: number): this {
    this.targetWidth = width;
    return this;
  }

  sharpen(sigma = 1.5, threshold = 1): this {
    this.ops.sharpenSigma = sigma;
    this.ops.sharpenThreshold = threshold;
    return this;
  }

  blur(sigma: number): this {
    this.ops.blurSigma = sigma;
    return this;
  }

  brightness(value: number): this {
    this.ops.brightness = value;
    return this;
  }

  contrast(value: number): this {
    this.ops.contrast = value;
    return this;
  }

  grayscale(): this {
    this.ops.grayscale = true;
    return this;
  }

  invert(): this {
    this.ops.invert = true;
    return this;
  }

  hueRotate(degrees: number): this {
    this.ops.hueRotate = degrees;
    return this;
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

export const image = (file: File | Blob): ImageProcessor => new ImageProcessor(file);
