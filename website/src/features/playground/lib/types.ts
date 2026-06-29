import type { OptimizeResult } from 'beautiful-image';

/** All the knobs the playground exposes, mapped 1:1 to the beautiful-image API. */
export interface FilterState {
  /** Target width in px. `null` keeps the original width. */
  resize: number | null;
  /** JPEG quality, 1-100. */
  quality: number;
  /** Sharpen sigma. `0` disables sharpening. */
  sharpen: number;
  /** Gaussian blur sigma. `0` disables blur. */
  blur: number;
  /** Brightness, -100 to 100. `0` is a no-op. */
  brightness: number;
  /** Contrast, -100 to 100. `0` is a no-op. */
  contrast: number;
  /** Hue rotation in degrees, -180 to 180. `0` is a no-op. */
  hueRotate: number;
  grayscale: boolean;
  invert: boolean;
}

/** Metadata about the source image, captured once on load. */
export interface SourceImage {
  file: File;
  url: string;
  width: number;
  height: number;
  size: number;
}

export type OptimizeStatus = 'idle' | 'processing' | 'done' | 'error';

export interface OptimizedImage extends OptimizeResult {
  url: string;
}
