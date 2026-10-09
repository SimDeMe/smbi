// udvikling.js — graferne i skoleårs-rapporten: foran/bagud over tid
//
// To kurver, uge for uge gennem skoleåret, begge i timer:
//
//   Skema  = registreret tid − den del af normen, der burde være brugt
//            (samme regning som chippen: arbejdsdage, ferie trukket fra, og
//            aktiviteter i en periode vægtet i perioden — aktivitetsperiode.js)
//   Akkord = optjent − brugt (samme regning som saldoen i akkordregnskabet)
//
// Hvert punkt regnes, som tallene stod ved ugens begyndelse: kun tid
// registreret før den dag, kun sæt rettet før den dag, og kun opgaver
// afsluttet før den dag har optjent hele deres budget. En opgave afsluttet
// uden dato (fx gendannet fra backup) regnes afsluttet ved sin sidste
// registrering. Manuel fremdrift har ingen historik — den står med sin
// nuværende procent hele vejen. Sidste punkt er altid det samme som tallene
// i sammendraget over graferne.

import { beregnAkkord } from './akkord.js';
import { erPause } from './pauser.js';
import { forloebIArbejdsdage } from './ferie.js';
import { aktivitetsAndel, forventetM } from './aktivitetsperiode.js';
import { addDays, mandag, datoInput, MAANEDER_KORT } from './periode.js';
import { esc } from './format.js';

const tilDate = t => t?.toDate?.() ?? (t instanceof Date ? t : null);

// Ugernes mandage i normperioden, plus slutpunktet (i dag eller årets slut)
function maalepunkter(start, slut, nu) {
  const til = nu < slut ? nu : slut;
  const pkt = [start];
  for (let d = addDays(mandag(start), 7); d < til; d = addDays(d, 7)) pkt.push(d);
  if (til > pkt[pkt.length - 1]) pkt.push(til);
  return pkt;
}

// Hvornår blev aktiviteten afsluttet? Uden dato: ved dens (og dens
// under-opgavers) sidste registrering
function afsluttetVed(a, acts, entries) {
  const dato = tilDate(a.archivedAt);
  if (dato) return dato;
  const ids = new Set([a.id, ...acts.filter(c => c.parentId === a.id).map(c => c.id)]);
  let sidst = null;
  entries.forEach(e => {
    if (!ids.has(e.activityId)) return;
    const s = tilDate(e.startTime);
    if (s && (!sidst || s > sidst)) sidst = s;
  });
  return sidst;          // null: ingen tid — regnes afsluttet hele året
}

// Aktiviteterne, som de stod ved datoen d
function aktiviteterVed(acts, d, afsluttet) {
  const dag = datoInput(d);
  return acts.map(a => {
    const x = { ...a };
    if (a.isArchived) {
      const ved = afsluttet.get(a.id);
      x.isArchived = !ved || ved <= d;
    }
    if (a.rettedeSaet?.length) x.rettedeSaet = a.rettedeSaet.filter(s => s.dato < dag);
    return x;
  });
}

// ─── Serierne ─────────────────────────────────────────────
// entries: skoleårets afsluttede registreringer (rapportens filtrerede liste)
// normM:   det, der skal registreres i året, i minutter
export function beregnUdvikling({ acts, entries, aar, start, slut, ferie, normM, fordel, nu = new Date() }) {
  if (nu <= start) return null;
  const aarets = new Set(acts.filter(a => a.schoolYear === aar).map(a => a.id));
  const taeller = e => !e.activityId || erPause(e) || aarets.has(e.activityId);
  const poster = entries
    .filter(taeller)
    .map(e => ({ e, t: tilDate(e.startTime), m: e.durationMinutes || 0 }))
    .sort((a, b) => a.t - b.t);

  const afsluttet = new Map();
  acts.forEach(a => { if (a.isArchived && a.schoolYear === aar) afsluttet.set(a.id, afsluttetVed(a, acts, entries)); });

  const pkt = maalepunkter(start, slut, nu);
  const skema = [], akkord = [];
  pkt.forEach((d, i) => {
    const sidst = i === pkt.length - 1;
    // Sidste punkt tager alt med, også tid lagt ind frem i tiden — ligesom
    // sammendraget, så kurven ender i det tal, der står over den
    const med   = sidst ? poster : poster.filter(p => p.t < d);
    const brugt = med.reduce((s, p) => s + p.m, 0);
    const andel = forloebIArbejdsdage(start, slut, ferie, d);
    skema.push({ d, v: brugt - forventetM({ acts, aar, normM, start, slut, ferie, nu: d }) });

    const ak = beregnAkkord({
      acts: sidst ? acts : aktiviteterVed(acts, d, afsluttet),
      entries: med.map(p => p.e), aar, andel, fordel,
      andelFor: a => aktivitetsAndel(a, acts, { aar, start, slut, ferie, nu: d })
    });
    akkord.push({ d, v: ak.akkord > 0 ? ak.saldo : null });
  });

  return {
    skema,
    akkord: akkord.some(p => p.v != null) ? akkord.map(p => ({ ...p, v: p.v ?? 0 })) : null
  };
}

