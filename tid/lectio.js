// lectio.js — rapport til tidsregistreringen i Lectio
//
// I Lectio tastes hver dag som ét tidsrum: fra kl. a til kl. b, en uge ad
// gangen. Rapporten giver de to tal for hver dag i skoleåret, ordnet i
// ugenumre med den nyeste uge øverst.
//
// «Fra» er dagens første start. «Til» er fra + dagens registrerede tid
// (korte pauser og ubunden tid tæller med, som i resten af rapporten) — så
// giver Lectio præcis de timer, appen har. Har dagen huller eller overlap,
// slutter den sidste registrering et andet sted, og det står med småt.

import { fmtMins, fmtTime } from './format.js';
import { addDays, startOfDay, mandag, ugeNr, kortDato, DAGE_KORT, datoInput } from './periode.js';

const MIN = 60000;

// Dagens tal ud fra de afsluttede registreringer, der starter den dag.
// En registrering hen over midnat hører til den dag, den begyndte.
export function lectioDage(entries) {
  const dage = new Map();     // '2026-09-28' → { fra, sum, reelSlut }
  entries.forEach(e => {
    if (e.durationMinutes == null || !e.startTime) return;
    const s   = e.startTime.toDate();
    const sl  = e.endTime ? e.endTime.toDate() : new Date(s.getTime() + e.durationMinutes * MIN);
    const k   = datoInput(s);
    const dag = dage.get(k) || { fra: s, sum: 0, reelSlut: sl };
    if (s < dag.fra) dag.fra = s;
    if (sl > dag.reelSlut) dag.reelSlut = sl;
    dag.sum += e.durationMinutes;
    dage.set(k, dag);
  });
  dage.forEach(dag => {
    // Lectio tager hele minutter: starten skæres ned til minuttet, og
    // sluttiden lægges derfra, så forskellen er præcis den registrerede tid
    const fra = new Date(dag.fra); fra.setSeconds(0, 0);
    // Positiv: minutter uden registrering mellem første start og sidste slut.
    // Negativ: registreringer, der overlapper. Regnes fra den rigtige start,
    // så de afskårne sekunder ikke bliver til et minuts hul.
    dag.afvig = Math.round((dag.reelSlut - dag.fra) / MIN - dag.sum);
    dag.fra = fra;
    dag.til = new Date(fra.getTime() + Math.round(dag.sum) * MIN);
  });
  return dage;
}

// Ugerne fra skoleårets start til i dag (og videre, hvis der ligger tid
// frem i tiden), nyeste først
export function lectioUger(entries, fra, til, nu = new Date()) {
  const dage = lectioDage(entries);
  let sidste = addDays(mandag(nu), 7);
  dage.forEach((_, k) => {
    const [y, m, d] = k.split('-').map(Number);
    const naeste = addDays(mandag(new Date(y, m - 1, d)), 7);
    if (naeste > sidste) sidste = naeste;
  });
  if (sidste > til) sidste = addDays(mandag(addDays(til, -1)), 7);

  const uger = [];
  for (let m = mandag(fra); m < sidste; m = addDays(m, 7)) {
    const ugensDage = Array.from({ length: 7 }, (_, i) => {
      const dato = addDays(m, i);
      return { dato, ...(dage.get(datoInput(dato)) || {}) };
    }).filter((d, i) => i < 5 || d.sum);          // weekenden kun med tid
    uger.push({
      mandag: m, nr: ugeNr(m),
      dage: ugensDage,
      sum: ugensDage.reduce((s, d) => s + (d.sum || 0), 0)
    });
  }
  return uger.reverse();
}

// ─── Tegning ──────────────────────────────────────────────
export function tegnLectio(entries, fra, til) {
  const uger = lectioUger(entries, fra, til);
  const idag = startOfDay(new Date()).getTime();

  const raekke = d => {
    const navn = `${DAGE_KORT[d.dato.getDay()]} ${d.dato.getDate()}/${d.dato.getMonth() + 1}`;
    const cls  = d.dato.getTime() === idag ? ' class="lectio-idag"' : '';
    if (!d.sum) return `<tr${cls}><th scope="row">${navn}</th><td colspan="3" class="lectio-tom">–</td></tr>`;
    const note = d.afvig > 0
      ? `Sidste registrering slutter ${fmtTime(d.reelSlut)} — ${fmtMins(d.afvig)} uden registrering`
      : d.afvig < 0
        ? `Sidste registrering slutter ${fmtTime(d.reelSlut)} — ${fmtMins(-d.afvig)} overlap tæller dobbelt`
        : '';
    return `<tr${cls}>
        <th scope="row">${navn}</th>
        <td class="lectio-kl">${fmtTime(d.fra)}</td>
        <td class="lectio-kl">${fmtTime(d.til)}</td>
        <td class="lectio-sum">${fmtMins(d.sum)}</td>
      </tr>${note ? `<tr class="lectio-note"><td></td><td colspan="3">${note}</td></tr>` : ''}`;
  };

  const uge = u => {
    const slut = addDays(u.mandag, 6);
    return `<section class="lectio-uge" aria-label="Uge ${u.nr}">
      <div class="lectio-uge-hoved">
        <span class="lectio-uge-nr">Uge ${u.nr}</span>
        <span class="lectio-uge-dato">${kortDato(u.mandag)} – ${kortDato(slut)}</span>
        <span class="lectio-uge-sum">${u.sum ? fmtMins(u.sum) : '–'}</span>
      </div>
      ${u.sum ? `<table class="lectio-tabel">
        <thead><tr><th scope="col">Dag</th><th scope="col">Fra</th><th scope="col">Til</th><th scope="col">Tid</th></tr></thead>
        <tbody>${u.dage.map(raekke).join('')}</tbody>
      </table>` : '<p class="lectio-ingen">Ingen registreringer</p>'}
    </section>`;
  };

  return `<div class="lectio">
    <p class="lectio-forklaring">Til Lectio: én linje pr. dag. <b>Til</b> er fra + dagens
    registrerede tid, korte pauser og ubunden tid medregnet — så giver Lectio de samme timer
    som appen.</p>
    ${uger.length ? uger.map(uge).join('') : '<p class="lectio-ingen">Ingen uger i perioden</p>'}
  </div>`;
}
