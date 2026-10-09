// udvikling.js — graferne i skoleårs-rapporten: belastning og arbejde
//
// Tre ting, uge for uge gennem skoleåret, alle i timer:
//
//   Belastning = den tid, opgaverne forventes at tage i ugen (belastning.js):
//                hold og løbende opgaver i deres perioder, engangsopgaver når
//                tiden er brugt, 0 i elevferier
//   Arbejdet   = den tid, der er registreret i ugen
//   Forskel    = arbejdet minus belastningen, lagt sammen fra årets start.
//                Over nul: merarbejde. Under nul: overskud
//   Akkord     = optjent − brugt (samme regning som saldoen i akkordregnskabet)
//
// Forskel og akkord regnes, som tallene stod ved ugens begyndelse: kun tid
// registreret før den dag, kun sæt rettet før den dag, og kun opgaver
// afsluttet før den dag har optjent hele deres budget. En opgave afsluttet
// uden dato (fx gendannet fra backup) regnes afsluttet ved sin sidste
// registrering. Manuel fremdrift har ingen historik — den står med sin
// nuværende procent hele vejen. Sidste punkt er altid det samme som tallene
// i sammendraget over graferne. Ugerne efter i dag viser belastningen, som
// den ser ud nu.

import { beregnAkkord, forrigeSkoleaar } from './akkord.js';
import { erPause } from './pauser.js';
import { forloebIArbejdsdage, arbejdsdageIPerioden, tilDato } from './ferie.js';
import { aktivitetsAndel } from './aktivitetsperiode.js';
import { beregnBelastning, REST } from './belastning.js';
import { addDays, mandag, datoInput, ugeNr, MAANEDER_KORT } from './periode.js';
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
export function beregnUdvikling({ acts, entries, aar, start, slut, ferie, elevferie = [], normM, fordel, nu = new Date() }) {
  if (nu <= start) return null;
  const aarets = new Set(acts.filter(a => a.schoolYear === aar).map(a => a.id));
  const taeller = e => !e.activityId || erPause(e) || aarets.has(e.activityId);
  const poster = entries
    .filter(taeller)
    .map(e => ({ e, t: tilDate(e.startTime), m: e.durationMinutes || 0 }))
    .sort((a, b) => a.t - b.t);

  const afsluttet = new Map();
  // Også sidste års engangsopgaver, der optjenes i år
  const forrige = forrigeSkoleaar(aar);
  acts.forEach(a => {
    if (a.isArchived && (a.schoolYear === aar || a.schoolYear === forrige))
      afsluttet.set(a.id, afsluttetVed(a, acts, entries));
  });

  const pkt = maalepunkter(start, slut, nu);
  const forskel = [], akkord = [], belVed = [], bels = [];
  let bel = null;
  pkt.forEach((d, i) => {
    const sidst = i === pkt.length - 1;
    // Sidste punkt tager alt med, også tid lagt ind frem i tiden — ligesom
    // sammendraget, så kurven ender i det tal, der står over den
    const med   = sidst ? poster : poster.filter(p => p.t < d);
    const brugt = med.reduce((s, p) => s + p.m, 0);
    const andel = forloebIArbejdsdage(start, slut, ferie, d);
    const ak = beregnAkkord({
      acts: sidst ? acts : aktiviteterVed(acts, d, afsluttet),
      entries: med.map(p => p.e), aar, andel, fordel,
      andelFor: a => aktivitetsAndel(a, acts, { aar, start, slut, ferie, nu: d })
    });
    // Engangsopgaverne belaster, som de var optjent den dag
    bel = beregnBelastning({ ak, acts, aar, normM, start, slut, ferie, elevferie });
    bels.push(bel);
    belVed.push(bel.ved(d));
    forskel.push({ d, v: brugt - belVed[i] });
    akkord.push({ d, v: ak.akkord > 0 ? ak.saldo : null });
  });

  return {
    forskel,
    akkord: akkord.some(p => p.v != null) ? akkord.map(p => ({ ...p, v: p.v ?? 0 })) : null,
    uger: ugerne({ pkt, bels, bel, poster, start, slut, ferie, normM, nu }),
    opgaver: opgaveNavne(acts),
    faktor: bel?.faktor ?? 1,
    rest: resten({ bel, brugt: poster.reduce((s, p) => s + p.m, 0), belNu: belVed[belVed.length - 1], slut, ferie, nu }),
    ferie, elevferie
  };
}