// ─── Tegning ──────────────────────────────────────────────
const B = 600, H = 280;                          // viewBox
const M = { l: 62, r: 18, t: 16, b: 36 };

const timer = m => Math.round(m / 60);
const fmtT  = m => { const t = timer(m); return t === 0 ? '± 0 t' : `${t > 0 ? '+' : '−'}${Math.abs(t)} t`; };
const fmtDag = d => `${d.getDate()}. ${MAANEDER_KORT[d.getMonth()]}`;

// Pæne trin på y-aksen i timer: 1, 2, 5, 10, 20, 50 …
function trin(spaen) {
  const raa = spaen / 4;
  const p = 10 ** Math.floor(Math.log10(raa || 1));
  return [1, 2, 5, 10].map(f => f * p).find(s => s >= raa) || p * 10;
}

export function tegnUdvikling(id, titel, under, punkter, start, slut, ordFor) {
  if (!punkter || punkter.length < 2) return '';
  const vH = punkter.map(p => p.v / 60);
  const lo0 = Math.min(0, ...vH), hi0 = Math.max(0, ...vH);
  const s = trin(Math.max(hi0 - lo0, 4));
  const lo = Math.floor(lo0 / s) * s, hi = Math.ceil(hi0 / s) * s || s;
  const lo2 = lo === hi ? lo - s : lo;

  const x = d => M.l + (d - start) / (slut - start) * (B - M.l - M.r);
  const y = t => M.t + (hi - t) / (hi - lo2) * (H - M.t - M.b);
  const y0 = y(0);

  // Gitter og y-akse
  let gitter = '';
  for (let t = lo2; t <= hi + 1e-9; t += s) {
    const yy = y(t).toFixed(1);
    gitter += `<line class="udv-gitter${t === 0 ? ' udv-nul' : ''}" x1="${M.l}" x2="${B - M.r}" y1="${yy}" y2="${yy}"/>
      <text class="udv-akse" x="${M.l - 8}" y="${yy}" text-anchor="end" dominant-baseline="middle">${t > 0 ? '+' : t < 0 ? '−' : ''}${Math.abs(t)}</text>`;
  }
  // Månederne langs x-aksen: streg ved den 1., navnet midt i måneden
  let mdr = '';
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d < slut;
       d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const naeste = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const fra = d < start ? start : d, til = naeste > slut ? slut : naeste;
    if (d >= start) mdr += `<line class="udv-maaned" x1="${x(d).toFixed(1)}" x2="${x(d).toFixed(1)}" y1="${H - M.b}" y2="${H - M.b + 5}"/>`;
    mdr += `<text class="udv-akse udv-akse-x" x="${((x(fra) + x(til)) / 2).toFixed(1)}" y="${H - M.b + 24}" text-anchor="middle">${MAANEDER_KORT[d.getMonth()]}</text>`;
  }

  const xy = punkter.map((p, i) => [x(p.d), y(vH[i])]);
  const linje = xy.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join('');
  const flade = `${linje}L${xy[xy.length - 1][0].toFixed(1)},${y0.toFixed(1)}L${xy[0][0].toFixed(1)},${y0.toFixed(1)}Z`;
  const [lx, ly] = xy[xy.length - 1];
  const sidste = punkter[punkter.length - 1].v;

  const data = punkter.map(p => [p.d.getTime(), Math.round(p.v)]);
  const tabel = punkter.map(p => `<tr><td>${fmtDag(p.d)}</td><td>${fmtT(p.v)}</td></tr>`).join('');
  const nu = ordFor(sidste);

  return `<div class="udv-kort" data-udv="${esc(JSON.stringify({ data, start: +start, slut: +slut, hi, lo: lo2, op: ordFor(1), ned: ordFor(-1) }))}">
    <div class="udv-head">
      <span class="udv-titel">${titel}</span>
      <span class="udv-nu ${sidste >= 0 ? 'is-pos' : 'is-neg'}">${fmtT(sidste)} ${nu}</span>
    </div>
    <div class="udv-under">${under}</div>
    <div class="udv-plot">
      <svg viewBox="0 0 ${B} ${H}" role="img" aria-label="${esc(titel)}: ${fmtT(sidste)} ${nu}. Se tabellen for ugens tal.">
        <defs>
          <clipPath id="${id}-op"><rect x="0" y="0" width="${B}" height="${y0.toFixed(1)}"/></clipPath>
          <clipPath id="${id}-ned"><rect x="0" y="${y0.toFixed(1)}" width="${B}" height="${(H - y0).toFixed(1)}"/></clipPath>
        </defs>
        ${gitter}${mdr}
        <path class="udv-flade-op"  d="${flade}" clip-path="url(#${id}-op)"/>
        <path class="udv-flade-ned" d="${flade}" clip-path="url(#${id}-ned)"/>
        <path class="udv-linje" d="${linje}"/>
        <circle class="udv-prik" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="5"/>
        <g class="udv-hover" visibility="hidden">
          <line class="udv-kryds" y1="${M.t}" y2="${H - M.b}"/>
          <circle class="udv-prik" r="5"/>
        </g>
        <rect class="udv-maal" x="${M.l}" y="0" width="${B - M.l - M.r}" height="${H}" fill="transparent"/>
      </svg>
      <div class="udv-tip" hidden></div>
    </div>
    <details class="udv-tabel">
      <summary>Vis som tabel</summary>
      <table><thead><tr><th>Uge fra</th><th>Timer</th></tr></thead><tbody>${tabel}</tbody></table>
    </details>
  </div>`;
}

