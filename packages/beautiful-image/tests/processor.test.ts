import { describe, it, expect } from 'vitest';
import { ImageProcessor } from '../lib/image-processor.js';

class TestProcessor extends ImageProcessor<string, string> {
  get state() {
    return { ops: this.ops, targetWidth: this.targetWidth };
  }
  async toJpeg(_quality: number): Promise<string> {
    return 'ok';
  }
}

const make = () => new TestProcessor('file');

describe('ImageProcessor builder', () => {
  it('initializes with grayscale and invert false, other ops undefined', () => {
    const { ops, targetWidth } = make().state;
    expect(ops).toEqual({ grayscale: false, invert: false });
    expect(targetWidth).toBeUndefined();
  });

  it('chains all setters and returns this', () => {
    const p = make();
    const ret = p
      .resize(800)
      .sharpen(2, 3)
      .blur(1.2)
      .brightness(10)
      .contrast(5)
      .grayscale()
      .invert()
      .hueRotate(45);
    expect(ret).toBe(p);
    expect(p.state).toEqual({
      targetWidth: 800,
      ops: {
        sharpenSigma: 2,
        sharpenThreshold: 3,
        blurSigma: 1.2,
        brightness: 10,
        contrast: 5,
        grayscale: true,
        invert: true,
        hueRotate: 45,
      },
    });
  });

  it('sharpen without args applies 1.5 / 1 defaults', () => {
    const { ops } = make().sharpen().state;
    expect(ops.sharpenSigma).toBe(1.5);
    expect(ops.sharpenThreshold).toBe(1);
  });

  it('later setters overwrite earlier ones', () => {
    const { ops, targetWidth } = make().resize(100).resize(200).brightness(10).brightness(-10).state;
    expect(targetWidth).toBe(200);
    expect(ops.brightness).toBe(-10);
  });
});