// Uge for uge, mandag til mandag, hele normperioden: arbejdet, belastningen
// og normen jævnt over arbejdsdagene (37 t × ansættelsesgraden). Belastningen
// er delt op på opgaverne (dele: [{ id, m }], største først)
function ugerne({ pkt, bels, bel, poster, start, slut, ferie, normM, nu }) {
  const iPkt = new Map(pkt.map((d, i) => [d.getTime(), i]));
  // Opgavernes dele ved d: målt, hvis d er et målepunkt før i dag, ellers fremskrevet
  const deleAt = d => {
    const i = iPkt.get(d.getTime());
    return i != null && d <= nu ? bels[i].dele(d) : bel.dele(d, nu);
  };
  const norm = d => normM * forloebIArbejdsdage(start, slut, ferie, d);
  const uger = [];
  let foer = deleAt(start);
  for (let fra = start; fra < slut;) {
    const n = addDays(mandag(fra), 7), til = n > slut ? slut : n;
    const arb = fra < nu
      ? poster.filter(p => p.t >= fra && p.t < til).reduce((s, p) => s + p.m, 0)
      : null;
    const efter = deleAt(til);
    const dele = [...new Set([...foer.keys(), ...efter.keys()])]
      .map(id => ({ id, m: (efter.get(id) || 0) - (foer.get(id) || 0) }));
    uger.push({
      fra, til, arbejdet: arb,
      belastning: dele.reduce((s, x) => s + x.m, 0),
      norm: norm(til) - norm(fra),
      dele: dele.filter(x => Math.abs(x.m) >= 0.5).sort((a, b) => b.m - a.m)
    });
    foer = efter;
    fra = til;
  }
  return uger;
}

// Navn og farve pr. opgave; en under-opgave med forælderens navn foran
function opgaveNavne(acts) {
  const efterId = new Map(acts.map(a => [a.id, a]));
  const o = { [REST]: { navn: 'Resten af normen', farve: null } };
  acts.forEach(a => {
    const far = a.parentId ? efterId.get(a.parentId) : null;
    o[a.id] = { navn: far ? `${far.name} › ${a.name}` : a.name, farve: a.color || null };
  });
  return o;
}

// Resten af året: belastningen og det, der skal arbejdes for at gå lige op,
// pr. uge med arbejdsdage (elevferien tæller — der kan man indhente)
function resten({ bel, brugt, belNu, slut, ferie, nu }) {
  if (nu >= slut) return null;
  const imorgen = addDays(new Date(nu.getFullYear(), nu.getMonth(), nu.getDate()), 1);
  const uger = arbejdsdageIPerioden(imorgen, slut, ferie) / 5;
  if (uger < 1) return null;
  return { uger, belastning: (bel.total - belNu) / uger, lige: (bel.total - brugt) / uger };
}

// ─── Tegning ──────────────────────────────────────────────
const B = 600, H = 280;                          // viewBox
const M = { l: 62, r: 18, t: 16, b: 36 };

const timer = m => Math.round(m / 60);
const fmtT  = m => { const t = timer(m); return t === 0 ? '± 0 t' : `${t > 0 ? '+' : '−'}${Math.abs(t)} t`; };
const fmtDag = d => `${d.getDate()}. ${MAANEDER_KORT[d.getMonth()]}`;

// Månederne langs x-aksen: streg ved den 1., navnet midt i måneden
function maanedsakse(x, start, slut) {
  let mdr = '';
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d < slut;
       d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const naeste = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const fra = d < start ? start : d, til = naeste > slut ? slut : naeste;
    if (d >= start) mdr += `<line class="udv-maaned" x1="${x(d).toFixed(1)}" x2="${x(d).toFixed(1)}" y1="${H - M.b}" y2="${H - M.b + 5}"/>`;
    if (x(til) - x(fra) < 30) continue;      // en stump måned i kanten af et udsnit
    mdr += `<text class="udv-akse udv-akse-x" x="${((x(fra) + x(til)) / 2).toFixed(1)}" y="${H - M.b + 24}" text-anchor="middle">${MAANEDER_KORT[d.getMonth()]}</text>`;
  }
  return mdr;
}

