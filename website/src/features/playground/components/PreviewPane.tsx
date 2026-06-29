import { useCallback, useEffect, useRef, useState } from 'react';
import type { OptimizedImage, SourceImage } from '../lib/types';

interface PreviewPaneProps {
  source: SourceImage;
  optimized: OptimizedImage | null;
  processing: boolean;
}

export function PreviewPane({ source, optimized, processing }: PreviewPaneProps) {
  const [pos, setPos] = useState(50);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, ratio)));
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      updateFromClientX(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updateFromClientX]);

  return (
    <div className={`pg-preview${processing ? ' is-processing' : ''}`}>
      <div className="pg-preview__frame" ref={frameRef}>
        <img
          className="pg-preview__img"
          src={optimized?.url ?? source.url}
          alt="Optimized preview"
          draggable={false}
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        />
        <img
          className="pg-preview__img"
          src={source.url}
          alt="Original"
          draggable={false}
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />

        <span className="pg-preview__tag pg-preview__tag--left" style={{ opacity: pos > 12 ? 1 : 0 }}>
          Original
        </span>
        <span
          className={`pg-preview__tag pg-preview__tag--right${processing ? ' pg-preview__tag--processing' : ''}`}
          style={{ opacity: pos < 88 ? 1 : 0 }}
        >
          <span className="pg-tag-label pg-tag-label--done">Optimized</span>
          <span className="pg-tag-label pg-tag-label--busy" aria-hidden={!processing}>
            Processing
            <span className="pg-dots" aria-hidden="true">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </span>
        </span>

        <div
          className="pg-handle"
          style={{ left: `${pos}%` }}
          onPointerDown={(e) => {
            dragging.current = true;
            updateFromClientX(e.clientX);
          }}
          role="slider"
          aria-label="Comparison position"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 2));
            if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 2));
          }}
        >
          <span className="pg-handle__grip" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" transform="translate(-3 0)" />
              <polyline points="9 6 15 12 9 18" transform="translate(3 0)" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
