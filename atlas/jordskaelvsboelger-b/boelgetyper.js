// Del 1: Et snit gennem skorpen som gitter af små klippestykker. Hver bølgetype
// flytter stykkerne på sin måde; farterne står i rigtigt forhold til hinanden.
import { VP, VS, VR, K } from './model.js';
import { FARVE, tilpas, loekke, roligBevaegelse, tal, el } from './laerred.js';

const BOELGER = {
  P: {
    navn: 'P-bølge', bogstav: 'P', farve: FARVE.p, undertitel: 'Primær – den første, der når frem',
    tekst: 'Klippen trykkes sammen og trækkes ud <b>i samme retning</b>, som bølgen løber – som et stød gennem en slinky eller en lydbølge i luft.',
    fart: `ca. ${tal(VP)} km/s i skorpen, op til ca. 13,7 km/s dybt i kappen`,
    bevaegelse: 'Frem og tilbage langs bølgens retning (længdebølge)',
    gennem: 'Fast stof, væske og gas',
    se: 'Se de mørke bånd: Her er klippen trykket sammen.'
  },
  S: {
    navn: 'S-bølge', bogstav: 'S', farve: FARVE.s, undertitel: 'Sekundær – kommer som nummer to',
    tekst: 'Klippen rystes <b>på tværs</b> af bølgens retning. Det kræver et stof, der kan modstå at blive vredet. Det kan en væske ikke – den flyder bare.',
    fart: `ca. ${tal(VS)} km/s i skorpen (ca. 0,57 gange P-bølgens fart)`,
    bevaegelse: 'Op og ned (eller til siden) på tværs af retningen (tværbølge)',
    gennem: 'Kun fast stof – ikke væske',
    se: 'Gitterets lodrette linjer forbliver lige; de vandrette bølger op og ned.'
  },
  R: {
    navn: 'Overfladebølge', bogstav: 'O', farve: FARVE.r, undertitel: 'Rayleigh-bølge – ruller langs overfladen',
    tekst: 'Opstår, når bølgerne når overfladen, og løber langs den. Jorden <b>ruller i ellipser</b> som i en havbølge – men baglæns. Bevægelsen dør ud nedad.',
    fart: `ca. ${tal(VR)} km/s – den langsomste`,
    bevaegelse: 'Ellipser i lodret plan; baglæns øverst',
    gennem: 'Kun langs overfladen',
    se: 'Overfladebølger giver tit de kraftigste og længste rystelser – det er dem, huse falder af.'
  },
  kaploeb: {
    navn: 'Kapløbet', bogstav: '!', farve: FARVE.ink, undertitel: 'Alle tre starter samtidig',
    tekst: 'Et skælv sender alle bølgetyperne af sted på samme tid. Se rækkefølgen ved seismografen til højre: <b>P → S → overfladebølger</b>.',
    se: 'Jo længere væk seismografen står, jo større forspring får P-bølgen. Det forspring er nøglen til at finde skælvet i del 2.'
  }
};

