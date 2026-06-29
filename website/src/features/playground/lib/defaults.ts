import type { FilterState } from './types';

/** Neutral starting point: only JPEG re-encoding at quality 80, no filters. */
export const defaultFilters: FilterState = {
  resize: null,
  quality: 80,
  sharpen: 0,
  blur: 0,
  brightness: 0,
  contrast: 0,
  hueRotate: 0,
  grayscale: false,
  invert: false,
};
