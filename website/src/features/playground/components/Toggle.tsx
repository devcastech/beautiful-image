interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="pg-control pg-toggle">
      <span className="pg-control__label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`pg-switch${checked ? ' is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="pg-switch__thumb" />
      </button>
    </label>
  );
}