export function start(rod) {
  const canvas = rod.querySelector('#blok');
  const kort = rod.querySelector('#boelgekort');
  const urtekst = rod.querySelector('#blok-tid');
  const pauseknap = rod.querySelector('#blok-pause');
  const sporknap = rod.querySelector('#blok-spor');
  const igen = rod.querySelector('#blok-igen');
  let type = 'P', t = 0, pause = roligBevaegelse(), spor = true, spoerpunkter = [], seismo = [];
  const L = 340, STATION = 300, TSLUT = 112; // kapløbet: blokken er 340 km bred, seismografen står ved 300 km

  function visKort() {
    const b = BOELGER[type];
    kort.replaceChildren();
    const h = el('h2');
    const bog = el('span', b.bogstav, 'bogstav'); bog.style.background = b.farve;
    h.append(bog, b.navn);
    kort.append(h, el('p', b.undertitel, 'smaa'));
    const p = el('p'); p.innerHTML = b.tekst; kort.append(p);
    if (b.fart) {
      const dl = el('dl');
      for (const [k, v] of [['Fart', b.fart], ['Bevægelse', b.bevaegelse], ['Går gennem', b.gennem]]) dl.append(el('dt', k), el('dd', v));
      kort.append(dl);
    }
    kort.append(el('p', b.se, 'smaa'));
    igen.hidden = type !== 'kaploeb';
    sporknap.hidden = type === 'kaploeb';
  }

  for (const knap of rod.querySelectorAll('[data-boelge]')) {
    knap.addEventListener('click', () => {
      type = knap.dataset.boelge;
      for (const k of rod.querySelectorAll('[data-boelge]')) k.setAttribute('aria-checked', String(k === knap));
      nulstil(); visKort();
    });
  }
  // Piletaster i radiogruppen.
  rod.querySelector('.vaelger').addEventListener('keydown', e => {
    const knapper = [...rod.querySelectorAll('[data-boelge]')];
    const i = knapper.indexOf(document.activeElement);
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (i < 0 || !d) return;
    e.preventDefault();
    const ny = knapper[(i + d + knapper.length) % knapper.length];
    ny.focus(); ny.click();
  });
  pauseknap.addEventListener('click', () => { pause = !pause; opdaterPause(); });
  sporknap.addEventListener('click', () => { spor = !spor; sporknap.setAttribute('aria-pressed', String(spor)); spoerpunkter = []; tegn(); });
  igen.addEventListener('click', () => { pause = false; nulstil(); opdaterPause(); });

  function opdaterPause() {
    pauseknap.textContent = pause ? '▶ Afspil' : 'Ⅱ Pause';
    if (pause) { loop.stop(); tegn(); } else loop.start();
  }

  function nulstil() {
    t = 0; spoerpunkter = []; seismo = [];
    // Uden bevægelse: vis et øjebliksbillede, hvor bølgen er nået ind i blokken.
    // Fronten er da nået 85 % ind over blokken (kapløbet: P er næsten ved seismografen).
    if (pause) t = type === 'kaploeb' ? 46 : 3.68 / { P: 1, S: VS / VP, R: VR / VP }[type];
    tegn();
  }

  // Forskydning (px) af gitterpunktet i (x, z) ved tiden t. z er dybde i px under overfladen.
  function forskydning(x, z, w, a, tt = t) {
    if (type === 'kaploeb') {
      const km = x / w * L, dyb = z / w * L;
      const puls = (v, bredde) => {
        const xi = (km - v * tt) / bredde;
        return -xi * Math.exp(-xi * xi / 2) * 1.65;
      };
      const pP = puls(VP, 8), pS = puls(VS, 8);
      const xiR = (km - VR * tt) / 13, henfald = Math.exp(-dyb / 25);
      const rx = Math.exp(-xiR * xiR / 2) * Math.sin(xiR * 2.2) * henfald;
      const rz = Math.exp(-xiR * xiR / 2) * Math.cos(xiR * 2.2) * henfald * 1.4;
      return { dx: a * (0.6 * pP + 0.8 * rx), dy: a * (0.8 * pS - rz) };
    }
    const lP = w * 0.42, f = 0.55;
    const v = { P: 1, S: VS / VP, R: VR / VP }[type];
    const lam = lP * v, c = lam * f, k = 2 * Math.PI / lam;
    const front = c * t;
    if (x > front) return { dx: 0, dy: 0 };
    const kant = Math.min(1, (front - x) / (lam * 0.5));      // blød bølgefront
    const fase = k * x - 2 * Math.PI * f * t;
    if (type === 'P') return { dx: a * kant * Math.sin(fase), dy: 0 };
    if (type === 'S') return { dx: 0, dy: a * kant * Math.sin(fase) };
    const henfald = Math.exp(-z / (lam * 0.32));
    // Baglæns ellipse: øverst bevæger stykket sig modsat bølgens retning.
    return { dx: a * kant * henfald * Math.sin(fase), dy: -1.5 * a * kant * henfald * Math.cos(fase) };
  }

  function tegn() {
    const { ctx, w, h } = tilpas(canvas);
    const kaploeb = type === 'kaploeb';
    const seismoH = kaploeb ? Math.max(70, h * 0.2) : 0;
    const himmel = Math.max(54, h * 0.17);
    const bund = h - seismoH;
    const gs = Math.max(14, Math.min(24, w / 36));
    const a = gs * 0.45;
    // Himmel og jord
    const g = ctx.createLinearGradient(0, 0, 0, himmel);
    g.addColorStop(0, '#dcecf3'); g.addColorStop(1, '#f6f2e6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, himmel);
    const jord = ctx.createLinearGradient(0, himmel, 0, bund);
    jord.addColorStop(0, '#e6d3ae'); jord.addColorStop(0.25, '#dcc9a6'); jord.addColorStop(1, '#c9b79a');
    ctx.fillStyle = jord; ctx.fillRect(0, himmel, w, bund - himmel);

    const kol = Math.ceil(w / gs) + 2, raek = Math.floor((bund - himmel) / gs);
    if (raek < 2 || w < 50) return;                     // lærredet har endnu ingen størrelse
    const punkt = (i, j) => {
      const x0 = (i - 1) * gs + gs * 0.5, z0 = j * gs;
      const { dx, dy } = forskydning(x0, z0, w, a);
      return [x0 + dx, himmel + z0 + dy];
    };
    const net = [];
    for (let j = 0; j <= raek; j++) { const r = []; for (let i = 0; i < kol; i++) r.push(punkt(i, j)); net.push(r); }

    // P: farv sammentrykte felter, så tætheden kan ses.
    if (type === 'P' || kaploeb) {
      for (let i = 0; i < kol - 1; i++) {
        const bredde = net[0][i + 1][0] - net[0][i][0];
        const tryk = (gs - bredde) / gs;
        if (Math.abs(tryk) < 0.04) continue;
        ctx.fillStyle = tryk > 0 ? `rgba(14,134,200,${Math.min(0.45, tryk * 1.1)})` : `rgba(255,255,255,${Math.min(0.4, -tryk)})`;
        ctx.fillRect(net[0][i][0], himmel, bredde, bund - himmel);
      }
    }
    // Gitterlinjer
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(23,33,31,.32)';
    ctx.beginPath();
    for (const r of net) { ctx.moveTo(...r[0]); for (const p of r) ctx.lineTo(...p); }
    for (let i = 0; i < kol; i++) { ctx.moveTo(...net[0][i]); for (const r of net) ctx.lineTo(...r[i]); }
    ctx.stroke();
    // Overfladen
    ctx.lineWidth = 3; ctx.strokeStyle = '#5c7d3a';
    ctx.beginPath(); ctx.moveTo(...net[0][0]); for (const p of net[0]) ctx.lineTo(...p); ctx.stroke();
    // Klippestykkerne
    ctx.fillStyle = FARVE.ink;
    for (const r of net) for (const [x, y] of r) { ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 7); ctx.fill(); }

    const farve = kaploeb ? FARVE.ink : BOELGER[type].farve;
    // Hus på overfladen: det rystes med jorden.
    const husI = Math.round((kaploeb ? STATION / L * w : w * 0.78) / gs) + 1;
    tegnHus(ctx, net[0][husI], gs, kaploeb);

    if (!kaploeb) {
      // Et fremhævet stykke klippe med spor.
      const fi = Math.round(w * 0.5 / gs) + 1, fj = type === 'R' ? 0 : Math.min(3, raek);
      const [px, py] = net[fj][fi];
      if (spor && !pause) { spoerpunkter.push([px, py]); if (spoerpunkter.length > 90) spoerpunkter.shift(); }
      if (spor && spoerpunkter.length > 1) {
        ctx.strokeStyle = farve; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.moveTo(...spoerpunkter[0]); for (const p of spoerpunkter) ctx.lineTo(...p); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = farve; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill(); ctx.stroke();
      // Pil for bølgens retning
      const lP = w * 0.42, v = { P: 1, S: VS / VP, R: VR / VP }[type];
      const front = Math.min(w - 20, lP * v * 0.55 * t);
      const py0 = himmel - 16;
      pil(ctx, 16, py0, Math.max(90, Math.min(w * 0.45, front)), py0, farve);
      ctx.fillStyle = FARVE.ink; ctx.font = '600 13px Archivo, sans-serif';
      ctx.fillText(`Bølgen løber  ${tal(type === 'P' ? VP : type === 'S' ? VS : VR)} km/s`, 16, py0 - 9);
      const hjaelp = 'Følg det farvede stykke klippe: Det svinger, men bliver på sin plads.';
      ctx.font = '500 11.5px "IBM Plex Mono", monospace';
      const tb = ctx.measureText(hjaelp).width;
      ctx.fillStyle = '#fff9eeee'; ctx.fillRect(10, bund - 26, tb + 12, 19);
      ctx.fillStyle = FARVE.ink; ctx.fillText(hjaelp, 16, bund - 12);
      urtekst.textContent = '';
    } else {
      tegnKaploeb(ctx, w, himmel, bund, seismoH, gs);
    }
  }

  function tegnKaploeb(ctx, w, himmel, bund, seismoH, gs) {
    // Skælvet (hypocentret) til venstre i dybden
    stjerne(ctx, 14, himmel + (bund - himmel) * 0.45, 11, FARVE.s);
    // Bølgemærker over overfladen
    const sx = STATION / L * w;
    for (const [bog, v, farve] of [['P', VP, FARVE.p], ['S', VS, FARVE.s], ['O', VR, FARVE.r]]) {
      const x = v * t / L * w;
      if (x < 4 || x > w + 10) continue;
      ctx.fillStyle = farve;
      ctx.beginPath(); ctx.arc(x, himmel * 0.45 + (bog === 'P' ? 0 : bog === 'S' ? 6 : 12), 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 12px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(bog, x, himmel * 0.45 + (bog === 'P' ? 0 : bog === 'S' ? 6 : 12));
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // km-skala
    ctx.fillStyle = FARVE.ink; ctx.font = '500 10px "IBM Plex Mono", monospace';
    for (let km = 0; km <= L; km += 20) {
      const x = km / L * w;
      ctx.fillRect(x, bund - 6, 1, 6);
      if (km % 100 === 0 && km > 0 && km < L) ctx.fillText(`${km} km`, x + 3, bund - 8);
    }
    // Seismogrammet ved stationen
    const tMaks = TSLUT - 2, x0 = 70;
    // Seismografen skriver jordens samlede rystelse ved stationen fra skælvet til nu.
    seismo = [];
    for (let ts = 0; ts <= Math.min(t, tMaks); ts += 0.2) {
      const { dx, dy } = forskydning(sx, 0, w, gs * 0.45, ts);
      seismo.push([ts, 0.6 * dx - dy]);
    }
    const top = bund;
    ctx.fillStyle = '#fffdf5'; ctx.fillRect(0, top, w, seismoH);
    ctx.fillStyle = FARVE.ink; ctx.fillRect(0, top, w, 2);
    ctx.font = '600 11px Archivo, sans-serif';
    ctx.fillText('Seismograf ved', 8, top + 18); ctx.fillText(`${STATION} km`, 8, top + 32);
    const midt = top + seismoH * 0.58;
    ctx.strokeStyle = 'rgba(23,33,31,.15)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let s = 0; s <= tMaks; s += 10) { const x = x0 + s / tMaks * (w - x0 - 10); ctx.moveTo(x, top + 8); ctx.lineTo(x, top + seismoH - 14); }
    ctx.stroke();
    ctx.fillStyle = FARVE.slate; ctx.font = '500 10px "IBM Plex Mono", monospace';
    for (let s = 0; s <= tMaks; s += 20) ctx.fillText(`${s} s`, x0 + s / tMaks * (w - x0 - 10) + 2, top + seismoH - 3);
    ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.5; ctx.beginPath();
    seismo.forEach(([ts, u], i) => {
      const x = x0 + ts / tMaks * (w - x0 - 10), y = midt - u * 1.1;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    // Ankomstmærker, når bølgen er nået frem
    let tekst = `t = ${Math.min(tMaks, t).toFixed(0)} s efter skælvet`;
    const ank = [['P', STATION / VP, FARVE.p], ['S', STATION / VS, FARVE.s], ['O', STATION / VR, FARVE.r]];
    for (const [bog, ta, farve] of ank) {
      if (t < ta) continue;
      const x = x0 + ta / tMaks * (w - x0 - 10);
      ctx.fillStyle = farve; ctx.fillRect(x - 1, top + 6, 2, seismoH - 20);
      ctx.font = '700 11px "IBM Plex Mono", monospace'; ctx.fillText(bog, x + 3, top + 16 + (bog === 'O' ? 12 : 0));
    }
    if (t >= STATION / VR + 3) {
      const sp = STATION / VS - STATION / VP;
      tekst = `P efter ${tal(STATION / VP, 0)} s · S efter ${tal(STATION / VS, 0)} s · S − P = ${tal(sp)} s → ${tal(K, 1)} km/s · ${tal(sp)} s = ${STATION} km`;
    }
    urtekst.textContent = tekst;
  }

  const loop = loekke(dt => {
    if (type === 'kaploeb') { t += dt * 11; if (t > TSLUT) { t = TSLUT; tegn(); return false; } }
    else t += dt;
    tegn();
  });

  const ro = new ResizeObserver(() => { spoerpunkter = []; if (pause || !loop.koerer) tegn(); });
  ro.observe(canvas);
  visKort();
  opdaterPause();
  nulstil();

  return {
    vis() { if (!pause) loop.start(); tegn(); },
    skjul() { loop.stop(); }
  };
}

function pil(ctx, x1, y1, x2, y2, farve) {
  ctx.strokeStyle = farve; ctx.fillStyle = farve; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - 8, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 11, y2 - 6); ctx.lineTo(x2 - 11, y2 + 6); ctx.closePath(); ctx.fill();
}

function stjerne(ctx, x, y, r, farve) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const v = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + rr * Math.cos(v), y + rr * Math.sin(v));
  }
  ctx.closePath(); ctx.fillStyle = farve; ctx.fill(); ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.5; ctx.stroke();
}

// Et lille hus, der står på overfladepunktet og vipper med jorden.
function tegnHus(ctx, [x, y], gs, seismograf) {
  const b = gs * 1.6, hh = gs * 1.1;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fffdf7'; ctx.strokeStyle = FARVE.ink; ctx.lineWidth = 1.8;
  ctx.fillRect(-b / 2, -hh, b, hh); ctx.strokeRect(-b / 2, -hh, b, hh);
  ctx.beginPath(); ctx.moveTo(-b / 2 - 4, -hh); ctx.lineTo(0, -hh - gs * 0.9); ctx.lineTo(b / 2 + 4, -hh); ctx.closePath();
  ctx.fillStyle = '#c4533a'; ctx.fill(); ctx.stroke();
  if (seismograf) {
    ctx.fillStyle = FARVE.ink; ctx.font = '700 9px "IBM Plex Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText('SEIS', 0, -hh * 0.35); ctx.textAlign = 'left';
  } else {
    ctx.fillStyle = '#9ccbe0'; ctx.fillRect(-b / 4, -hh * 0.7, b / 2, hh * 0.35); ctx.strokeRect(-b / 4, -hh * 0.7, b / 2, hh * 0.35);
  }
  ctx.restore();
}
