// Forsidens udsnit af «Kapløbet» fra jordskælvsbølgerne (atlas/jordskaelvsboelger-b).
// Samme farter og samme tegning som boelgetyper.js, men kun kapløbet og uden
// betjening: P, S og overfladebølger starter samtidig og løber mod en
// seismograf 300 km væk.
import { VP, VS, VR, K } from './atlas/jordskaelvsboelger-b/model.js';
import { FARVE, tilpas, tal } from './atlas/jordskaelvsboelger-b/laerred.js';

export const L = 340, STATION = 300, TSLUT = 112;
export const ANKOMST = { P: STATION / VP, S: STATION / VS, O: STATION / VR };

function puls(km, v, bredde, tt) {
  const xi = (km - v * tt) / bredde;
  return -xi * Math.exp(-xi * xi / 2) * 1.65;
}

function forskydning(x, z, w, a, tt) {
  const km = x / w * L, dyb = z / w * L;
  const pP = puls(km, VP, 8, tt), pS = puls(km, VS, 8, tt);
  const xiR = (km - VR * tt) / 13, henfald = Math.exp(-dyb / 25);
  const rx = Math.exp(-xiR * xiR / 2) * Math.sin(xiR * 2.2) * henfald;
  const rz = Math.exp(-xiR * xiR / 2) * Math.cos(xiR * 2.2) * henfald * 1.4;
  return { dx: a * (0.6 * pP + 0.8 * rx), dy: a * (0.8 * pS - rz) };
}

