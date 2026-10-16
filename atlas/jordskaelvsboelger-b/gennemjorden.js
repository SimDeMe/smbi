// Del 3: Bølgerne gennem hele Jorden. Strålerne beregnes i jordmodel.js; her tegnes
// snittet, bølgefronterne, skyggezonerne, et seismogram og gangtidskurven.
import { R, GRAENSER, vifte, ankomsterVed } from './jordmodel.js';
import { FARVE, tilpas, loekke, roligBevaegelse, tal, minSek, el } from './laerred.js';

const LYS_P = '#8fd3ff', LYS_S = '#ff8fb3', TMAKS = 1560;
const KM_PR_GRAD = 2 * Math.PI * R / 360;   // ≈ 111,2 km

const FASETEKST = {
  P: 'P gennem kappen', PKP: 'P gennem den ydre kerne', PKiKP: 'P kastet tilbage fra den indre kerne',
  PKIKP: 'P gennem den indre kerne', S: 'S gennem kappen'
};

export function start(rod) {
  const canvas = rod.querySelector('#jord');
  const urtekst = rod.querySelector('#jord-ur');
  const tid = rod.querySelector('#jord-tid');
  const afspil = rod.querySelector('#jord-afspil');
  const afstand = rod.querySelector('#jord-afstand'), afstandUd = rod.querySelector('#jord-afstand-ud');
  const seismoLaerred = rod.querySelector('#jord-seismo'), aflaes = rod.querySelector('#jord-aflaes');
  const tekstkort = rod.querySelector('#jord-tekst');
  const gangtidLaerred = rod.querySelector('#gangtid');
  const knap = { p: rod.querySelector('#jord-p'), s: rod.querySelector('#jord-s'), kerne: rod.querySelector('#jord-kerne'), straaler: rod.querySelector('#jord-straaler') };
  const vis = { p: true, s: true, kerne: true, straaler: true };

  // Få stråler til tegningen, mange til gangtider og seismogram (beregnes bagefter).
  const synlige = { P: { true: vifte({ type: 'P' }), false: null }, S: vifte({ type: 'S' }) };
  const taette = { P: { true: null, false: null }, S: null };
  const beregnTaette = () => {
    taette.P.true ??= vifte({ type: 'P', taet: 0.05, flad: 0.25, trin: 12 });
    taette.S ??= vifte({ type: 'S', taet: 0.2, flad: 0.25, trin: 12 });
    taette.P.false ??= vifte({ type: 'P', indreKerne: false, taet: 0.05, flad: 0.25, trin: 12 });
    synlige.P.false ??= vifte({ type: 'P', indreKerne: false });
  };
  let t = Number(tid.value);

  // Skyggezonernes kanter, som de kommer ud af beregningen.
  function zoner() {
    const kilde = taette.P.false ? { P: taette.P.false, S: taette.S } : { P: synlige.P.true, S: synlige.S };
    const lander = s => s.slut === 'overflade';
    const pMaks = Math.max(...kilde.P.filter(s => lander(s) && s.navn === 'P').map(s => s.afstand));
    const pkpMin = taette.P.false ? Math.min(...taette.P.false.filter(s => lander(s) && s.navn === 'PKP').map(s => s.afstand)) : 143.7;
    const sMaks = Math.max(...kilde.S.filter(lander).map(s => s.afstand));
    return { pMaks, pkpMin, sMaks };
  }

  // ---------- Snittet ----------
  function tegn() {
    const { ctx, w, h } = tilpas(canvas);
    ctx.clearRect(0, 0, w, h);
    if (w < 100 || h < 100) return;
    const rpx = Math.max(60, Math.min(w, h) / 2 - 38);
    const cx = w / 2, cy = h / 2 + 6, s = rpx / R;
    const P = x => [cx + x[0] * s, cy - x[1] * s];
    const vedVinkel = (grader, r) => [cx + r * Math.sin(grader * Math.PI / 180), cy - r * Math.cos(grader * Math.PI / 180)];

    // Roligt koordinatnet og en ydre målring giver snittet samme feltpræg som kortet.
    ctx.strokeStyle = '#b5d5df0b'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = cx % 40; x < w; x += 40) { ctx.moveTo(x, 34); ctx.lineTo(x, h); }
    for (let y = cy % 40 + 40; y < h; y += 40) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    ctx.strokeStyle = '#b5d5df20'; ctx.beginPath(); ctx.arc(cx, cy, rpx + 27, 0, 7); ctx.stroke();
    for (let g = 0; g < 360; g += 5) {
      const [x1, y1] = vedVinkel(g, rpx + 25), [x2, y2] = vedVinkel(g, rpx + (g % 30 === 0 ? 31 : 28));
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    // Lagene
    const kappe = ctx.createRadialGradient(cx, cy, (R - GRAENSER.cmb) * s, cx, cy, rpx);
    kappe.addColorStop(0, '#684434'); kappe.addColorStop(0.65, '#9b6850'); kappe.addColorStop(1, '#b58c68');
    ctx.fillStyle = kappe; ctx.beginPath(); ctx.arc(cx, cy, rpx, 0, 7); ctx.fill();
    const rc = (R - GRAENSER.cmb) * s, ri = (R - GRAENSER.icb) * s;
    const kerne = ctx.createRadialGradient(cx, cy, ri, cx, cy, rc);
    kerne.addColorStop(0, '#e9b653'); kerne.addColorStop(1, '#b97530');
    ctx.fillStyle = kerne; ctx.beginPath(); ctx.arc(cx, cy, rc, 0, 7); ctx.fill();
    // Flydende: bløde strømhvirvler i den ydre kerne
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rc, 0, 7); ctx.arc(cx, cy, vis.kerne ? ri : 0, 0, 7, true); ctx.clip();
    ctx.strokeStyle = 'rgba(255,230,180,.13)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      const rr = ri * 0.6 + (rc - ri * 0.6) * (k + 0.5) / 7;
      for (let v = 0; v <= 360; v += 4) {
        const bolge = rr + Math.sin(v * Math.PI / 30 + k) * rpx * 0.012;
        const [x, y] = vedVinkel(v, bolge); v ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    if (vis.kerne) {
      const indre = ctx.createRadialGradient(cx - ri * 0.3, cy - ri * 0.3, 0, cx, cy, ri);
      indre.addColorStop(0, '#fff2b8'); indre.addColorStop(1, '#f2c14e');
      ctx.fillStyle = indre; ctx.beginPath(); ctx.arc(cx, cy, ri, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
    for (const r of [rc, ...(vis.kerne ? [ri] : [])]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); }
    ctx.strokeStyle = '#e8d9b5'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, rpx, 0, 7); ctx.stroke();

    // Lagnavne langs den lodrette akse nedad (hvor der er færrest stråler at dække)
    ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
    const navn = (tekst, r, lys = true) => {
      const y = cy + r;
      ctx.fillStyle = lys ? 'rgba(255,255,255,.88)' : 'rgba(40,25,10,.85)';
      ctx.fillText(tekst, cx, y);
    };
    if (rpx > 120) {
      if (rpx < 200) ctx.font = '600 9.5px "IBM Plex Mono", monospace';
      navn('KAPPE · FAST', (rc + rpx) / 2 + 4);
      navn(vis.kerne ? 'YDRE KERNE · FLYDENDE' : 'KERNE · FLYDENDE', vis.kerne ? (rc + ri) / 2 + 4 : rc * 0.55);
      if (vis.kerne) navn('INDRE KERNE', 4, false), navn('FAST', 17, false);
      ctx.font = '500 9.5px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.textAlign = 'left';
      ctx.fillText('2 891 km', cx + 6, cy + rc - 4);
      if (vis.kerne) ctx.fillText('5 150 km', cx + 6, cy + ri - 4);
    }
    ctx.textAlign = 'left';

    // Skyggezoner uden for overfladen
    const z = zoner();
    const bue = (fra, til, r, bredde, farve, tekst) => {
      for (const side of [1, -1]) {
        ctx.save();
        ctx.beginPath();
        const a0 = -Math.PI / 2 + side * fra * Math.PI / 180, a1 = -Math.PI / 2 + side * til * Math.PI / 180;
        ctx.arc(cx, cy, r + bredde, a0, a1, side < 0); ctx.arc(cx, cy, r, a1, a0, side > 0); ctx.closePath();
        ctx.fillStyle = farve + '33'; ctx.fill(); ctx.clip();
        ctx.strokeStyle = farve; ctx.lineWidth = 1.5;
        for (let k = -rpx * 1.5; k < rpx * 1.5; k += 6) { ctx.beginPath(); ctx.moveTo(cx + k - rpx, cy - rpx * 1.5); ctx.lineTo(cx + k + rpx, cy + rpx * 1.5); ctx.stroke(); }
        ctx.restore();
      }
      if (tekst && rpx > 200) {
        const midt = (fra + til) / 2;
        const [x, y] = vedVinkel(midt, r + bredde + 12);
        ctx.fillStyle = farve; ctx.font = '600 10px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
        ctx.fillText(tekst, Math.min(x, w - ctx.measureText(tekst).width - 4), y);
      }
    };
    if (vis.p) bue(z.pMaks, z.pkpMin, rpx + 3, 7, '#ffd36b', `P-skygge ${Math.round(z.pMaks)}°–${Math.round(z.pkpMin)}°`);
    if (vis.s) bue(z.sMaks, 180, rpx + (vis.p ? 13 : 3), 7, '#ff6f9c', vis.p ? '' : `S-skygge > ${Math.round(z.sMaks)}°`);
    if (vis.s && vis.p && rpx > 200) {
      const [x, y] = vedVinkel(165, rpx + 30);
      ctx.fillStyle = '#ff8fb3'; ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.fillText(`S-skygge > ${Math.round(z.sMaks)}°`, Math.min(x + 4, w - 120), y + 8);
    }

    // Gradinddeling
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1;
    ctx.font = '500 9.5px "IBM Plex Mono", monospace';
    for (let g = 10; g < 180; g += 10) {
      for (const side of [1, -1]) {
        const [x1, y1] = vedVinkel(side * g, rpx - 5), [x2, y2] = vedVinkel(side * g, rpx);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      if (g % 30 === 0 && rpx > 110) {
        const [x, y] = vedVinkel(g, rpx - 16);
        ctx.textAlign = 'center'; ctx.fillText(`${g}°`, x, y + 3);
      }
    }
    ctx.textAlign = 'left';

    // Stråler og bølgefronter
    const lagP = synlige.P[String(vis.kerne)] || synlige.P.true;
    const grupper = [];
    if (vis.p) grupper.push([lagP, LYS_P, false]);
    if (vis.s) grupper.push([synlige.S, LYS_S, true]);
    if (vis.straaler) {
      for (const [straaler, farve, stiplet] of grupper) {
        ctx.strokeStyle = farve; ctx.globalAlpha = 0.18; ctx.lineWidth = 1; ctx.setLineDash(stiplet ? [4, 3] : []);
        for (const st of straaler) for (const side of [1, -1]) {
          ctx.beginPath();
          const pkt = st.punkter;
          for (let k = 0; k < pkt.length; k += 3) { const [x, y] = P([side * pkt[k].x, pkt[k].y]); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          const [x, y] = P([side * pkt[pkt.length - 1].x, pkt[pkt.length - 1].y]); ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    for (const [straaler, farve] of grupper) {
      for (const side of [1, -1]) {
        let forrige = null;
        for (const st of straaler) {
          const pos = positionVed(st, t);
          if (pos.aktiv) {
            const [x, y] = P([side * pos.x, pos.y]);
            if (forrige && forrige.navn === st.navn && Math.hypot(forrige.x - x, forrige.y - y) < rpx * 0.18) {
              ctx.strokeStyle = farve; ctx.lineWidth = 8; ctx.globalAlpha = 0.12;
              ctx.beginPath(); ctx.moveTo(forrige.x, forrige.y); ctx.lineTo(x, y); ctx.stroke();
              ctx.lineWidth = 2.5; ctx.globalAlpha = 0.95; ctx.stroke(); ctx.globalAlpha = 1;
            }
            ctx.fillStyle = farve; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill();
            forrige = { x, y, navn: st.navn };
          } else {
            forrige = null;
            const efter = t - st.tid;
            const slut = st.punkter[st.punkter.length - 1];
            const [x, y] = P([side * slut.x, slut.y]);
            if (st.slut === 'stoppet' && efter >= 0 && efter < 90) {
              // S-bølgen dør ved kernen
              ctx.strokeStyle = farve; ctx.globalAlpha = 1 - efter / 90; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke();
              ctx.globalAlpha = 1;
            } else if (st.slut === 'overflade' && efter >= 0 && efter < 70) {
              ctx.fillStyle = farve; ctx.globalAlpha = 0.85 * (1 - efter / 70);
              ctx.beginPath(); ctx.arc(x, y, 4 + efter / 7, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
            }
          }
        }
      }
    }

    // Skælvet og seismografen
    const [kx, ky] = P([0, R]);
    stjerne(ctx, kx, ky - 2, 11);
    const g = Number(afstand.value);
    const [sx, sy] = vedVinkel(g, rpx + 2);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(g * Math.PI / 180);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -14); ctx.lineTo(8, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    urtekst.textContent = minSek(t).replace(' min ', ':').replace(' s', '').replace(/:(\d)$/, ':0$1');
  }

  // Hvor er strålen til tiden t? Binær søgning i punkterne.
  function positionVed(st, tt) {
    const pkt = st.punkter;
    if (tt > st.tid || tt < 0) return { aktiv: false };
    let lo = 0, hi = pkt.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pkt[m].t < tt) lo = m; else hi = m; }
    const a = pkt[lo], b = pkt[hi], u = (tt - a.t) / ((b.t - a.t) || 1);
    return { aktiv: true, x: a.x + u * (b.x - a.x), y: a.y + u * (b.y - a.y) };
  }

  // ---------- Seismogram ved den valgte afstand ----------
  function ankomsterNu(g) {
    const pkilde = taette.P[String(vis.kerne)] || synlige.P[String(vis.kerne)] || synlige.P.true;
    const skilde = taette.S || synlige.S;
    const ud = [];
    if (vis.p) ud.push(...samle(ankomsterVed(pkilde, g)));
    if (vis.s) ud.push(...samle(ankomsterVed(skilde, g)));
    return ud.sort((a, b) => a.tid - b.tid);
  }
  // Ankomster tæt på hinanden (fx flere P-veje i den øvre kappe) slås sammen.
  function samle(liste) {
    const ud = [];
    for (const a of liste) {
      const sidste = ud[ud.length - 1];
      if (sidste && a.tid - sidste.tid < 8 && (a.navn === sidste.navn || a.navn.startsWith('PK') === sidste.navn.startsWith('PK'))) {
        sidste.taethed += a.taethed;
        if (a.navn === 'PKIKP') sidste.navn = sidste.navn === 'PKiKP' ? 'PKIKP' : sidste.navn;
      } else ud.push({ ...a });
    }
    return ud;
  }
  // Skematisk styrke: tæt landende stråler giver kraftigere udslag; S er større end P,
  // og bølgerne fra den indre kerne er svage.
  const styrke = a => Math.max(0.5, Math.min(1, Math.sqrt(a.taethed / 0.15))) * (a.navn === 'PKIKP' || a.navn === 'PKiKP' ? 0.55 : 1) * (a.navn === 'S' ? 1.5 : 1);

  function tegnSeismo() {
    const { ctx, w, h } = tilpas(seismoLaerred);
    if (w < 60) return;
    const g = Number(afstand.value);
    const liste = ankomsterNu(g);
    const x0 = 8, x1 = w - 8, tx = s => x0 + s / TMAKS * (x1 - x0), midt = h * 0.58;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(23,33,31,.12)'; ctx.lineWidth = 1;
    ctx.font = '500 9px "IBM Plex Mono", monospace'; ctx.fillStyle = FARVE.slate;
    for (let m = 0; m <= 26; m += 2) { const x = tx(m * 60); ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, h - 12); ctx.stroke(); if (m % 4 === 0 && m < 24) ctx.fillText(m ? `${m}` : '0 min', x + 2, h - 3); }
    // Kurven: stille, indtil bølgerne kommer
    const maks = 1.5;
    ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1; ctx.beginPath();
    const rnd = (k) => Math.sin(k * 12.9898) * 43758.5453 % 1;
    for (let px = x0; px <= x1; px++) {
      const s = (px - x0) / (x1 - x0) * TMAKS;
      let u = 0.03 * rnd(px);
      for (const a of liste) {
        const d = s - a.tid;
        if (d < 0) continue;
        const f = a.navn === 'S' ? 0.11 : 0.2;
        u += styrke(a) / maks * Math.exp(-d / (a.navn === 'S' ? 40 : 22)) * Math.sin(2 * Math.PI * f * d * 3) * Math.min(1, d / 3);
      }
      const y = midt - u * (h * 0.4);
      px === x0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
    }
    ctx.stroke();
    for (const a of liste) {
      const x = tx(a.tid), farve = a.navn === 'S' ? FARVE.s : FARVE.p;
      ctx.fillStyle = farve; ctx.fillRect(x - 1, 2, 2, 10);
      ctx.font = '700 10px "IBM Plex Mono", monospace'; ctx.fillText(a.navn, x + 3, 11);
    }
    // Nu-linje
    ctx.strokeStyle = FARVE.ink; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(tx(t), 2); ctx.lineTo(tx(t), h - 12); ctx.stroke(); ctx.setLineDash([]);

    afstandUd.textContent = `${g}°`;
    const km = Math.round(g * KM_PR_GRAD / 100) * 100;
    const p = liste.filter(a => a.navn !== 'S'), sb = liste.find(a => a.navn === 'S');
    const direkteP = p.find(a => a.navn === 'P');
    const dele = [`${g}° svarer til ca. ${km.toLocaleString('da-DK')} km langs overfladen.`];
    if (p.length) dele.push(`Første P: ${minSek(p[0].tid)} (${FASETEKST[p[0].navn]}).`);
    if (sb) dele.push(`S: ${minSek(sb.tid)}. S − P = ${minSek(sb.tid - p[0].tid)}.`);
    if (!direkteP && vis.p) {
      if (p.length && p[0].navn === 'PKP') dele.push('P-bølgen er gået gennem kernen. Den er bremset og bøjet, så den kommer senere end en lige vej ville give.');
      else if (p.length) dele.push('Du er i P-skyggezonen. De svage P-bølger her har ramt den indre kerne – det var dem, Inge Lehmann fandt i 1936.');
      else if (g > 90) dele.push(vis.kerne ? 'Helt stille: Du er i skyggezonen.' : 'Helt stille: Uden indre kerne lander ingen P-bølger her.');
    }
    if (!sb && vis.s && g > 95) dele.push('Ingen S-bølger: De kan ikke komme gennem den flydende ydre kerne.');
    aflaes.textContent = dele.join(' ');
  }

  // ---------- Gangtidskurve ----------
  function tegnGangtid() {
    if (!rod.querySelector('#gangtid').closest('details').open) return;
    const { ctx, w, h } = tilpas(gangtidLaerred);
    const x0 = 30, x1 = w - 8, y0 = h - 22, y1 = 8;
    const tx = g => x0 + g / 180 * (x1 - x0), ty = s => y0 - s / TMAKS * (y0 - y1);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(23,33,31,.12)'; ctx.lineWidth = 1; ctx.font = '500 9px "IBM Plex Mono", monospace'; ctx.fillStyle = FARVE.slate;
    for (let g = 0; g <= 180; g += 30) { ctx.beginPath(); ctx.moveTo(tx(g), y0); ctx.lineTo(tx(g), y1); ctx.stroke(); ctx.fillText(`${g}°`, tx(g) - 6, h - 9); }
    for (let m = 0; m <= 25; m += 5) { ctx.beginPath(); ctx.moveTo(x0, ty(m * 60)); ctx.lineTo(x1, ty(m * 60)); ctx.stroke(); ctx.fillText(`${m}`, 6, ty(m * 60) + 3); }
    ctx.fillText('min', 4, y1 + 2);
    ctx.textAlign = 'right'; ctx.fillText('afstand fra skælvet →', x1 - 2, y0 - 4); ctx.textAlign = 'left';
    const pkilde = taette.P[String(vis.kerne)] || synlige.P[String(vis.kerne)] || synlige.P.true;
    const skilde = taette.S || synlige.S;
    for (const [kilde, farve, vises] of [[pkilde, FARVE.p, vis.p], [skilde, FARVE.s, vis.s]]) {
      if (!vises) continue;
      for (const st of kilde) {
        if (st.slut !== 'overflade' || st.tid > TMAKS) continue;
        ctx.fillStyle = farve; ctx.globalAlpha = st.navn === 'PKIKP' || st.navn === 'PKiKP' ? 0.5 : 0.9;
        ctx.fillRect(tx(st.afstand) - 1, ty(st.tid) - 1, 2.2, 2.2);
      }
      ctx.globalAlpha = 1;
    }
    const g = Number(afstand.value);
    ctx.strokeStyle = FARVE.ink; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(tx(g), y0); ctx.lineTo(tx(g), y1); ctx.moveTo(x0, ty(t)); ctx.lineTo(x1, ty(t)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = FARVE.p; ctx.font = '700 10px "IBM Plex Mono", monospace'; ctx.fillText('P', tx(70), ty(720) - 6);
    if (vis.s) { ctx.fillStyle = FARVE.s; ctx.fillText('S', tx(70), ty(1280) - 6); }
    if (vis.p) { ctx.fillStyle = FARVE.p; ctx.fillText('PKP', tx(150), ty(1190) - 6); }
  }

  function opdaterTekst() {
    tekstkort.replaceChildren();
    tekstkort.append(el('h2', vis.kerne ? 'Hvad bølgerne afslører' : 'Jorden før 1936'));
    const punkter = vis.kerne ? [
      'Farten stiger med dybden, så strålerne bøjer i buer op mod overfladen igen.',
      'Ved kernen falder P-farten brat fra 13,7 til 8,0 km/s. Strålerne knækker, og bag ca. 100° opstår <b>P-skyggezonen</b>.',
      '<b>S-bølgerne stopper ved kernen.</b> Det viser, at den ydre kerne er flydende.',
      'Svage P-bølger lander alligevel inde i skyggezonen. Den danske seismolog <b>Inge Lehmann</b> forklarede dem i 1936 med en fast <b>indre kerne</b>, hvor farten er højere.'
    ] : [
      'Slå den indre kerne fra, og Jorden har kun en flydende kerne – som man troede før 1936.',
      'Nu lander der <b>ingen</b> P-bølger mellem ca. 100° og 144°. Det passede ikke med målingerne.',
      'Slå den indre kerne til igen, og se de svage bølger, Lehmann opdagede.'
    ];
    const ul = el('ul');
    for (const p of punkter) { const li = el('li'); li.innerHTML = p; ul.append(li); }
    tekstkort.append(ul);
  }

  function tegnAlt() { tegn(); tegnSeismo(); tegnGangtid(); }

  const loop = loekke(dt => {
    t = Math.min(TMAKS, t + dt * 60);
    tid.value = String(Math.round(t));
    tegnAlt();
    if (t >= TMAKS) { stopAfspil(); return false; }
  });
  function stopAfspil() { afspil.setAttribute('aria-pressed', 'false'); afspil.textContent = '▶'; afspil.setAttribute('aria-label', 'Afspil bølgerne'); }
  afspil.addEventListener('click', () => {
    if (loop.koerer) { loop.stop(); stopAfspil(); return; }
    if (t >= TMAKS - 1) t = 0;
    if (roligBevaegelse()) { t = Math.min(TMAKS, t + 120); tid.value = String(t); tegnAlt(); return; }
    afspil.setAttribute('aria-pressed', 'true'); afspil.textContent = 'Ⅱ'; afspil.setAttribute('aria-label', 'Sæt bølgerne på pause');
    loop.start();
  });
  tid.addEventListener('input', () => { t = Number(tid.value); tegnAlt(); });
  tid.setAttribute('aria-valuetext', minSek(t));
  tid.addEventListener('change', () => tid.setAttribute('aria-valuetext', minSek(t)));
  afstand.addEventListener('input', () => { tegnAlt(); });
  for (const [navn, k] of Object.entries(knap)) {
    k.addEventListener('click', () => {
      vis[navn] = !vis[navn]; k.setAttribute('aria-pressed', String(vis[navn]));
      if (navn === 'kerne') { beregnTaette(); opdaterTekst(); }
      tegnAlt();
    });
  }
  rod.querySelector('#gangtid').closest('details').addEventListener('toggle', tegnGangtid);

  new ResizeObserver(() => tegnAlt()).observe(canvas);
  opdaterTekst();
  tegnAlt();
  // De tætte strålevifter beregnes lige efter første tegning.
  setTimeout(() => { beregnTaette(); tegnAlt(); }, 30);

  return { vis() { tegnAlt(); }, skjul() { loop.stop(); stopAfspil(); } };
}

function stjerne(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const v = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + rr * Math.cos(v), y + rr * Math.sin(v));
  }
  ctx.closePath(); ctx.fillStyle = FARVE.s; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
}
