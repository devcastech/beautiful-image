import { Slider } from './Slider';
import { Toggle } from './Toggle';
import type { FilterState, SourceImage } from '../lib/types';

interface FiltersPanelProps {
  filters: FilterState;
  source: SourceImage;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
}

export function FiltersPanel({ filters, source, onChange, onReset }: FiltersPanelProps) {
  const resizeWidth = filters.resize ?? source.width;

  return (
    <div className="pg-panel">
      <section className="pg-group">
        <h3 className="pg-group__title">Output</h3>
        <Slider
          label="Quality"
          value={filters.quality}
          min={1}
          max={100}
          format={(v) => `${v}`}
          onChange={(v) => onChange({ quality: v })}
        />
        <Slider
          label="Width"
          value={resizeWidth}
          min={Math.min(64, source.width)}
          max={source.width}
          format={(v) => `${v}px${v >= source.width ? ' · original' : ''}`}
          onChange={(v) => onChange({ resize: v >= source.width ? null : v })}
        />
      </section>

      <div className="pg-panel__header">
        <h2 className="pg-panel__title">Filters</h2>
        <button type="button" className="pg-reset" onClick={onReset}>
          Reset
        </button>
      </div>

      <section className="pg-group">
        <h3 className="pg-group__title">Detail</h3>
        <Slider
          label="Sharpen"
          value={filters.sharpen}
          min={0}
          max={5}
          step={0.1}
          format={(v) => (v === 0 ? 'off' : v.toFixed(1))}
          onChange={(v) => onChange({ sharpen: v })}
        />
        <Slider
          label="Blur"
          value={filters.blur}
          min={0}
          max={20}
          step={0.5}
          format={(v) => (v === 0 ? 'off' : v.toFixed(1))}
          onChange={(v) => onChange({ blur: v })}
        />
      </section>

      <section className="pg-group">
        <h3 className="pg-group__title">Color</h3>
        <Slider
          label="Brightness"
          value={filters.brightness}
          min={-100}
          max={100}
          format={(v) => (v > 0 ? `+${v}` : `${v}`)}
          onChange={(v) => onChange({ brightness: v })}
        />
        <Slider
          label="Contrast"
          value={filters.contrast}
          min={-100}
          max={100}
          format={(v) => (v > 0 ? `+${v}` : `${v}`)}
          onChange={(v) => onChange({ contrast: v })}
        />
        <Slider
          label="Hue"
          value={filters.hueRotate}
          min={-180}
          max={180}
          format={(v) => `${v}°`}
          onChange={(v) => onChange({ hueRotate: v })}
        />
        <Toggle label="Grayscale" checked={filters.grayscale} onChange={(v) => onChange({ grayscale: v })} />
        <Toggle label="Invert" checked={filters.invert} onChange={(v) => onChange({ invert: v })} />
      </section>
    </div>
  );
}