export function tegnKaploeb(canvas, t) {
  const { ctx, w, h } = tilpas(canvas);
  const seismoH = Math.max(64, h * 0.24);
  const himmel = Math.max(70, h * 0.22);
  const bund = h - seismoH;
  const gs = Math.max(12, Math.min(20, w / 34));
  const a = gs * 0.45;

  const g = ctx.createLinearGradient(0, 0, 0, himmel);
  g.addColorStop(0, '#e2eeea'); g.addColorStop(1, '#f6f4e8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, himmel);
  const jord = ctx.createLinearGradient(0, himmel, 0, bund);
  jord.addColorStop(0, '#e7e5d1'); jord.addColorStop(0.35, '#dce0cc'); jord.addColorStop(1, '#c4cfbd');
  ctx.fillStyle = jord; ctx.fillRect(0, himmel, w, bund - himmel);

  const kol = Math.ceil(w / gs) + 2, raek = Math.floor((bund - himmel) / gs);
  if (raek < 2 || w < 50) return;
  const punkt = (i, j) => {
    const x0 = (i - 1) * gs + gs * 0.5, z0 = j * gs;
    const { dx, dy } = forskydning(x0, z0, w, a, t);
    return [x0 + dx, himmel + z0 + dy];
  };
  const net = [];
  for (let j = 0; j <= raek; j++) { const r = []; for (let i = 0; i < kol; i++) r.push(punkt(i, j)); net.push(r); }

  // Sammentrykte felter fra P-bølgen.
  const farve = ctx.createLinearGradient(0, 0, w, 0);
  const n = Math.ceil(Math.max(w / 2, L));
  const dxP = x => a * 0.6 * puls(x / w * L, VP, 8, t);
  for (let k = 0; k <= n; k++) {
    const x = k * w / n;
    const tryk = -(dxP(x + 0.5) - dxP(x - 0.5));
    farve.addColorStop(k / n, tryk > 0
      ? `rgba(14,134,200,${Math.min(0.28, tryk * 0.8)})`
      : `rgba(255,255,255,${Math.min(0.4, -tryk)})`);
  }
  ctx.fillStyle = farve; ctx.fillRect(0, himmel, w, bund - himmel);

  // De smalle pulser kræver tætte punkter langs gitterlinjerne.
  const delinger = Math.ceil(gs / Math.min(2, w / L));
  function tegnLinje(i, j, di, dj, antal) {
    ctx.moveTo(...punkt(i, j));
    for (let k = 1; k <= antal * delinger; k++) {
      const u = k / delinger;
      ctx.lineTo(...punkt(i + di * u, j + dj * u));
    }
  }
  ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(23,45,57,.18)';
  ctx.beginPath();
  for (let j = 0; j <= raek; j++) tegnLinje(0, j, 1, 0, kol - 1);
  for (let i = 0; i < kol; i++) tegnLinje(i, 0, 0, 1, raek);
  ctx.stroke();
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#6b8061';
  ctx.beginPath(); tegnLinje(0, 0, 1, 0, kol - 1); ctx.stroke();
  ctx.fillStyle = '#4e685e';
  for (const r of net) for (const [x, y] of r) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); }

  tegnHus(ctx, net[0][Math.round(STATION / L * w / gs) + 1], gs);
  stjerne(ctx, 14, himmel + (bund - himmel) * 0.45, 10, FARVE.s);

  // Bølgemærker over overfladen
  const my = himmel * 0.42;
  for (const [bog, v, f, dy] of [['P', VP, FARVE.p, 0], ['S', VS, FARVE.s, 5], ['O', VR, FARVE.r, 10]]) {
    const x = v * t / L * w;
    if (x < 4 || x > w + 10) continue;
    ctx.fillStyle = f;
    ctx.beginPath(); ctx.arc(x, my + dy, 10, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(bog, x, my + dy);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = FARVE.ink; ctx.font = '500 10px "IBM Plex Mono", monospace';
  for (let km = 0; km <= L; km += 20) {
    const x = km / L * w;
    ctx.fillRect(x, bund - 6, 1, 6);
    if (km % 100 === 0 && km > 0 && km < L) ctx.fillText(`${km} km`, x + 3, bund - 8);
  }

  // Seismogrammet ved stationen: jordens samlede rystelse fra skælvet til nu.
  const sx = STATION / L * w, tMaks = TSLUT - 2, x0 = 64;
  const top = bund;
  ctx.fillStyle = '#fffdf5'; ctx.fillRect(0, top, w, seismoH);
  ctx.fillStyle = FARVE.ink; ctx.fillRect(0, top, w, 2);
  ctx.font = '600 10.5px Archivo, sans-serif';
  ctx.fillText('Seismograf', 8, top + 18); ctx.fillText(`ved ${STATION} km`, 8, top + 31);
  const midt = top + seismoH * 0.56;
  const xT = s => x0 + s / tMaks * (w - x0 - 10);
  ctx.strokeStyle = 'rgba(23,33,31,.15)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let s = 0; s <= tMaks; s += 10) { ctx.moveTo(xT(s), top + 8); ctx.lineTo(xT(s), top + seismoH - 14); }
  ctx.stroke();
  ctx.fillStyle = FARVE.slate; ctx.font = '500 9.5px "IBM Plex Mono", monospace';
  for (let s = 0; s <= tMaks; s += 20) ctx.fillText(`${s} s`, xT(s) + 2, top + seismoH - 3);
  ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let ts = 0, i = 0; ts <= Math.min(t, tMaks); ts += 0.2, i++) {
    const { dx, dy } = forskydning(sx, 0, w, gs * 0.45, ts);
    const x = xT(ts), y = midt - (0.6 * dx - dy) * 1.1;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  for (const [bog, f] of [['P', FARVE.p], ['S', FARVE.s], ['O', FARVE.r]]) {
    const ta = ANKOMST[bog];
    if (t < ta) continue;
    ctx.fillStyle = f; ctx.fillRect(xT(ta) - 1, top + 6, 2, seismoH - 20);
    ctx.font = '700 10.5px "IBM Plex Mono", monospace'; ctx.fillText(bog, xT(ta) + 3, top + 16 + (bog === 'O' ? 12 : 0));
  }
}

// Aflæsningerne under figuren.
export function aflaes(t) {
  const nu = Math.min(t, TSLUT - 2);
  const fremme = ['P', 'S', 'O'].filter(b => t >= ANKOMST[b]);
  const sidst = fremme.at(-1);
  return {
    tid: `${tal(nu, 0)} s`,
    ved: !sidst ? 'Venter' : sidst === 'P' ? 'P er fremme' : sidst === 'S' ? 'S er fremme' : 'Overfladebølger',
    sp: t >= ANKOMST.S ? `${tal(ANKOMST.S - ANKOMST.P)} s → ${tal(K * (ANKOMST.S - ANKOMST.P), 0)} km` : '—',
  };
}

function stjerne(ctx, x, y, r, farve) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const v = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + rr * Math.cos(v), y + rr * Math.sin(v));
  }
  ctx.closePath(); ctx.fillStyle = farve; ctx.fill(); ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.5; ctx.stroke();
}

// Seismografens lille hus, der står på overfladen og rystes med jorden.
function tegnHus(ctx, [x, y], gs) {
  const b = gs * 1.7, hh = gs * 1.15;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fffdf7'; ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.8;
  ctx.fillRect(-b / 2, -hh, b, hh); ctx.strokeRect(-b / 2, -hh, b, hh);
  ctx.beginPath(); ctx.moveTo(-b / 2 - 4, -hh); ctx.lineTo(0, -hh - gs * 0.9); ctx.lineTo(b / 2 + 4, -hh); ctx.closePath();
  ctx.fillStyle = '#c4533a'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = FARVE.ink; ctx.font = '700 8.5px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
  ctx.fillText('SEIS', 0, -hh * 0.32); ctx.textAlign = 'left';
  ctx.restore();
}
