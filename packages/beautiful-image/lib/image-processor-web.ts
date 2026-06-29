import { ImageProcessor } from './image-processor.js';
import { runEncode } from './worker/worker-client.js';
import type { OptimizeResult } from './types.js';

export class ImageProcessorWeb extends ImageProcessor<File | Blob, OptimizeResult> {
  async toJpeg(quality: number): Promise<OptimizeResult> {
    return runEncode({
      file: this.file,
      targetWidth: this.targetWidth,
      ops: this.ops,
      quality,
    });
  }
}

export const image = (file: File | Blob) => new ImageProcessorWeb(file);
