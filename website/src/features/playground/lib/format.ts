/** Human-readable file size, e.g. `2.4 MB`, `410 KB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

/** Signed percentage from a compression ratio (`0.83` -> `-83%`). */
export function formatReduction(ratio: number): string {
  const pct = Math.round(ratio * 100);
  return `${pct >= 0 ? '-' : '+'}${Math.abs(pct)}%`;
}
