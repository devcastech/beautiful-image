import type { Operations } from './types';

export abstract class ImageProcessor<TInput, TResult> {
  file: TInput;
  targetWidth?: number;
  ops: Operations = {
    grayscale: false,
    invert: false,
  };

  constructor(file: TInput) {
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

  abstract toJpeg(quality: number): Promise<TResult>;
}
