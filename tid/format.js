// ─── Formattering ─────────────────────────────────────────
// Fælles for alle faner. Hver fane havde sin egen udgave af de her, og de
// var begyndt at glide fra hinanden (nogle undveg " i esc, andre ikke).

// HTML-escape til tekst og attributværdier
export const esc = s => s
  ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  : '';

export const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// 95 → "1t 35m", 45 → "45m", 0 → "0m"
export function fmtMins(m) {
  m = Math.round(m || 0);
  if (!m) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r > 0 ? `${h}t ${r}m` : `${h}t`;
}

// Date → "09:05"
export const fmtTime = d =>
  `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
