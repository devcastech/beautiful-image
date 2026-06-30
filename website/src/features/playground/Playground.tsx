import { useCallback, useEffect, useState } from 'react';
import { Dropzone } from './components/Dropzone';
import { FiltersPanel } from './components/FiltersPanel';
import { PreviewPane } from './components/PreviewPane';
import { Stats } from './components/Stats';
import { useImageOptimizer } from './hooks/useImageOptimizer';
import { defaultFilters } from './lib/defaults';
import type { FilterState, SourceImage } from './lib/types';
import './playground.css';

/** Loads a File into a SourceImage, reading its natural dimensions. */
function loadSource(file: File): Promise<SourceImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ file, url, width: img.naturalWidth, height: img.naturalHeight, size: file.size });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image'));
    };
    img.src = url;
  });
}

function downloadName(original: string): string {
  const base = original.replace(/\.[^.]+$/, '');
  return `${base || 'image'}-optimized.jpg`;
}

export default function Playground() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const { result, status, error } = useImageOptimizer(source, filters);

  const handleFile = useCallback((file: File) => {
    loadSource(file)
      .then((next) => {
        setSource((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return next;
        });
        setFilters({ ...defaultFilters, resize: next.width > 1500 ? 1500 : null });
      })
      .catch(() => {});
  }, []);

  const updateFilters = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(
    () => setFilters({ ...defaultFilters, resize: source && source.width > 1500 ? 1500 : null }),
    [source]
  );

  // Revoke the source URL on unmount.
  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!source) {
    return (
      <div className="pg-empty">
        <Dropzone onFile={handleFile} />
      </div>
    );
  }

  return (
    <div className="pg-workspace">
      <main className="pg-stage">
        <PreviewPane source={source} optimized={result} processing={status === 'processing'} />
        <Stats source={source} optimized={result} />
        {error && <p className="pg-error">{error}</p>}
      </main>
      <aside className="pg-sidebar">
        <FiltersPanel filters={filters} source={source} onChange={updateFilters} onReset={reset} />

        <div className="pg-actions">
          <a
            className="pg-btn pg-btn--primary"
            href={result?.url}
            download={downloadName(source.file.name)}
            aria-disabled={!result}
          >
            Download JPEG
          </a>
          <label className="pg-btn pg-btn--ghost">
            Change image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </aside>
    </div>
  );
}
