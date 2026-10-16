// Del 2: Find et skjult skælv. Seismogrammerne beregnes med modellen i model.js;
// eleven aflæser P og S, får en cirkel pr. station og gætter epicentret.
import { VP, VS, K, ankomster, seismogram, magnitude, afstandFraSP, skaering, rng } from './model.js';
import { FARVE, tilpas, loekke, roligBevaegelse, tal, el } from './laerred.js';

const OMRAADE = { w: 500, h: 360 };       // km
const STARTSTATIONER = [[105, 95], [395, 80], [250, 300], [440, 275]];
const NAVNE = ['A', 'B', 'C', 'D'];

export function start(rod) {
  const kortlaerred = rod.querySelector('#kort');
  const sporrum = rod.querySelector('#spor');
  const startknap = rod.querySelector('#start');
  const afsloerknap = rod.querySelector('#afsloer');
  const nytknap = rod.querySelector('#nyt');
  const fronterknap = rod.querySelector('#fronter');
  const resultat = rod.querySelector('#resultat');
  const trinliste = [...rod.querySelectorAll('#trin li')];
  const ur = rod.querySelector('#seismo-ur');
  const magStation = rod.querySelector('#mag-station'), magA = rod.querySelector('#mag-a'), magUd = rod.querySelector('#mag-ud');

  let antal = 3, stoej = 0.14, visFronter = false;
  let stationer = STARTSTATIONER.map(([x, y], i) => ({ x, y, navn: NAVNE[i], farve: FARVE.station[i] }));
  let skaelv, tilstand, tau, bud, spor = [], traek = null, kim = Math.floor(Math.random() * 1e6);

  // ---------- Skælvet ----------
  function nytSkaelv() {
    kim = (kim * 7919 + 104729) % 1000003;
    const tilfaeldig = rng(kim);
    const aktive = stationer.slice(0, antal);
    let x, y, forsoeg = 0;
    do {
      x = 40 + tilfaeldig() * (OMRAADE.w - 80); y = 40 + tilfaeldig() * (OMRAADE.h - 80); forsoeg++;
    } while (forsoeg < 50 && aktive.some(s => Math.hypot(s.x - x, s.y - y) < 35));
    // Magnitude 3–5, men aldrig så kraftigt, at nærmeste seismograf slår over 120 mm ud
    // (en Wood-Anderson-seismograf går af skalaen ved nogle hundrede mm).
    const dMin = Math.min(...aktive.map(s => Math.hypot(s.x - x, s.y - y)));
    const ML = Math.round(Math.max(2.8, Math.min(3 + tilfaeldig() * 2, magnitude(120, dMin))) * 10) / 10;
    const t0 = 3 + Math.round(tilfaeldig() * 60) / 10;
    const maksS = Math.max(...aktive.map(s => ankomster(Math.hypot(s.x - x, s.y - y)).s));
    const minP = Math.min(...aktive.map(s => ankomster(Math.hypot(s.x - x, s.y - y)).p));
    const varighed = Math.ceil((t0 + maksS + 16) / 10) * 10;
    // Seismogrammet vises fra lidt før den første P-bølge, så kurverne udnytter bredden.
    const fra = Math.max(0, Math.floor((t0 + minP - 6) / 5) * 5);
    skaelv = { x, y, ML, t0, varighed, fra, minut: 10 + Math.floor(tilfaeldig() * 50) };
    for (const [i, s] of aktive.entries()) {
      s.d = Math.hypot(s.x - x, s.y - y);
      s.optag = seismogram({ d: s.d, ML, t0, varighed, stoej, froe: kim + i * 31 });
      s.p = null; s.s = null; s.aktivt = 'P';
    }
    tilstand = 'klar'; tau = 0; bud = null;
    ur.textContent = `Sekunder efter kl. 08.${String(skaelv.minut).padStart(2, '0')}.00`;
    resultat.hidden = true;
    byggSpor();
    opdaterTrin();
    opdaterMagnitude();
    tegnAlt();
  }

  // ---------- Seismogramrækker ----------
  function byggSpor() {
    sporrum.replaceChildren();
    spor = stationer.slice(0, antal).map((s, i) => {
      const raekke = el('div', '', 'sporrad');
      const navn = el('div', '', 'navn');
      const firkant = el('i'); firkant.style.background = s.farve;
      navn.append(firkant, s.navn, el('small', 'station'));
      const c = el('canvas');
      c.tabIndex = 0;
      c.setAttribute('role', 'slider');
      c.setAttribute('aria-label', `Seismogram fra station ${s.navn}. Tryk P eller S for at vælge mærke, og flyt det med piletasterne.`);
      const flade = el('div', '', 'sporflade');
      flade.append(c);
      raekke.append(navn, flade);
      sporrum.append(raekke);
      c.addEventListener('pointerdown', e => trykSpor(e, i));
      c.addEventListener('pointermove', e => flytSpor(e, i));
      c.addEventListener('pointerup', () => { traek = null; });
      c.addEventListener('pointercancel', () => { traek = null; });
      c.addEventListener('keydown', e => tastSpor(e, i));
      return c;
    });
    new ResizeObserver(() => tegnAlt()).observe(sporrum);
  }

  const sporGeometri = (w) => ({ x0: 46, x1: w - 10 });
  function tidVed(c, clientX) {
    const boks = c.getBoundingClientRect();
    const { x0, x1 } = sporGeometri(boks.width);
    const t = skaelv.fra + (clientX - boks.left - x0) / (x1 - x0) * (skaelv.varighed - skaelv.fra);
    return Math.round(Math.max(skaelv.fra, Math.min(skaelv.varighed, t)) * 10) / 10;
  }
  function trykSpor(e, i) {
    if (tilstand === 'klar') return;
    const s = stationer[i], t = tidVed(e.currentTarget, e.clientX);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (s.p === null) { s.p = t; traek = { i, m: 'p' }; }
    else if (s.s === null) {
      if (t > s.p) { s.s = t; traek = { i, m: 's' }; } else { s.p = t; traek = { i, m: 'p' }; }
    } else {
      const m = Math.abs(t - s.p) <= Math.abs(t - s.s) ? 'p' : 's';
      s[m] = t; traek = { i, m };
    }
    s.aktivt = traek.m.toUpperCase();
    retOrden(s); efterAendring();
  }
  function flytSpor(e, i) {
    if (!traek || traek.i !== i) return;
    stationer[i][traek.m] = tidVed(e.currentTarget, e.clientX);
    retOrden(stationer[i]); efterAendring();
  }
  // P skal ligge før S; byt om, hvis mærkerne krydser.
  function retOrden(s) {
    if (s.p !== null && s.s !== null && s.s <= s.p) {
      [s.p, s.s] = [s.s, s.p];
      if (traek) traek.m = traek.m === 'p' ? 's' : 'p';
      s.aktivt = s.aktivt === 'P' ? 'S' : 'P';
      if (s.s === s.p) s.s = Math.round((s.p + 0.1) * 10) / 10;
    }
  }
  function tastSpor(e, i) {
    if (tilstand === 'klar') return;
    const s = stationer[i];
    const tast = e.key.toLowerCase();
    if (tast === 'p' || tast === 's') {
      s.aktivt = tast.toUpperCase();
      const midt = (skaelv.fra + skaelv.varighed) / 2;
      if (s[tast] === null) s[tast] = tast === 'p' ? Math.round(midt - 10) : Math.min(skaelv.varighed, Math.round((s.p ?? midt - 10) + 10));
      e.preventDefault(); retOrden(s); efterAendring(); return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') { s.p = null; s.s = null; e.preventDefault(); efterAendring(); return; }
    const skridt = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!skridt) return;
    const m = s.aktivt.toLowerCase();
    if (s[m] === null) s[m] = Math.round((skaelv.fra + skaelv.varighed) / 2 + (m === 'p' ? -10 : 0));
    s[m] = Math.round(Math.max(skaelv.fra, Math.min(skaelv.varighed, s[m] + skridt * (e.shiftKey ? 1 : 0.1))) * 10) / 10;
    e.preventDefault(); retOrden(s); efterAendring();
  }
  function efterAendring() {
    for (const [i, s] of stationer.slice(0, antal).entries()) {
      const c = spor[i];
      const dt = s.p !== null && s.s !== null ? s.s - s.p : null;
      c.setAttribute('aria-valuetext', s.p === null ? 'Ingen mærker' :
        `P ved ${tal(s.p)} s${s.s !== null ? `, S ved ${tal(s.s)} s. S minus P er ${tal(dt)} sekunder, afstand ${tal(afstandFraSP(dt), 0)} km` : ''}`);
    }
    opdaterTrin(); opdaterMagnitude(); tegnAlt();
  }

  // ---------- Kortet ----------
  let kortgeo = null;
  function tilKort(x, y) { return [kortgeo.ox + x * kortgeo.s, kortgeo.oy + y * kortgeo.s]; }
  function fraKort(px, py) { return [(px - kortgeo.ox) / kortgeo.s, (py - kortgeo.oy) / kortgeo.s]; }

  kortlaerred.addEventListener('pointerdown', e => {
    if (!kortgeo) return;
    const boks = kortlaerred.getBoundingClientRect();
    const px = e.clientX - boks.left, py = e.clientY - boks.top;
    // Før start: træk stationerne rundt.
    if (tilstand === 'klar') {
      const i = stationer.slice(0, antal).findIndex(s => Math.hypot(...tilKort(s.x, s.y).map((v, k) => v - [px, py][k])) < 22);
      if (i >= 0) { traek = { station: i }; kortlaerred.setPointerCapture?.(e.pointerId); }
      return;
    }
    if (tilstand === 'afsloeret') return;
    const [x, y] = fraKort(px, py);
    bud = { x: klem(x, 0, OMRAADE.w), y: klem(y, 0, OMRAADE.h) };
    traek = { bud: true }; kortlaerred.setPointerCapture?.(e.pointerId);
    opdaterTrin(); tegnKort();
  });
  kortlaerred.addEventListener('pointermove', e => {
    if (!traek || !kortgeo) return;
    const boks = kortlaerred.getBoundingClientRect();
    const [x, y] = fraKort(e.clientX - boks.left, e.clientY - boks.top);
    if (traek.station !== undefined) {
      const s = stationer[traek.station];
      s.x = klem(x, 10, OMRAADE.w - 10); s.y = klem(y, 10, OMRAADE.h - 10);
      tegnKort();
    } else if (traek.bud) { bud = { x: klem(x, 0, OMRAADE.w), y: klem(y, 0, OMRAADE.h) }; tegnKort(); }
  });
  const slipKort = () => { if (traek?.station !== undefined) nytSkaelv(); traek = null; };
  kortlaerred.addEventListener('pointerup', slipKort);
  kortlaerred.addEventListener('pointercancel', slipKort);
  kortlaerred.addEventListener('keydown', e => {
    if (tilstand === 'klar' || tilstand === 'afsloeret') return;
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (d) {
      e.preventDefault();
      if (!bud) bud = { x: OMRAADE.w / 2, y: OMRAADE.h / 2 };
      const skridt = e.shiftKey ? 25 : 5;
      bud = { x: klem(bud.x + d[0] * skridt, 0, OMRAADE.w), y: klem(bud.y + d[1] * skridt, 0, OMRAADE.h) };
      opdaterTrin(); tegnKort();
    } else if ((e.key === 'Enter' || e.key === ' ') && !bud) {
      e.preventDefault(); bud = { x: OMRAADE.w / 2, y: OMRAADE.h / 2 }; opdaterTrin(); tegnKort();
    }
  });

  // Højdekurver til baggrunden: et opdigtet, roligt landskab, så kortet ligner et kort.
  function hoejde(x, y) {
    return Math.sin(x / 61 + 1.3) * Math.cos(y / 47 - 0.4) + 0.6 * Math.sin((x + y) / 83) + 0.45 * Math.cos(x / 29 - y / 71) + 0.3 * Math.sin(y / 23 + x / 140);
  }
  let kurvecache = null;
  function hoejdekurver(ctx) {
    const noegle = `${kortgeo.s}|${kortgeo.ox}|${kortgeo.oy}`;
    if (!kurvecache || kurvecache.noegle !== noegle) {
      const linjer = [];
      const n = 5, nx = Math.ceil(OMRAADE.w / n), ny = Math.ceil(OMRAADE.h / n);
      const v = [];
      for (let j = 0; j <= ny; j++) { v.push([]); for (let i = 0; i <= nx; i++) v[j].push(hoejde(i * n, j * n)); }
      for (const niveau of [-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6]) {
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const hj = [v[j][i], v[j][i + 1], v[j + 1][i + 1], v[j + 1][i]];
          const kant = [];
          const hjoerner = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
          for (let k = 0; k < 4; k++) {
            const a = hj[k], b = hj[(k + 1) % 4];
            if ((a - niveau) * (b - niveau) < 0) {
              const u = (niveau - a) / (b - a), [ax, ay] = hjoerner[k], [bx, by] = hjoerner[(k + 1) % 4];
              kant.push([(ax + u * (bx - ax)) * n, (ay + u * (by - ay)) * n]);
            }
          }
          if (kant.length >= 2) linjer.push([kant[0], kant[1], niveau]);
          if (kant.length === 4) linjer.push([kant[2], kant[3], niveau]);
        }
      }
      // Svagt tonet terræn fra samme opdigtede højdefunktion som kurverne.
      // Tegnes én gang pr. størrelse, aldrig ud fra skælvets skjulte position.
      const relief = document.createElement('canvas');
      relief.width = 250; relief.height = 180;
      const rc = relief.getContext('2d'), billede = rc.createImageData(250, 180);
      for (let y = 0; y < 180; y++) for (let x = 0; x < 250; x++) {
        const z = hoejde(x * 2, y * 2);
        const lys = (hoejde(x * 2 - 3, y * 2 - 3) - z) * 14;
        const u = Math.max(0, Math.min(1, (z + 2) / 4));
        const lav = [216, 228, 215], hoej = [242, 237, 214], k = (y * 250 + x) * 4;
        for (let i = 0; i < 3; i++) billede.data[k + i] = lav[i] + u * (hoej[i] - lav[i]) + lys;
        billede.data[k + 3] = 255;
      }
      rc.putImageData(billede, 0, 0);
      kurvecache = { noegle, linjer, relief };
    }
    const [x0, y0] = tilKort(0, 0), [x1, y1] = tilKort(OMRAADE.w, OMRAADE.h);
    ctx.drawImage(kurvecache.relief, x0, y0, x1 - x0, y1 - y0);
    ctx.lineWidth = 0.8;
    for (const [a, b, niveau] of kurvecache.linjer) {
      ctx.strokeStyle = niveau >= 0 ? 'rgba(120,98,60,.24)' : 'rgba(80,120,90,.24)';
      ctx.beginPath(); ctx.moveTo(...tilKort(...a)); ctx.lineTo(...tilKort(...b)); ctx.stroke();
    }
  }

  function tegnKort() {
    const { ctx, w, h } = tilpas(kortlaerred);
    if (w < 80 || h < 80) return;
    const m = 26;
    const s = Math.min((w - 2 * m) / OMRAADE.w, (h - 2 * m - 42) / OMRAADE.h);
    kortgeo = { s, ox: (w - OMRAADE.w * s) / 2, oy: Math.max(48, (h - 18 - OMRAADE.h * s) / 2 + 10) };
    ctx.fillStyle = '#e9eee5'; ctx.fillRect(0, 0, w, h);
    const [x0, y0] = tilKort(0, 0), [x1, y1] = tilKort(OMRAADE.w, OMRAADE.h);
    ctx.fillStyle = '#f5f3e6'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    hoejdekurver(ctx);
    // 50 km-net
    ctx.strokeStyle = 'rgba(23,33,31,.12)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 50; x < OMRAADE.w; x += 50) { const [px] = tilKort(x, 0); ctx.moveTo(px, y0); ctx.lineTo(px, y1); }
    for (let y = 50; y < OMRAADE.h; y += 50) { const [, py] = tilKort(0, y); ctx.moveTo(x0, py); ctx.lineTo(x1, py); }
    ctx.stroke();

    const aktive = stationer.slice(0, antal);
    const tid = tau - skaelv.t0;
    // Bølgefronterne (kun ved afsløring eller når eleven selv har slået dem til)
    if ((visFronter || tilstand === 'afsloeret') && tilstand !== 'klar' && tid > 0) {
      const [ex, ey] = tilKort(skaelv.x, skaelv.y);
      for (const [v, farve, stiplet] of [[VP, FARVE.p, false], [VS, FARVE.s, true]]) {
        const r = v * tid * s;
        if (r > Math.hypot(w, h) * 1.5) continue;
        ctx.strokeStyle = farve; ctx.lineWidth = 2.5; ctx.setLineDash(stiplet ? [8, 6] : []);
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, 7); ctx.stroke();
        ctx.fillStyle = farve; ctx.globalAlpha = 0.06; ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.setLineDash([]);
    }
    // Afstandscirkler
    for (const st of aktive) {
      if (st.p === null || st.s === null) continue;
      const d = afstandFraSP(st.s - st.p);
      const [cx, cy] = tilKort(st.x, st.y);
      ctx.strokeStyle = st.farve; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, d * s, 0, 7); ctx.stroke();
      ctx.fillStyle = st.farve; ctx.globalAlpha = 0.07; ctx.fill(); ctx.globalAlpha = 1;
    }
    // To cirkler: markér skæringspunkterne (det er dér, skælvet kan ligge)
    const cirkler = aktive.filter(st => st.p !== null && st.s !== null).map(st => ({ x: st.x, y: st.y, r: afstandFraSP(st.s - st.p) }));
    if (cirkler.length === 2) {
      for (const p of skaering(cirkler[0], cirkler[1])) {
        const [px, py] = tilKort(p.x, p.y);
        ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.stroke();
        ctx.fillStyle = FARVE.ink; ctx.font = '700 12px Archivo, sans-serif'; ctx.fillText('?', px + 9, py - 6);
      }
    }
    ctx.restore();
    ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

    // Stationerne
    for (const st of aktive) {
      const [px, py] = tilKort(st.x, st.y);
      // Ring, når bølgerne rammer
      if (tilstand !== 'klar') {
        for (const [ta, farve] of [[ankomster(st.d).p, FARVE.p], [ankomster(st.d).s, FARVE.s]]) {
          const efter = tid - ta;
          if (efter > 0 && efter < 3) {
            ctx.strokeStyle = farve; ctx.lineWidth = 3; ctx.globalAlpha = 1 - efter / 3;
            ctx.beginPath(); ctx.arc(px, py, 10 + efter * 9, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
          }
        }
      }
      ctx.fillStyle = '#fff9eecc'; ctx.beginPath(); ctx.arc(px, py, 15, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px, py - 10); ctx.lineTo(px - 9, py + 7); ctx.lineTo(px + 9, py + 7); ctx.closePath();
      ctx.fillStyle = st.farve; ctx.fill(); ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 2; ctx.stroke();
      etiket(ctx, st.navn, px + 12, py - 12, st.farve);
      if (st.p !== null && st.s !== null) {
        ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.fillStyle = FARVE.ink;
        ctx.fillText(`${tal(afstandFraSP(st.s - st.p), 0)} km`, px + 12, py + 14);
      }
    }
    // Buddet
    if (bud) {
      const [bx, by] = tilKort(bud.x, bud.y);
      ctx.strokeStyle = '#fff9ee'; ctx.lineWidth = 4;
      const sigte = () => {
        ctx.beginPath(); ctx.arc(bx, by, 9, 0, 7);
        ctx.moveTo(bx - 15, by); ctx.lineTo(bx + 15, by); ctx.moveTo(bx, by - 15); ctx.lineTo(bx, by + 15);
      };
      sigte(); ctx.stroke();
      ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.5; sigte(); ctx.stroke();
      const naer = tilstand === 'afsloeret' && Math.hypot(bud.x - skaelv.x, bud.y - skaelv.y) * kortgeo.s < 40;
      if (!naer) { ctx.font = '600 12px Archivo, sans-serif'; ctx.fillStyle = FARVE.ink; ctx.fillText('Dit bud', bx + 12, by + 4); }
    }
    // Det rigtige epicenter
    if (tilstand === 'afsloeret') {
      const [ex, ey] = tilKort(skaelv.x, skaelv.y);
      if (bud) {
        const [bx, by] = tilKort(bud.x, bud.y);
        ctx.strokeStyle = FARVE.ink; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
      }
      stjerne(ctx, ex, ey, 13);
      ctx.font = '700 12px Archivo, sans-serif';
      const tekst = `Epicenter · M ${tal(skaelv.ML)}`, bredde = ctx.measureText(tekst).width + 10;
      etiket(ctx, tekst, ex + 14 + bredde > x1 ? ex - 14 - bredde : ex + 14, ey + 18, FARVE.s);
    }
    // Målestok og nordpil
    const [mx, my] = [x0, y1 + 14];
    ctx.fillStyle = FARVE.ink; ctx.fillRect(mx, my, 100 * s, 3); ctx.fillRect(mx, my - 4, 2, 9); ctx.fillRect(mx + 100 * s - 2, my - 4, 2, 9);
    ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.fillText('100 km', mx + 100 * s + 6, my + 5);
    ctx.textAlign = 'right'; if (x1 - x0 > 250) ctx.fillText('Net: 50 km', x1, my + 5); ctx.textAlign = 'left';
    const nx = x1 - 14, ny = y0 + 14;
    ctx.beginPath(); ctx.moveTo(nx, ny - 10); ctx.lineTo(nx + 6, ny + 7); ctx.lineTo(nx, ny + 3); ctx.lineTo(nx - 6, ny + 7); ctx.closePath(); ctx.fill();
    ctx.font = '700 10px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('N', nx, ny + 18); ctx.textAlign = 'left';
    if (tilstand === 'klar') {
      ctx.font = '600 13px Archivo, sans-serif';
      const tekst = w < 450 ? 'Placér stationer → start skælvet' : 'Træk stationerne → start skælvet';
      const tb = ctx.measureText(tekst).width + 20;
      ctx.fillStyle = '#fffdf7e8'; ctx.fillRect((w - tb) / 2, h / 2 - 16, tb, 30);
      ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.5; ctx.strokeRect((w - tb) / 2, h / 2 - 16, tb, 30);
      ctx.fillStyle = FARVE.ink; ctx.textAlign = 'center'; ctx.fillText(tekst, w / 2, h / 2 + 4); ctx.textAlign = 'left';
    }
  }

  // ---------- Seismogrammerne ----------
  function tegnSpor(i) {
    const st = stationer[i], c = spor[i];
    const { ctx, w, h } = tilpas(c);
    if (w < 60 || h < 30) return;
    const { x0, x1 } = sporGeometri(w);
    const fra = skaelv.fra, tx = t => x0 + (t - fra) / (skaelv.varighed - fra) * (x1 - x0);
    ctx.fillStyle = '#fffdf5'; ctx.fillRect(0, 0, w, h);
    // Tidsnet
    ctx.lineWidth = 1;
    for (let t = fra; t <= skaelv.varighed; t += 1) {
      ctx.strokeStyle = t % 10 === 0 ? 'rgba(23,33,31,.2)' : 'rgba(23,33,31,.06)';
      ctx.beginPath(); ctx.moveTo(tx(t), 4); ctx.lineTo(tx(t), h - 13); ctx.stroke();
    }
    ctx.fillStyle = FARVE.slate; ctx.font = '500 9.5px "IBM Plex Mono", monospace';
    for (let t = Math.ceil(fra / 10) * 10; t <= skaelv.varighed; t += 10) ctx.fillText(`${t}`, tx(t) + 2, h - 3);
    const midt = (h - 12) / 2 + 2;
    const data = st.optag.data, dtP = st.optag.dtProeve;
    // Lodret skala: pæn rund værdi over største udslag
    let maks = 0; for (let k = Math.floor(fra / dtP); k < data.length; k++) maks = Math.max(maks, Math.abs(data[k]));
    const skalaMm = paentTal(maks * 1.05);
    const ys = (midt - 6) / skalaMm;
    ctx.fillStyle = FARVE.slate; ctx.textAlign = 'right';
    ctx.fillText(`+${tal(skalaMm, skalaMm < 1 ? 1 : 0)}`, x0 - 4, midt - (midt - 6) + 8);
    ctx.fillText('0', x0 - 4, midt + 3);
    ctx.fillText(`mm`, x0 - 4, h - 3);
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(23,33,31,.25)'; ctx.beginPath(); ctx.moveTo(x0, midt); ctx.lineTo(x1, midt); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 - 2, 6); ctx.lineTo(x0 - 2, h - 18); ctx.stroke();
    // Kurven, kun så langt seismografen har skrevet. Min/maks pr. pixel, så tætte svingninger ses.
    const slut = tilstand === 'klar' ? fra : Math.max(fra, Math.min(skaelv.varighed, tau));
    ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.1; ctx.beginPath();
    const pxSlut = tx(slut);
    for (let px = x0; px <= pxSlut; px += 1) {
      const ta = fra + (px - x0) / (x1 - x0) * (skaelv.varighed - fra), tb = fra + (px + 1 - x0) / (x1 - x0) * (skaelv.varighed - fra);
      let lo = Infinity, hi = -Infinity;
      for (let k = Math.floor(ta / dtP); k <= Math.min(data.length - 1, Math.ceil(tb / dtP)); k++) { lo = Math.min(lo, data[k]); hi = Math.max(hi, data[k]); }
      if (lo === Infinity) continue;
      ctx.moveTo(px + 0.5, midt - hi * ys); ctx.lineTo(px + 0.5, midt - lo * ys - 0.6);
    }
    ctx.stroke();
    if (tilstand === 'optager' && slut < skaelv.varighed) {
      ctx.fillStyle = FARVE.s; ctx.beginPath(); ctx.arc(pxSlut, midt, 4, 0, 7); ctx.fill();
    }
    // Facit efter afsløring
    if (tilstand === 'afsloeret') {
      for (const [ta, farve] of [[st.optag.tP, FARVE.p], [st.optag.tS, FARVE.s]]) {
        ctx.fillStyle = farve;
        ctx.beginPath(); ctx.moveTo(tx(ta), h - 13); ctx.lineTo(tx(ta) - 5, h - 4); ctx.lineTo(tx(ta) + 5, h - 4); ctx.closePath(); ctx.fill();
      }
    }
    // Elevens mærker
    const fokus = document.activeElement === c;
    for (const [m, farve, stiplet] of [['p', FARVE.p, false], ['s', FARVE.s, true]]) {
      if (st[m] === null) continue;
      const x = tx(st[m]);
      ctx.strokeStyle = farve; ctx.lineWidth = fokus && st.aktivt === m.toUpperCase() ? 3 : 2; ctx.setLineDash(stiplet ? [5, 3] : []);
      ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x, h - 13); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = farve; ctx.fillRect(x - 9, 1, 18, 15);
      ctx.fillStyle = '#fff'; ctx.font = '700 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(m.toUpperCase(), x, 12); ctx.textAlign = 'left';
    }
    if (st.p !== null && st.s !== null) {
      const a = tx(st.p), b = tx(st.s), y = 8;
      ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(a + 10, y); ctx.lineTo(b - 10, y); ctx.stroke();
      const dt = st.s - st.p;
      const tekst = `Δt = ${tal(dt)} s  →  ${tal(K, 1)} · ${tal(dt)} = ${tal(afstandFraSP(dt), 0)} km`;
      ctx.font = '600 11px "IBM Plex Mono", monospace';
      const tb = ctx.measureText(tekst).width;
      const tx0 = Math.min(x1 - tb - 4, Math.max(b + 12, x0));
      const placering = tx0 + tb > x1 ? x0 + 4 : tx0;
      ctx.fillStyle = '#fffdf5e0'; ctx.fillRect(placering - 3, 18, tb + 6, 15);
      ctx.fillStyle = FARVE.ink; ctx.fillText(tekst, placering, 29);
    } else if (tilstand !== 'klar' && st.p === null && slut >= skaelv.varighed) {
      ctx.font = '600 11px Archivo, sans-serif'; ctx.fillStyle = FARVE.slate;
      ctx.fillText('Klik ved P-bølgens start', x1 - 140, 14);
    }
    if (fokus) { ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 2; ctx.strokeRect(1, 1, w - 2, h - 2); }
  }

  function tegnAlt() {
    if (!skaelv || !spor.length) return;
    tegnKort();
    spor.forEach((_, i) => tegnSpor(i));
  }

  // ---------- Trin og knapper ----------
  function opdaterTrin() {
    const aktive = stationer.slice(0, antal);
    const aflaest = aktive.filter(s => s.p !== null && s.s !== null).length;
    const status = [
      tilstand !== 'klar',
      aflaest === antal,
      aflaest === antal,
      tilstand === 'afsloeret'
    ];
    const aktivTrin = tilstand === 'klar' ? 0 : tilstand === 'afsloeret' ? -1 : aflaest < antal ? 1 : 3;
    trinliste.forEach((li, i) => { li.classList.toggle('faerdig', status[i]); li.classList.toggle('aktiv', i === aktivTrin || (aktivTrin === 1 && i === 2 && aflaest > 0)); });
    startknap.textContent = tilstand === 'klar' ? '▶ Start skælvet' : tilstand === 'optager' ? '⏩ Spring frem' : '▶ Afspil igen';
    startknap.disabled = false;
    rod.querySelector('#start-mobil').textContent = tilstand === 'klar' ? '▶ Start' : tilstand === 'optager' ? '⏩ Frem' : '▶ Igen';
    afsloerknap.disabled = !bud || tilstand === 'klar' || tilstand === 'afsloeret';
    for (const k of rod.querySelectorAll('[data-antal]')) k.disabled = false;
  }

  const loop = loekke(dt => {
    tau += dt * (skaelv.varighed - skaelv.fra) / 10;
    if (tau >= skaelv.varighed) {
      tau = skaelv.varighed;
      if (tilstand === 'optager') tilstand = 'optaget';
      opdaterTrin(); tegnAlt(); return false;
    }
    tegnAlt();
  });

  startknap.addEventListener('click', () => {
    if (tilstand === 'optager') { tau = skaelv.varighed; return; }
    if (tilstand === 'klar') tilstand = 'optager';
    tau = tilstand === 'afsloeret' ? 0 : skaelv.fra;
    if (roligBevaegelse() && tilstand !== 'afsloeret') { tau = skaelv.varighed; tilstand = 'optaget'; opdaterTrin(); tegnAlt(); return; }
    opdaterTrin();
    loop.start();
  });
  afsloerknap.addEventListener('click', afsloer);
  rod.querySelector('#start-mobil').addEventListener('click', () => startknap.click());
  nytknap.addEventListener('click', () => { loop.stop(); nytSkaelv(); });
  fronterknap.addEventListener('click', () => {
    visFronter = !visFronter; fronterknap.setAttribute('aria-pressed', String(visFronter)); tegnKort();
  });
  for (const k of rod.querySelectorAll('[data-antal]')) {
    k.addEventListener('click', () => {
      antal = Number(k.dataset.antal);
      for (const a of rod.querySelectorAll('[data-antal]')) a.setAttribute('aria-checked', String(a === k));
      loop.stop(); nytSkaelv();
    });
  }
  for (const k of rod.querySelectorAll('[data-stoej]')) {
    k.addEventListener('click', () => {
      stoej = Number(k.dataset.stoej);
      for (const a of rod.querySelectorAll('[data-stoej]')) a.setAttribute('aria-checked', String(a === k));
      // Samme skælv, ny støj: aflæsningerne bevares.
      for (const [i, s] of stationer.slice(0, antal).entries()) s.optag = seismogram({ d: s.d, ML: skaelv.ML, t0: skaelv.t0, varighed: skaelv.varighed, stoej, froe: kim + i * 31 });
      tegnAlt();
    });
  }

  function afsloer() {
    if (!bud) return;
    tilstand = 'afsloeret';
    const fejl = Math.hypot(bud.x - skaelv.x, bud.y - skaelv.y);
    const aktive = stationer.slice(0, antal);
    const [overskrift, ros] = fejl < 10 ? ['Plet!', 'Seismologniveau.'] : fejl < 25 ? ['Flot!', 'Meget tæt på.'] : fejl < 50 ? ['Tæt på', 'Kig på, hvor mærkerne kunne flyttes.'] : ['Ikke helt', 'Sammenlign dine mærker med trekanterne under seismogrammerne.'];
    resultat.replaceChildren();
    resultat.append(el('strong', overskrift), el('span', `Epicentret lå ${tal(fejl, 0)} km fra dit bud. ${ros}`));
    const tabel = el('table');
    tabel.innerHTML = '<tr><th></th><th>Din Δt</th><th>Rigtig</th><th>Din d</th><th>Rigtig</th></tr><tr><th></th><th>s</th><th>s</th><th>km</th><th>km</th></tr>';
    for (const s of aktive) {
      const dt = s.p !== null && s.s !== null ? s.s - s.p : null;
      const tr = el('tr');
      for (const v of [s.navn, dt === null ? '–' : tal(dt), tal(s.optag.tS - s.optag.tP), dt === null ? '–' : tal(afstandFraSP(dt), 0), tal(s.d, 0)]) tr.append(el('td', v));
      tabel.append(tr);
    }
    resultat.append(tabel);
    // Ekstra lære: hvornår skete skælvet? Og hvad betyder stationernes placering?
    const noter = [];
    const forste = aktive.reduce((a, b) => (a.d < b.d ? a : b));
    noter.push(`Skælvet skete kl. 08.${String(skaelv.minut).padStart(2, '0')}.${String(Math.floor(skaelv.t0)).padStart(2, '0')}: ${tal(skaelv.t0)} s på uret. Det kan du regne ud: P nåede ${forste.navn} efter ${tal(forste.optag.tP)} s og havde rejst ${tal(forste.d, 0)} km med ${tal(VP)} km/s.`);
    if (antal === 2) noter.push('Med kun to stationer er der to mulige punkter. Derfor skal man bruge mindst tre.');
    else if (paaLinje(aktive)) noter.push('Stationerne står næsten på en linje. Så skærer cirklerne hinanden i to punkter, der ligger spejlvendt – og det er svært at vælge.');
    for (const n of noter) resultat.append(el('p', n, 'smaa'));
    resultat.hidden = false;
    opdaterTrin(); opdaterMagnitude();
    tau = 0;
    if (roligBevaegelse()) { tau = skaelv.varighed; tegnAlt(); } else loop.start();
  }

  // ---------- Magnitude ----------
  function opdaterMagnitude() {
    const aktive = stationer.slice(0, antal);
    const valgt = magStation.value;
    magStation.replaceChildren(...aktive.map(s => { const o = el('option', s.navn); o.value = s.navn; return o; }));
    if (aktive.some(s => s.navn === valgt)) magStation.value = valgt;
    const s = aktive.find(st => st.navn === magStation.value) || aktive[0];
    const A = Number(String(magA.value).replace(',', '.'));
    let tekst;
    if (s.p === null || s.s === null) tekst = `Sæt først P og S på station ${s.navn}.`;
    else if (!(A > 0)) tekst = `Δt = ${tal(s.s - s.p)} s, så d = ${tal(afstandFraSP(s.s - s.p), 0)} km. Skriv det største udslag A ind.`;
    else {
      const d = afstandFraSP(s.s - s.p);
      tekst = `d = ${tal(d, 0)} km. M_L = log(${tal(A, A < 1 ? 2 : 1)}) + 1,11·log(${tal(d, 0)}) + 0,00189·${tal(d, 0)} + 0,59 ≈ ${tal(magnitude(A, d))}`;
    }
    if (tilstand === 'afsloeret') tekst += ` · Rigtig magnitude: ${tal(skaelv.ML)} (største udslag ved ${s.navn}: ${tal(s.optag.A, s.optag.A < 1 ? 2 : 1)} mm).`;
    magUd.textContent = tekst.replace('M_L', 'Mₗ');
  }
  magStation.addEventListener('change', opdaterMagnitude);
  magA.addEventListener('input', opdaterMagnitude);

  nytSkaelv();
  // Til de automatiske test (kun med ?test i adressen): facit og kortkoordinater.
  if (new URLSearchParams(location.search).has('test')) {
    window.__jb = {
      facit: i => ({ tP: stationer[i].optag.tP, tS: stationer[i].optag.tS, varighed: skaelv.varighed, fra: skaelv.fra }),
      epicenter: () => { const [px, py] = tilKort(skaelv.x, skaelv.y); return { px, py, x: skaelv.x, y: skaelv.y, ML: skaelv.ML }; },
      tilKort: (x, y) => tilKort(x, y),
      stationer: () => stationer.slice(0, antal).map(s => ({ x: s.x, y: s.y, p: s.p, s: s.s, d: s.d }))
    };
  }
  const ro = new ResizeObserver(() => tegnAlt());
  ro.observe(kortlaerred);
  for (const c of [kortlaerred]) { c.addEventListener('focus', tegnAlt); c.addEventListener('blur', tegnAlt); }
  sporrum.addEventListener('focusin', tegnAlt); sporrum.addEventListener('focusout', () => setTimeout(tegnAlt));

  return { vis() { tegnAlt(); }, skjul() { loop.stop(); if (tilstand === 'optager') { tau = skaelv.varighed; tilstand = 'optaget'; opdaterTrin(); } } };
}

