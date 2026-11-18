/* ═══════════════════════════════════════════════════════════
   fejring.js — lyd og konfetti til opgaverne.

   Alt med Web Audio, ingen lydfiler. Lyden kan slås fra med
   saetLyd(false); valget huskes i browseren. Konfettien springes
   over ved prefers-reduced-motion. Fanfaren og konfettien er
   kopieret fra geografi/maaling-af-luftfugtighed/fejring.js.
   ═══════════════════════════════════════════════════════════ */

const NOEGLE = 'smbi-lyd';
let lyd = null;
let til = true;
try { til = localStorage.getItem(NOEGLE) !== '0'; } catch { /* ingen lagring */ }

export const lydTil = () => til;
export function saetLyd(v){
  til = !!v;
  try { localStorage.setItem(NOEGLE, til ? '1' : '0'); } catch { /* ingen lagring */ }
}

function ctx(){
  if (!til) return null;
  try {
    lyd ??= new (window.AudioContext || window.webkitAudioContext)();
    if (lyd.state === 'suspended') lyd.resume();
    return lyd;
  } catch { return null; }
}

function tone(f, start, varighed, {type='sine', styrke=0.2, glid=null} = {}){
  const a = ctx();
  if (!a) return;
  const t0 = a.currentTime + 0.02 + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t0);
  if (glid) osc.frequency.exponentialRampToValueAtTime(glid, t0 + varighed);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(styrke, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + varighed);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + varighed + 0.05);
}

/* Rigtigt svar: to lyse toner opad. */
export function pling(){
  tone(880, 0, 0.18, {styrke:0.16});
  tone(1318.5, 0.09, 0.3, {styrke:0.14});
}
/* Forkert: en kort, dæmpet tone nedad — ikke en straf, bare et signal. */
export function bom(){
  tone(220, 0, 0.22, {type:'triangle', styrke:0.16, glid:150});
}
/* En stjerne lander. */
export function stjerne(i = 0){
  tone(1046.5 * Math.pow(1.122, i), i*0.11, 0.25, {type:'triangle', styrke:0.12});
}
/* Et lille «plop», når et molekyle lander i kloroplasten. */
export function plop(){
  tone(520, 0, 0.09, {styrke:0.08, glid:760});
}

export function fanfare(){
  const a = ctx();
  if (!a) return;
  try {
    const nu = a.currentTime + 0.05;
    const toner = [
      [523.25, 0, 0.13], [523.25, 0.16, 0.13], [523.25, 0.32, 0.13],
      [659.25, 0.48, 0.32], [587.33, 0.84, 0.16], [659.25, 1.02, 0.16],
      [783.99, 1.2, 0.7],
    ];
    const hoved = a.createGain();
    hoved.gain.value = 0.2;
    hoved.connect(a.destination);
    for (const [f, start, varighed] of toner){
      for (const [type, styrke, stem] of [['sawtooth', 0.35, 1], ['square', 0.18, 2.003]]){
        const osc = a.createOscillator();
        const g = a.createGain();
        const filter = a.createBiquadFilter();
        osc.type = type;
        osc.frequency.value = f * (stem === 2.003 ? 1.003 : 1);
        filter.type = 'lowpass';
        filter.frequency.value = 2400;
        const t0 = nu + start, t1 = t0 + varighed;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(styrke, t0 + 0.02);
        g.gain.setValueAtTime(styrke * 0.8, t1 - 0.04);
        g.gain.linearRampToValueAtTime(0, t1 + 0.08);
        osc.connect(filter).connect(g).connect(hoved);
        osc.start(t0);
        osc.stop(t1 + 0.1);
      }
    }
  } catch { /* ingen lyd — så bare konfetti */ }
}

const FARVER = ['#E8336D', '#FF6A3D', '#FFB300', '#5FB030', '#0FA593', '#0E86C8', '#7A4FD6'];

export function konfetti(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  Object.assign(c.style, {position:'fixed', inset:'0', width:'100%', height:'100%', pointerEvents:'none', zIndex:200});
  document.body.appendChild(c);
  const g = c.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const B = innerWidth, Hh = innerHeight;
  c.width = B * dpr; c.height = Hh * dpr;
  g.scale(dpr, dpr);

  const stk = [];
  for (const [ox, retning] of [[0, 1], [B, -1]]){
    for (let i = 0; i < 110; i++){
      const vinkel = (-60 - Math.random() * 25) * (Math.PI / 180);
      const fart = 9 + Math.random() * 10;
      stk.push({
        x:ox, y:Hh * 0.85,
        vx:Math.cos(vinkel) * fart * retning, vy:Math.sin(vinkel) * fart,
        r:Math.random() * Math.PI, vr:(Math.random() - 0.5) * 0.3,
        b:6 + Math.random() * 6, h:4 + Math.random() * 4,
        f:FARVER[i % FARVER.length], s:Math.random() * 10,
      });
    }
  }
  const start = performance.now();
  function trin(nu){
    const tid = (nu - start) / 1000;
    g.clearRect(0, 0, B, Hh);
    for (const p of stk){
      p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx + Math.sin(tid * 4 + p.s) * 0.6; p.y += p.vy; p.r += p.vr;
      g.save();
      g.translate(p.x, p.y); g.rotate(p.r);
      g.scale(1, Math.cos(tid * 8 + p.s));
      g.fillStyle = p.f;
      g.fillRect(-p.b / 2, -p.h / 2, p.b, p.h);
      g.restore();
    }
    if (tid < 4.5) requestAnimationFrame(trin); else c.remove();
  }
  requestAnimationFrame(trin);
}