// Pæne trin på y-aksen i timer: 1, 2, 5, 10, 20, 50 …
function trin(spaen) {
  const raa = spaen / 4;
  const p = 10 ** Math.floor(Math.log10(raa || 1));
  return [1, 2, 5, 10].map(f => f * p).find(s => s >= raa) || p * 10;
}

// omvendt: over nul er det dårlige (merarbejde), så farverne byttes
export function tegnUdvikling(id, titel, under, punkter, start, slut, ordFor, omvendt = false) {
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
  const mdr = maanedsakse(x, start, slut);

  const xy = punkter.map((p, i) => [x(p.d), y(vH[i])]);
  const linje = xy.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join('');
  const flade = `${linje}L${xy[xy.length - 1][0].toFixed(1)},${y0.toFixed(1)}L${xy[0][0].toFixed(1)},${y0.toFixed(1)}Z`;
  const [lx, ly] = xy[xy.length - 1];
  const sidste = punkter[punkter.length - 1].v;

  const data = punkter.map(p => [p.d.getTime(), Math.round(p.v)]);
  const tabel = punkter.map(p => `<tr><td>${fmtDag(p.d)}</td><td>${fmtT(p.v)}</td></tr>`).join('');
  const nu = ordFor(sidste);

  return `<div class="udv-kort${omvendt ? ' udv-omvendt' : ''}" data-udv="${esc(JSON.stringify({ data, start: +start, slut: +slut, hi, lo: lo2, op: ordFor(1), ned: ordFor(-1) }))}">
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

// ─── Belastning og arbejde, uge for uge ───────────────────
// Grafen kan zoomes: træk hen over den (eller +/−, ‹ › og Ctrl+hjul), og et
// klik på en uge viser, hvad belastningen består af. Udsnit og valgt uge står
// her, så de overlever, at rapporten tegnes om.
const fmtU = m => `${Math.round(m / 60)} t`;
const fmtTal1 = t => (Math.round(t * 10) / 10).toLocaleString('da-DK');
const fmtT1 = m => `${fmtTal1(m / 60)} t`;
const ugeTilstand = new Map();     // id → { u, start, slut, nu, a, b, valgt }
const MIN_UGER = 2;                // det mindste udsnit
const UGE_ETIKET = 14;             // højst så mange uger: ugenumre på x-aksen

export function tegnUger(id, u, start, slut, nu = new Date()) {
  const uger = u?.uger;
  if (!uger?.length) return '';
  const gl = ugeTilstand.get(id);
  const st = { id, u, start, slut, nu, a: 0, b: uger.length, valgt: null };
  if (gl && gl.u.uger.length === uger.length && +gl.start === +start) {
    st.a = gl.a; st.b = gl.b; st.valgt = gl.valgt;
  }
  ugeTilstand.set(id, st);

  const rest = u.rest;
  const hoved = rest
    ? `<span class="udv-nu">Resten af året ${fmtTal1(rest.belastning / 60)} t/uge</span>` : '';
  const restTekst = rest
    ? ` Resten af året er belastningen ${fmtTal1(rest.belastning / 60)} t om ugen. Arbejder du ${fmtTal1(rest.lige / 60)} t om ugen, går det lige op med det, du allerede har arbejdet.` : '';

  const data = uger.map(w => [+w.fra, +w.til, w.arbejdet == null ? null : Math.round(w.arbejdet), Math.round(w.belastning), Math.round(w.norm)]);
  const tabel = uger.map(w => `<tr><td>${ugeNr(w.fra)}</td><td>${fmtDag(w.fra)}</td><td>${w.arbejdet == null ? '' : fmtU(w.arbejdet)}</td><td>${fmtU(w.belastning)}</td><td>${fmtU(w.norm)}</td></tr>`).join('');

  return `<div class="udv-kort udv-uger" data-uger-id="${esc(id)}" data-uger="${esc(JSON.stringify({ data, start: +start, slut: +slut }))}">
    <div class="udv-head">
      <span class="udv-titel">Belastning og arbejde</span>
      ${hoved}
    </div>
    <div class="udv-under">Timer om ugen. Belastningen er det, opgaverne forventes at tage: hold og opgaver i deres perioder, engangsopgaver når tiden er brugt, og intet i elevernes ferier.${restTekst}</div>
    <div class="udv-noegle" aria-hidden="true">
      <span><i class="udv-n-soejle"></i>Arbejdet</span>
      <span><i class="udv-n-bel"></i>Belastning</span>
      <span><i class="udv-n-norm"></i>37 t × ansættelsesgrad</span>
      <span><i class="udv-n-elev"></i>Elevferie</span>
      <span><i class="udv-n-ferie"></i>Ferie</span>
    </div>
    <div class="udv-vaerktoej">
      <span class="udv-udsnit">${udsnitTekst(st)}</span>
      <span class="udv-zoom" role="group" aria-label="Zoom i grafen">
        ${zoomKnapper(st)}
      </span>
    </div>
    <div class="udv-plot">
      <svg viewBox="0 0 ${B} ${H}" tabindex="0" role="img" aria-label="Belastning og arbejde uge for uge.${rest ? ` Resten af året ${fmtTal1(rest.belastning / 60)} timer om ugen.` : ''} Klik eller brug piletasterne for at se en uges opgaver. Se tabellen for ugens tal.">${ugeFigur(st)}</svg>
      <div class="udv-tip" hidden></div>
    </div>
    <div class="udv-detalje" aria-live="polite"${st.valgt == null ? ' hidden' : ''}>${st.valgt == null ? '' : ugeDetalje(st)}</div>
    <details class="udv-tabel">
      <summary>Vis som tabel</summary>
      <table><thead><tr><th>Uge</th><th>Fra</th><th>Arbejdet</th><th>Belastning</th><th>Norm</th></tr></thead><tbody>${tabel}</tbody></table>
    </details>
  </div>`;
}

const fmtSpaend = (fra, til) => `${fmtDag(fra)} – ${fmtDag(addDays(til, -1))}`;

function udsnitTekst(st) {
  const w = st.u.uger;
  if (st.a === 0 && st.b === w.length) return 'Hele året · træk hen over grafen for at zoome';
  return `${fmtSpaend(w[st.a].fra, w[st.b - 1].til)} · ${st.b - st.a} uger`;
}

function zoomKnapper(st) {
  const N = st.u.uger.length, n = st.b - st.a;
  const k = (z, tegn, navn, slaaet) =>
    `<button type="button" class="udv-zk" data-zoom="${z}" aria-label="${navn}" title="${navn}"${slaaet ? '' : ' disabled'}>${tegn}</button>`;
  return k('venstre', '‹', 'Tidligere', st.a > 0) +
    k('ud', '−', 'Zoom ud', n < N) +
    k('ind', '+', 'Zoom ind', n > MIN_UGER) +
    k('hoejre', '›', 'Senere', st.b < N) +
    k('alt', 'Hele året', 'Vis hele året', n < N);
}

// Det, der står inde i svg'en, for udsnittet [a, b)
function ugeFigur(st) {
  const { u, id, nu } = st;
  const alle = u.uger, uger = alle.slice(st.a, st.b);
  const v0 = uger[0].fra, v1 = uger[uger.length - 1].til;
  const hi0 = Math.max(4, ...uger.map(w => Math.max(w.arbejdet ?? 0, w.belastning, w.norm) / 60));
  const s = trin(hi0);
  const hi = Math.ceil(hi0 / s) * s;
  const x = d => M.l + (d - v0) / (v1 - v0) * (B - M.l - M.r);
  const y = t => M.t + (hi - t) / hi * (H - M.t - M.b);

  let gitter = '';
  for (let t = 0; t <= hi + 1e-9; t += s) {
    const yy = y(t).toFixed(1);
    gitter += `<line class="udv-gitter${t === 0 ? ' udv-nul' : ''}" x1="${M.l}" x2="${B - M.r}" y1="${yy}" y2="${yy}"/>
      <text class="udv-akse" x="${M.l - 8}" y="${yy}" text-anchor="end" dominant-baseline="middle">${t}</text>`;
  }

  // x-aksen: måneder for et langt udsnit, ugenumre for et kort
  let akse;
  if (uger.length > UGE_ETIKET) akse = maanedsakse(x, v0, v1);
  else {
    akse = `<text class="udv-akse udv-akse-x" x="${M.l - 8}" y="${H - M.b + 24}" text-anchor="end">uge</text>`;
    uger.forEach((w, i) => {
      if (i) akse += `<line class="udv-maaned" x1="${x(w.fra).toFixed(1)}" x2="${x(w.fra).toFixed(1)}" y1="${H - M.b}" y2="${H - M.b + 5}"/>`;
      akse += `<text class="udv-akse udv-akse-x" x="${((x(w.fra) + x(w.til)) / 2).toFixed(1)}" y="${H - M.b + 24}" text-anchor="middle">${ugeNr(w.fra)}</text>`;
    });
  }

  // Ferie bag det hele: lærerens grå, elevernes skraveret
  const spaend = (liste, kl) => liste.filter(p => p.fra && p.til).map(p => {
    const f = tilDato(p.fra), t = addDays(tilDato(p.til), 1);
    const a = Math.max(x(f < v0 ? v0 : f), M.l), b = Math.min(x(t > v1 ? v1 : t), B - M.r);
    return b > a ? `<rect class="${kl}" x="${a.toFixed(1)}" y="${M.t}" width="${(b - a).toFixed(1)}" height="${H - M.t - M.b}"${kl === 'udv-elevferie' ? ` fill="url(#${id}-skrav)"` : ''}/>` : '';
  }).join('');
  const ferie = spaend(u.ferie || [], 'udv-ferie') + spaend(u.elevferie || [], 'udv-elevferie');

  const soejler = uger.filter(w => w.arbejdet != null && w.arbejdet > 0).map(w => {
    const a = x(w.fra), b = x(w.til), bred = Math.max(1, (b - a) * 0.62);
    const y1 = y(w.arbejdet / 60);
    return `<rect class="udv-soejle" x="${(a + (b - a - bred) / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bred.toFixed(1)}" height="${(y(0) - y1).toFixed(1)}"/>`;
  }).join('');
  // Trappekurver: vandret over ugen, lodret ved skiftet
  const trappe = f => uger.map((w, i) =>
    `${i ? 'L' : 'M'}${x(w.fra).toFixed(1)},${y(f(w) / 60).toFixed(1)}L${x(w.til).toFixed(1)},${y(f(w) / 60).toFixed(1)}`).join('');

  const iDag = nu > v0 && nu < v1
    ? `<line class="udv-idag" x1="${x(nu).toFixed(1)}" x2="${x(nu).toFixed(1)}" y1="${M.t}" y2="${H - M.b}"/>` : '';
  const valgt = st.valgt != null && st.valgt >= st.a && st.valgt < st.b
    ? `<rect class="udv-uge-valgt" x="${x(alle[st.valgt].fra).toFixed(1)}" y="${M.t}" width="${Math.max(1, x(alle[st.valgt].til) - x(alle[st.valgt].fra)).toFixed(1)}" height="${H - M.t - M.b}"/>` : '';

  return `<defs>
      <pattern id="${id}-skrav" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" class="udv-skrav"/>
      </pattern>
    </defs>
    ${ferie}
    ${gitter}${akse}
    ${valgt}
    ${soejler}
    <path class="udv-norm" d="${trappe(w => w.norm)}"/>
    <path class="udv-bel" d="${trappe(w => w.belastning)}"/>
    ${iDag}
    <g class="udv-hover" visibility="hidden">
      <rect class="udv-uge-mark" y="${M.t}" height="${H - M.t - M.b}"/>
    </g>
    <rect class="udv-markering" y="${M.t}" height="${H - M.t - M.b}" visibility="hidden"/>
    <rect class="udv-maal" x="${M.l}" y="0" width="${B - M.l - M.r}" height="${H}" fill="transparent"/>`;
}

// Ugens opgaver, med navn, farve og timer
function ugensDele(st, w) {
  return w.dele.filter(d => d.m >= 3).map(d => ({ ...d, ...(st.u.opgaver?.[d.id] || { navn: 'Ukendt opgave', farve: null }) }));
}
const prik = farve => `<i class="udv-prik-opg"${farve ? ` style="background:${esc(farve)}"` : ''}></i>`;

// Panelet under grafen: hvad den valgte uges belastning består af
function ugeDetalje(st) {
  const w = st.u.uger[st.valgt];
  const dele = ugensDele(st, w);
  const max = Math.max(1, ...dele.map(d => d.m));
  const rk = dele.map(d => `<li>
      ${prik(d.farve)}<span class="udv-opg-navn">${esc(d.navn)}</span>
      <span class="udv-opg-bar"><span style="width:${(d.m / max * 100).toFixed(1)}%"></span></span>
      <b>${fmtT1(d.m)}</b><span class="udv-opg-pct">${w.belastning > 0 ? Math.round(d.m / w.belastning * 100) : 0} %</span>
    </li>`).join('');
  const f = st.u.faktor;
  const note = f > 1.005 && dele.some(d => d.id !== REST)
    ? `<p class="udv-det-note">Hold og løbende opgaver er ganget med ${fmtTal1(f)}, så resten af normen — den tid, der ikke står på en opgave — er med i deres timer. Engangsopgaver tæller med den tid, der er brugt; det ubrugte er lagt jævnt ud over resten af året.</p>` : '';
  return `<div class="udv-det-head">
      <span><b>Uge ${ugeNr(w.fra)}</b> ${fmtSpaend(w.fra, w.til)}</span>
      <span class="udv-det-sum">belastning <b>${fmtT1(w.belastning)}</b>${w.arbejdet == null ? '' : ` · arbejdet <b>${fmtT1(w.arbejdet)}</b>`}</span>
      <button type="button" class="udv-zk udv-luk" aria-label="Luk ugens opgaver" title="Luk">×</button>
    </div>
    ${dele.length ? `<div class="udv-det-under">Timer på hver opgave i ugen — det, opgaven i snit kræver om ugen i sin periode</div><ul class="udv-opg">${rk}</ul>` : '<p class="udv-det-note">Ingen belastning i denne uge.</p>'}
    ${note}`;
}

// ─── Hover, zoom og klik ──────────────────────────────────
// Lyttes på rapportens beholder, så det overlever, at rapporten tegnes om
export function bindUdvikling(rod) {
  if (!rod || rod.dataset.udvBundet) return;
  rod.dataset.udvBundet = '1';

  // ─ Ugegrafen ─
  const tilstand = kort => ugeTilstand.get(kort.dataset.ugerId);
  const vx = (kort, klientX) => {
    const r = kort.querySelector('svg').getBoundingClientRect();
    return (klientX - r.left) / r.width * B;
  };
  // Ugens nummer i listen ved x i viewBox'en
  const ugeVed = (st, x) => {
    const n = st.b - st.a;
    const i = Math.floor((x - M.l) / (B - M.l - M.r) * n);
    if (i < 0 || i >= n) return Math.min(Math.max(i, 0), n - 1) + st.a;
    // Ugerne er ikke lige lange i kanterne af året — find den rigtige
    const w = st.u.uger, v0 = w[st.a].fra, v1 = w[st.b - 1].til;
    const t = v0.getTime() + (x - M.l) / (B - M.l - M.r) * (v1 - v0);
    for (let j = st.a; j < st.b; j++) if (t < w[j].til) return j;
    return st.b - 1;
  };
  const xFor = (st, d) => {
    const w = st.u.uger, v0 = w[st.a].fra, v1 = w[st.b - 1].til;
    return M.l + (d - v0) / (v1 - v0) * (B - M.l - M.r);
  };

  const tegnOm = kort => {
    const st = tilstand(kort);
    kort.querySelector('svg').innerHTML = ugeFigur(st);
    kort.querySelector('.udv-udsnit').textContent = udsnitTekst(st);
    const fokus = document.activeElement?.closest?.('.udv-zoom') ? document.activeElement.dataset.zoom : null;
    kort.querySelector('.udv-zoom').innerHTML = zoomKnapper(st);
    if (fokus) {
      const k = kort.querySelector(`.udv-zk[data-zoom="${fokus}"]`);
      (k && !k.disabled ? k : kort.querySelector('svg')).focus();
    }
  };
  const visDetalje = kort => {
    const st = tilstand(kort), el = kort.querySelector('.udv-detalje');
    el.hidden = st.valgt == null;
    el.innerHTML = st.valgt == null ? '' : ugeDetalje(st);
  };
  const saetUdsnit = (st, a, n) => {
    const N = st.u.uger.length;
    n = Math.min(N, Math.max(MIN_UGER, Math.round(n)));
    a = Math.min(Math.max(0, Math.round(a)), N - n);
    st.a = a; st.b = a + n;
  };
  // Zoom om en uge (den valgte, eller midten af udsnittet)
  const zoom = (kort, faktor, om = null) => {
    const st = tilstand(kort), n = st.b - st.a;
    const c = om ?? (st.valgt != null && st.valgt >= st.a && st.valgt < st.b ? st.valgt + 0.5 : (st.a + st.b) / 2);
    const ny = Math.max(MIN_UGER, Math.round(n * faktor));
    // Punktet om bliver stående samme sted i grafen
    saetUdsnit(st, c - (c - st.a) * ny / n, ny);
    tegnOm(kort);
  };
  const vaelg = (kort, i) => {
    const st = tilstand(kort);
    st.valgt = st.valgt === i ? null : i;
    if (st.valgt != null && (i < st.a || i >= st.b)) saetUdsnit(st, i < st.a ? i : i - (st.b - st.a) + 1, st.b - st.a);
    tegnOm(kort);
    visDetalje(kort);
  };

  const visUge = (kort, klientX) => {
    const st = tilstand(kort);
    const i = ugeVed(st, vx(kort, klientX));
    const w = st.u.uger[i];
    const mark = kort.querySelector('.udv-uge-mark');
    const x0 = xFor(st, w.fra), x1 = xFor(st, w.til);
    mark.setAttribute('x', x0); mark.setAttribute('width', Math.max(1, x1 - x0));
    kort.querySelector('.udv-hover').setAttribute('visibility', 'visible');
    const tip = kort.querySelector('.udv-tip');
    const dele = ugensDele(st, w), FLEST = 5;
    const liste = dele.slice(0, FLEST).map(d =>
      `<span class="udv-tip-opg">${prik(d.farve)}<span>${esc(d.navn)}</span><b>${fmtT1(d.m)}</b></span>`).join('');
    const flere = dele.length > FLEST ? `<span class="udv-tip-flere">+ ${dele.length - FLEST} andre · klik for alle</span>` : '';
    tip.hidden = false;
    tip.classList.add('udv-tip-uge');
    tip.innerHTML = `<span class="udv-tip-hoved"><span>Uge ${ugeNr(w.fra)} · ${fmtSpaend(w.fra, w.til)}</span>${w.arbejdet == null ? '' : `arbejdet <b>${fmtU(w.arbejdet)}</b> · `}belastning <b>${fmtU(w.belastning)}</b> · norm <b>${fmtU(w.norm)}</b></span>${liste}${flere}`;
    // Ved siden af ugen, på den side, der er mest plads
    const r = kort.querySelector('svg').getBoundingClientRect();
    const px0 = x0 / B * r.width, px1 = x1 / B * r.width, bred = tip.offsetWidth;
    const hoejre = px1 + 10 + bred <= r.width || px0 < r.width / 2;
    tip.style.left = `${Math.max(0, Math.min(hoejre ? px1 + 10 : px0 - 10 - bred, r.width - bred))}px`;
  };

  // Træk: et udsnit, der markeres og zoomes ind på, når man slipper
  let traek = null;
  const markering = (kort, x0, x1) => {
    const m = kort.querySelector('.udv-markering');
    const a = Math.max(M.l, Math.min(x0, x1)), b = Math.min(B - M.r, Math.max(x0, x1));
    m.setAttribute('x', a); m.setAttribute('width', Math.max(0, b - a));
    m.setAttribute('visibility', 'visible');
  };

  const vis = (kort, klientX) => {
    if (kort.dataset.ugerId) return visUge(kort, klientX);
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
    if (!kort || !e.target.closest('svg')) return;
    if (traek?.kort === kort) {
      if (Math.abs(e.clientX - traek.klientX) > 6) traek.flyttet = true;
      if (traek.flyttet) { skjul(kort); markering(kort, traek.x0, vx(kort, e.clientX)); return; }
    }
    vis(kort, e.clientX);
  });
  rod.addEventListener('pointerdown', e => {
    const kort = e.target.closest?.('.udv-kort');
    if (!kort || !e.target.closest('svg')) return;
    if (kort.dataset.ugerId && (e.pointerType !== 'mouse' || e.button === 0)) {
      traek = { kort, klientX: e.clientX, x0: vx(kort, e.clientX), flyttet: false };
      if (e.pointerType === 'mouse') e.preventDefault();   // ingen tekstmarkering
    }
    vis(kort, e.clientX);
  });
  rod.addEventListener('pointerup', e => {
    const t = traek; traek = null;
    if (!t) return;
    const kort = t.kort, st = tilstand(kort);
    if (!st) return;
    kort.querySelector('.udv-markering')?.setAttribute('visibility', 'hidden');
    if (t.flyttet) {
      const i0 = ugeVed(st, t.x0), i1 = ugeVed(st, vx(kort, e.clientX));
      const a = Math.min(i0, i1), n = Math.abs(i1 - i0) + 1;
      saetUdsnit(st, n < MIN_UGER ? a - (MIN_UGER - n) / 2 : a, n);
      tegnOm(kort);
      return;
    }
    vaelg(kort, ugeVed(st, vx(kort, e.clientX)));
  });
  rod.addEventListener('pointercancel', () => {
    traek?.kort.querySelector('.udv-markering')?.setAttribute('visibility', 'hidden');
    traek = null;
  });
  rod.addEventListener('pointerout', e => {
    const kort = e.target.closest?.('.udv-kort');
    if (kort && !kort.contains(e.relatedTarget)) skjul(kort);
  });

  // Ctrl + hjul (og knib på en touchpad): zoom om musen
  rod.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    const kort = e.target.closest?.('.udv-uger');
    if (!kort || !e.target.closest('svg')) return;
    e.preventDefault();
    const st = tilstand(kort);
    const x = vx(kort, e.clientX);
    const om = st.a + (x - M.l) / (B - M.l - M.r) * (st.b - st.a);
    zoom(kort, e.deltaY > 0 ? 1.5 : 1 / 1.5, om);
  }, { passive: false });

  rod.addEventListener('click', e => {
    const k = e.target.closest?.('.udv-uger .udv-zk');
    if (!k) return;
    const kort = k.closest('.udv-uger'), st = tilstand(kort);
    const n = st.b - st.a, skridt = Math.max(1, Math.round(n / 2));
    if (k.classList.contains('udv-luk')) {
      st.valgt = null; tegnOm(kort); visDetalje(kort);
      kort.querySelector('svg').focus();
      return;
    }
    switch (k.dataset.zoom) {
      case 'ind':     zoom(kort, 0.5); break;
      case 'ud':      zoom(kort, 2); break;
      case 'venstre': saetUdsnit(st, st.a - skridt, n); tegnOm(kort); break;
      case 'hoejre':  saetUdsnit(st, st.a + skridt, n); tegnOm(kort); break;
      case 'alt':     saetUdsnit(st, 0, st.u.uger.length); tegnOm(kort); break;
    }
  });

  // Tastatur på grafen: ←/→ flytter den valgte uge, +/− zoomer, Escape lukker
  rod.addEventListener('keydown', e => {
    const svg = e.target.closest?.('.udv-uger svg');
    if (!svg) return;
    const kort = svg.closest('.udv-uger'), st = tilstand(kort);
    const N = st.u.uger.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const fra = st.valgt ?? (e.key === 'ArrowLeft' ? st.b : st.a - 1);
      const i = Math.min(N - 1, Math.max(0, fra + (e.key === 'ArrowLeft' ? -1 : 1)));
      st.valgt = null;
      vaelg(kort, i);
    } else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(kort, 0.5); }
    else if (e.key === '-') { e.preventDefault(); zoom(kort, 2); }
    else if (e.key === 'Escape' && st.valgt != null) {
      e.preventDefault(); st.valgt = null; tegnOm(kort); visDetalje(kort);
    }
  });
}
