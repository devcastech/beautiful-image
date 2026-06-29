interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Optional formatter for the value readout (defaults to the raw number). */
  format?: (value: number) => string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step = 1, format, disabled, onChange }: SliderProps) {
  return (
    <label className={`pg-control${disabled ? ' is-disabled' : ''}`}>
      <div className="pg-control__head">
        <span className="pg-control__label">{label}</span>
        <span className="pg-control__value">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        className="pg-range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
