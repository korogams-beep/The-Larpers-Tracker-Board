// Small, pure, stateless helper functions shared across the app.

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function pct(v, max) {
  return max <= 0 ? 0 : clamp(Math.round((v / max) * 100), 0, 100);
}

export function hpColor(p) {
  return p >= 60 ? 'var(--success)' : p >= 30 ? 'var(--warn)' : 'var(--danger)';
}
