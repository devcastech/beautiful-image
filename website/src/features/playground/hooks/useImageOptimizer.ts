import { useEffect, useRef, useState } from 'react';
import { image } from 'beautiful-image';
import type { FilterState, OptimizedImage, OptimizeStatus, SourceImage } from '../lib/types';

interface OptimizerState {
  result: OptimizedImage | null;
  status: OptimizeStatus;
  error: string | null;
}

/** Builds the beautiful-image chain from filter state, skipping no-op operations. */
async function optimize(file: File, filters: FilterState): Promise<OptimizedImage> {
  let chain = image(file);

  if (filters.resize) chain = chain.resize(filters.resize);
  if (filters.sharpen > 0) chain = chain.sharpen(filters.sharpen);
  if (filters.blur > 0) chain = chain.blur(filters.blur);
  if (filters.brightness !== 0) chain = chain.brightness(filters.brightness);
  if (filters.contrast !== 0) chain = chain.contrast(filters.contrast);
  if (filters.hueRotate !== 0) chain = chain.hueRotate(filters.hueRotate);
  if (filters.grayscale) chain = chain.grayscale();
  if (filters.invert) chain = chain.invert();

  const result = await chain.toJpeg(filters.quality);
  return { ...result, url: URL.createObjectURL(result.blob) };
}

/**
 * Re-optimizes the source image whenever filters change, debounced.
 * Guards against out-of-order results and revokes stale object URLs.
 */
export function useImageOptimizer(
  source: SourceImage | null,
  filters: FilterState,
  debounceMs = 200
) {
  const [state, setState] = useState<OptimizerState>({ result: null, status: 'idle', error: null });
  const runId = useRef(0);
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!source) {
      setState({ result: null, status: 'idle', error: null });
      return;
    }

    const id = ++runId.current;
    setState((prev) => ({ ...prev, status: 'processing', error: null }));

    const timer = setTimeout(() => {
      optimize(source.file, filters)
        .then((result) => {
          if (id !== runId.current) {
            URL.revokeObjectURL(result.url);
            return;
          }
          if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
          lastUrl.current = result.url;
          setState({ result, status: 'done', error: null });
        })
        .catch((err: unknown) => {
          if (id !== runId.current) return;
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: err instanceof Error ? err.message : 'Optimization failed',
          }));
        });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [source, filters, debounceMs]);

  // Revoke the final URL when the component using the hook unmounts.
  useEffect(() => {
    return () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    };
  }, []);

  return state;
}