const klem = (v, a, b) => Math.max(a, Math.min(b, v));

function paentTal(x) {
  const e = 10 ** Math.floor(Math.log10(x)), f = x / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
}

// Står stationerne (næsten) på én linje? Trekantens areal i forhold til siderne.
function paaLinje(st) {
  if (st.length < 3) return false;
  const [a, b, c] = st;
  const areal = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
  const laengst = Math.max(Math.hypot(b.x - a.x, b.y - a.y), Math.hypot(c.x - a.x, c.y - a.y), Math.hypot(c.x - b.x, c.y - b.y));
  return st.length === 3 && areal / (laengst * laengst) < 0.06;
}

function etiket(ctx, tekst, x, y, farve) {
  ctx.font = '700 12px Archivo, sans-serif';
  const b = ctx.measureText(tekst).width + 10;
  ctx.fillStyle = farve; ctx.fillRect(x, y - 12, b, 17);
  ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.2; ctx.strokeRect(x, y - 12, b, 17);
  ctx.fillStyle = '#fff'; ctx.fillText(tekst, x + 5, y + 1);
}

function stjerne(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const v = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + rr * Math.cos(v), y + rr * Math.sin(v));
  }
  ctx.closePath(); ctx.fillStyle = FARVE.s; ctx.fill(); ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 2; ctx.stroke();
}
