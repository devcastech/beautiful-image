import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { image } from '../lib/main.node.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name));
const png = fixture('sample.png');
const W = 1920;
const H = 1080;

function isJpeg(data: Uint8Array): boolean {
  return (
    data.length > 3 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[data.length - 2] === 0xff &&
    data[data.length - 1] === 0xd9
  );
}

function jpegDimensions(data: Uint8Array): { width: number; height: number } {
  for (let i = 2; i < data.length - 9; i++) {
    if (data[i] === 0xff && data[i + 1] === 0xc0) {
      const height = (data[i + 5] << 8) | data[i + 6];
      const width = (data[i + 7] << 8) | data[i + 8];
      return { width, height };
    }
  }
  throw new Error('SOF0 marker not found');
}

describe('image() Node pipeline', () => {
  it('re-encodes PNG input to valid JPEG with correct metadata', async () => {
    const result = await image(png).toJpeg(80);

    expect(isJpeg(result.data)).toBe(true);
    expect(result.originalSize).toBe(png.byteLength);
    expect(result.optimizedSize).toBe(result.data.length);
    expect(result.compressionRatio).toBeCloseTo(
      1 - result.optimizedSize / result.originalSize,
      10,
    );

    const { width, height } = jpegDimensions(result.data);
    expect(width).toBe(W);
    expect(height).toBe(H);
  });

  it('resizes while preserving aspect ratio', async () => {
    const result = await image(png).resize(480).toJpeg(80);
    const { width, height } = jpegDimensions(result.data);
    expect(width).toBe(480);
    expect(height).toBe(Math.round((H * 480) / W));
  });

  it('does not upscale when target width exceeds source', async () => {
    const result = await image(png).resize(9999).toJpeg(80);
    const { width, height } = jpegDimensions(result.data);
    expect(width).toBe(W);
    expect(height).toBe(H);
  });

  it('lower quality yields smaller file than higher quality', async () => {
    const low = await image(png).toJpeg(20);
    const high = await image(png).toJpeg(95);
    expect(low.optimizedSize).toBeLessThan(high.optimizedSize);
  });

  it('accepts Uint8Array and Buffer equivalently', async () => {
    const fromBuffer = await image(png).toJpeg(80);
    const fromUint8 = await image(new Uint8Array(png)).toJpeg(80);
    expect(fromBuffer.optimizedSize).toBe(fromUint8.optimizedSize);
  });

  it('applies chained operations without error and produces valid JPEG', async () => {
    const result = await image(png)
      .resize(400)
      .sharpen()
      .blur(0.5)
      .brightness(5)
      .contrast(10)
      .grayscale()
      .hueRotate(30)
      .toJpeg(75);

    expect(isJpeg(result.data)).toBe(true);
    expect(jpegDimensions(result.data).width).toBe(400);
  });

  it('rejects invalid image bytes', async () => {
    const garbage = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    await expect(image(garbage).toJpeg(80)).rejects.toThrow();
  });

  it.each(['sample.png', 'sample.jpg', 'sample.webp'])(
    'decodes %s and re-encodes to valid JPEG with original dimensions',
    async (name) => {
      const result = await image(fixture(name)).toJpeg(80);
      expect(isJpeg(result.data)).toBe(true);
      const { width, height } = jpegDimensions(result.data);
      expect(width).toBe(W);
      expect(height).toBe(H);
    },
  );
});
