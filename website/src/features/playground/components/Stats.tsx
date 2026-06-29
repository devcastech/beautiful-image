import { formatBytes, formatReduction } from '../lib/format';
import type { OptimizedImage, SourceImage } from '../lib/types';

interface StatsProps {
  source: SourceImage;
  optimized: OptimizedImage | null;
}

export function Stats({ source, optimized }: StatsProps) {
  const ratio = optimized?.compressionRatio ?? 0;
  const isGain = ratio > 0;

  return (
    <div className="pg-stats">
      <div className="pg-stats__row">
        <div className="pg-stat">
          <span className="pg-stat__label">Original</span>
          <span className="pg-stat__value">{formatBytes(source.size)}</span>
          <span className="pg-stat__sub">{source.width} × {source.height}</span>
        </div>

        <div className="pg-stat pg-stat--arrow" aria-hidden="true">→</div>

        <div className="pg-stat">
          <span className="pg-stat__label">Optimized</span>
          <span className="pg-stat__value pg-stat__value--accent">
            {optimized ? formatBytes(optimized.optimizedSize) : '—'}
          </span>
          <span className="pg-stat__sub">
            {optimized ? `${optimized.width} × ${optimized.height}` : ' '}
          </span>
        </div>

        <div className={`pg-stats__badge${optimized ? (isGain ? ' is-gain' : ' is-loss') : ''}`}>
          {optimized ? (
            <>
              <span className="pg-stats__pct">{formatReduction(ratio)}</span>
              <span className="pg-stats__badge-label">{isGain ? 'smaller' : 'larger'}</span>
            </>
          ) : (
            <span className="pg-stats__badge-label">…</span>
          )}
        </div>
      </div>
    </div>
  );
}