// ─── Hover ────────────────────────────────────────────────
// Lyttes på rapportens beholder, så det overlever, at rapporten tegnes om
export function bindUdvikling(rod) {
  if (!rod || rod.dataset.udvBundet) return;
  rod.dataset.udvBundet = '1';

  const vis = (kort, klientX) => {
    const cfg = JSON.parse(kort.dataset.udv);
    const svg = kort.querySelector('svg');
    const r   = svg.getBoundingClientRect();
    const vx  = (klientX - r.left) / r.width * B;
    const x   = t => M.l + (t - cfg.start) / (cfg.slut - cfg.start) * (B - M.l - M.r);
    const y   = m => M.t + (cfg.hi - m / 60) / (cfg.hi - cfg.lo) * (H - M.t - M.b);
    let bedst = cfg.data[0];
    cfg.data.forEach(p => { if (Math.abs(x(p[0]) - vx) < Math.abs(x(bedst[0]) - vx)) bedst = p; });
    const [t, v] = bedst;
    const g = kort.querySelector('.udv-hover');
    g.setAttribute('visibility', 'visible');
    g.querySelector('line').setAttribute('x1', x(t));
    g.querySelector('line').setAttribute('x2', x(t));
    g.querySelector('circle').setAttribute('cx', x(t));
    g.querySelector('circle').setAttribute('cy', y(v));
    const tip = kort.querySelector('.udv-tip');
    tip.hidden = false;
    tip.innerHTML = `<span>${fmtDag(new Date(t))}</span><b>${fmtT(v)}</b> ${v >= 0 ? cfg.op : cfg.ned}`;
    // Midt over punktet, men aldrig ud over kortets kanter
    const px = x(t) / B * r.width, half = tip.offsetWidth / 2;
    tip.style.left = `${Math.min(Math.max(px, half), r.width - half)}px`;
  };
  const skjul = kort => {
    kort.querySelector('.udv-hover')?.setAttribute('visibility', 'hidden');
    const tip = kort.querySelector('.udv-tip');
    if (tip) tip.hidden = true;
  };

  rod.addEventListener('pointermove', e => {
    const kort = e.target.closest?.('.udv-kort');
    if (kort && e.target.closest('svg')) vis(kort, e.clientX);
  });
  rod.addEventListener('pointerdown', e => {
    const kort = e.target.closest?.('.udv-kort');
    if (kort && e.target.closest('svg')) vis(kort, e.clientX);
  });
  rod.addEventListener('pointerout', e => {
    const kort = e.target.closest?.('.udv-kort');
    if (kort && !kort.contains(e.relatedTarget)) skjul(kort);
  });
}
