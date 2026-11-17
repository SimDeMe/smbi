// Små lyde til «Byg figuren»: rigtigt, forkert og «svaret vises».
// Tonerne laves i browseren (Web Audio), så der er ingen lydfiler. Lyden kan
// slås fra; valget huskes i browseren under nøglen `byg-lyd`.

const NOEGLE = 'byg-lyd';
let ctx = null;

export function lydTil() {
  try { return localStorage.getItem(NOEGLE) !== 'fra'; } catch (e) { return true; }
}
export function saetLyd(til) {
  try { localStorage.setItem(NOEGLE, til ? 'til' : 'fra'); } catch (e) { /* privat vindue */ }
}

function tone(frekvens, start, varighed, { type = 'sine', styrke = 0.12, til = null } = {}) {
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(frekvens, t0);
  if (til) o.frequency.exponentialRampToValueAtTime(til, t0 + varighed);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(styrke, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + varighed);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + varighed + 0.02);
}

/** slags: 'rigtigt' | 'forkert' | 'svar' */
export function spil(slags) {
  if (!lydTil()) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    if (slags === 'rigtigt') {
      tone(660, 0, 0.12);
      tone(990, 0.09, 0.2);
    } else if (slags === 'forkert') {
      tone(200, 0, 0.22, { type: 'triangle', styrke: 0.16, til: 140 });
    } else if (slags === 'svar') {
      tone(520, 0, 0.14, { styrke: 0.1 });
      tone(390, 0.12, 0.24, { styrke: 0.1 });
    }
  } catch (e) { /* ingen lyd i denne browser */ }
}
