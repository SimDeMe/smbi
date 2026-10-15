// Snittet fra Sydpol til Nordpol: luftringene som partikler, der følger
// strømfunktionens konturer. Lodret meget overdrevet.
import { stroemfunktion, tropopause, baelter, itkMiddel, solbredde } from './model.js';
import { FARVER } from './globus.js';

const ANTAL = 520;
const KM_TOP = 19;

export function lavSnit(canvas, tilstand) {
  const ctx = canvas.getContext('2d');
  const spor = document.createElement('canvas');
  const sctx = spor.getContext('2d');
  let B = 0, H = 0, dpr = 1;
  const M = { v: 30, h: 10, t: 22, b: 40 };
  const x = lat => M.v + (lat + 90) / 180 * (B - M.v - M.h);
  const jordY = () => H - M.b;
  const y = (lat, z) => jordY() - z * tropopause(lat) / KM_TOP * (jordY() - M.t);

  const partikler = Array.from({ length: ANTAL }, ny);
  function ny() { return { lat: Math.random() * 178 - 89, z: 0.05 + Math.random() * 0.9, alder: Math.random() * 4, levetid: 3 + Math.random() * 4 }; }

  function tilpas() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    B = r.width; H = r.height;
    for (const c of [canvas, spor]) { c.width = Math.round(B * dpr); c.height = Math.round(H * dpr); }
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function celle(lat, s) {
    if (s.rotation < 0.5) return 'ingen';
    const b = baelter(s.maaned);
    const a = lat;
    if (a > b.sydHoej && a < b.nordHoej) return 'passat';
    if ((a >= b.nordHoej && a < b.nordFront) || (a <= b.sydHoej && a > b.sydFront)) return 'vest';
    return 'polar';
  }

  function trin(dt, t) {
    const s = tilstand();
    sctx.globalCompositeOperation = 'destination-out';
    sctx.fillStyle = `rgba(0,0,0,${s.pause ? 0 : Math.min(0.5, dt * 4)})`;
    sctx.fillRect(0, 0, B, H);
    sctx.globalCompositeOperation = 'source-over';
    if (!s.pause) {
      const K = 6, d = 0.01, dl = 0.4;
      const stier = {};
      for (const k of Object.keys(FARVER)) stier[k] = new Path2D();
      for (let i = 0; i < partikler.length; i++) {
        const p = partikler[i];
        p.alder += dt;
        if (p.alder > p.levetid) { partikler[i] = ny(); partikler[i].alder = 0; continue; }
        // Halve skridt (midtpunktsmetoden) holder partiklerne på deres ring.
        const fart = (lat, z) => {
          const dz = (stroemfunktion(lat, z + d, s.maaned, s.rotation) - stroemfunktion(lat, z - d, s.maaned, s.rotation)) / (2 * d);
          const dy = (stroemfunktion(lat + dl, z, s.maaned, s.rotation) - stroemfunktion(lat - dl, z, s.maaned, s.rotation)) / (2 * dl);
          return [-dz * K, dy * K];
        };
        const [a1, b1] = fart(p.lat, p.z);
        const [a2, b2] = fart(p.lat + a1 * dt / 2, p.z + b1 * dt / 2);
        const x0 = x(p.lat), y0 = y(p.lat, p.z);
        p.lat = Math.max(-89.5, Math.min(89.5, p.lat + a2 * dt));
        p.z = Math.max(0.01, Math.min(0.99, p.z + b2 * dt));
        stier[celle(p.lat, s)].moveTo(x0, y0);
        stier[celle(p.lat, s)].lineTo(x(p.lat), y(p.lat, p.z));
      }
      sctx.lineWidth = 1.8; sctx.lineCap = 'round';
      for (const [k, sti] of Object.entries(stier)) { sctx.strokeStyle = FARVER[k]; sctx.stroke(sti); }
    }
    tegn(s, t);
  }

  function tegn(s, t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, B, H);
    const b = baelter(s.maaned), itk = itkMiddel(s.maaned);

    // Himmel op til tropopausen.
    const himmel = ctx.createLinearGradient(0, M.t, 0, jordY());
    himmel.addColorStop(0, '#bcdcef'); himmel.addColorStop(1, '#f1f8fb');
    ctx.beginPath(); ctx.moveTo(x(-90), jordY());
    for (let l = -90; l <= 90; l += 2) ctx.lineTo(x(l), y(l, 1));
    ctx.lineTo(x(90), jordY()); ctx.closePath();
    ctx.fillStyle = himmel; ctx.fill();
    ctx.setLineDash([5, 4]); ctx.strokeStyle = '#17211f88'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let l = -90; l <= 90; l += 2) ctx[l === -90 ? 'moveTo' : 'lineTo'](x(l), y(l, 1)); ctx.stroke();
    ctx.setLineDash([]);

    // Solen over sin bredde.
    const sol = solbredde(s.maaned), sx = x(sol);
    ctx.strokeStyle = '#ffb30099'; ctx.lineWidth = 2;
    for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(sx + dx, M.t - 4); ctx.lineTo(sx + dx, M.t + 14); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(sx, M.t - 10, 8, 0, 2 * Math.PI); ctx.fillStyle = '#ffb300'; ctx.fill();
    ctx.strokeStyle = '#17211f'; ctx.lineWidth = 1.5; ctx.stroke();

    // Fremhævede celler.
    const omraader = s.rotation > 0.5
      ? { hadley: [[b.sydHoej, b.nordHoej]], tre: [[-90, 90]], ferrel: [[b.sydFront, b.sydHoej], [b.nordHoej, b.nordFront]] }
      : {};
    const fremhaev = { itk: [[itk - 8, itk + 8]], hadley: omraader.hadley, monsun: [[itk - 8, itk + 8]], sol: [[sol - 6, sol + 6]] }[s.fremhaev];
    if (fremhaev) {
      ctx.fillStyle = 'rgba(255,179,0,0.18)';
      for (const [a, c] of fremhaev) ctx.fillRect(x(a), M.t, x(c) - x(a), jordY() - M.t);
    }

    // Luftringene.
    ctx.drawImage(spor, 0, 0, B, H);

    // Tordensky ved ITK og fronternes skyer.
    sky(x(itk), y(itk, 0.25), y(itk, 0.96), 1, t);
    if (s.rotation > 0.5) {
      sky(x(b.nordFront), y(b.nordFront, 0.22), y(b.nordFront, 0.45), 0.6, t + 2);
      sky(x(b.sydFront), y(b.sydFront, 0.22), y(b.sydFront, 0.45), 0.6, t + 4);
    }

    // Jorden: regn ved ITK, ørken ved højtrykkene, is ved polerne.
    const jy = jordY();
    for (let l = -90; l < 90; l += 1) {
      let farve = '#b9d49c';
      if (Math.abs(l - itk) < 8) farve = '#6fb85c';
      else if (s.rotation > 0.5 && (Math.abs(l - b.nordHoej) < 7 || Math.abs(l - b.sydHoej) < 7)) farve = '#f0bd68';
      if (Math.abs(l) > 72) farve = '#eef4f8';
      ctx.fillStyle = farve; ctx.fillRect(x(l), jy, x(l + 1) - x(l) + 0.5, 9);
    }
    ctx.strokeStyle = '#17211f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x(-90), jy); ctx.lineTo(x(90), jy); ctx.stroke();

    // Tryk ved jorden.
    const trykmaerker = [[itk, 'L'], [90, 'H'], [-90, 'H']];
    if (s.rotation > 0.5) trykmaerker.push([b.nordHoej, 'H'], [b.sydHoej, 'H'], [b.nordFront, 'L'], [b.sydFront, 'L']);
    if (s.etiketter) for (const [l, bog] of trykmaerker) {
      const cx = Math.max(M.v + 9, Math.min(B - M.h - 9, x(l)));
      ctx.beginPath(); ctx.arc(cx, jy - 11, 8.5, 0, 2 * Math.PI);
      ctx.fillStyle = bog === 'L' ? '#17211f' : '#fff9ee'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#17211f'; ctx.stroke();
      ctx.fillStyle = bog === 'L' ? '#fff9ee' : '#17211f';
      ctx.font = '800 11px Archivo, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(bog, cx, jy - 10.5);
    }

    // Cellenavne.
    if (s.etiketter) {
      ctx.font = '700 11px Archivo, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const navne = s.rotation > 0.5
        ? [[(itk + b.nordHoej) / 2, 'Hadley'], [(itk + b.sydHoej) / 2, 'Hadley'], [(b.nordHoej + b.nordFront) / 2, 'Ferrel'],
          [(b.sydHoej + b.sydFront) / 2, 'Ferrel'], [(b.nordFront + 90) / 2, 'Polar'], [(b.sydFront - 90) / 2, 'Polar']]
        : [[(itk + 90) / 2, 'Én celle'], [(itk - 90) / 2, 'Én celle']];
      for (const [l, n] of navne) {
        const w = ctx.measureText(n).width + 10, cx = x(l), cy = y(l, 0.5);
        ctx.fillStyle = '#fff9eee6'; ctx.strokeStyle = '#17211f'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - 9, w, 18, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#17211f'; ctx.fillText(n, cx, cy + 0.5);
      }
      if (s.rotation > 0.5) {
        ctx.font = '600 10px "IBM Plex Mono", monospace';
        for (const l of [b.nordHoej, b.sydHoej]) ctx.fillText('jet ⊙', x(l), y(l, 0.97) - 2);
      }
    }

    // Akse.
    ctx.fillStyle = '#17211f'; ctx.font = '500 10px "IBM Plex Mono", monospace'; ctx.textBaseline = 'top';
    for (const [l, n] of [[-90, 'Sydpol'], [-30, '30° S'], [0, '0°'], [30, '30° N'], [90, 'Nordpol']]) {
      ctx.textAlign = l === -90 ? 'left' : l === 90 ? 'right' : 'center';
      ctx.fillText(n, x(l), jy + 13);
    }
    ctx.save(); ctx.translate(11, (M.t + jy) / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#49615b'; ctx.fillText('højde (overdrevet)', 0, 0); ctx.restore();
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#49615b';
    ctx.fillText('tropopause', B - M.h - 2, y(85, 1) - 4);
  }

  // Tordensky (ITK) eller lav frontsky: mange overlappende puffer.
  function sky(cx, bund, top, skala, t) {
    const puls = 1 + 0.05 * Math.sin(t * 1.3);
    const hoej = (bund - top) * puls;
    const r = 8 * skala;
    const n = Math.max(3, Math.round(hoej / (r * 0.7)));
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = '#17211f44'; ctx.lineWidth = 1;
    ctx.beginPath();
    const puf = (x, yy, rr) => { ctx.moveTo(x + rr, yy); ctx.arc(x, yy, rr, 0, 2 * Math.PI); };
    for (let i = 0; i <= n; i++) {
      const yy = bund - hoej * i / n;
      const bred = skala >= 1 ? 1.15 - 0.35 * i / n : 1.6;
      for (const s of [-1, 0, 1]) puf(cx + s * r * 0.75 * bred + Math.sin(i * 2.1 + s) * 1.5, yy, r * (0.75 + 0.2 * Math.sin(i * 1.7 + s * 2)));
    }
    // Ambolten under tropopausen.
    if (skala >= 1) { ctx.moveTo(cx + r * 3.4, bund - hoej); ctx.ellipse(cx, bund - hoej, r * 3.4, r * 0.7, 0, 0, 2 * Math.PI); }
    ctx.shadowColor = '#17211f40'; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.restore();
    // Regn.
    ctx.strokeStyle = '#0e86c8aa'; ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) {
      const off = (t * 40 + i * 13) % 14;
      ctx.beginPath(); ctx.moveTo(cx + i * 5 * skala, bund + 8 + off * 0.3); ctx.lineTo(cx + i * 5 * skala - 2, bund + 14 + off * 0.3); ctx.stroke();
    }
  }

  return { tilpas, trin };
}
