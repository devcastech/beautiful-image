export interface OptimizeResult {
  blob: Blob;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

export interface NodeOptimizeResult {
  data: Buffer;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

export interface Operations {
  sharpenSigma?: number;
  sharpenThreshold?: number;
  blurSigma?: number;
  brightness?: number;
  contrast?: number;
  grayscale: boolean;
  invert: boolean;
  hueRotate?: number;
}
