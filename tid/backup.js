// backup.js — fuld backup som JSON, og gendannelse fra en sådan fil
//
// Backuppen er alt under users/{uid}/: indstillingerne (settings/config),
// aktiviteterne (hold og opgaver, med rettede sæt og normgrundlag) og
// registreringerne (også pauser og en timer, der kører). Appen gemmer intet
// andet, heller ikke i browseren.
//
// Filen er lavet til at kunne rettes i hånden eller af en AI — fx for at
// lægge ugens faktiske skema ind — og læses ind igen. Ved gendannelse er
// filen sandheden: det, der står i den, bliver dine data, og det, der ikke
// står i den, slettes. Før noget skrives, vises hvad der ændres, og der
// hentes en backup af det, der ligger nu.

import { db, auth, showToast, COLOR_PALETTE } from './app.js';
import { openSheet, closeSheet } from './ark.js';
import { esc } from './format.js';
import {
  collection, doc, getDoc, getDocs, writeBatch, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

const FORMAT         = 'tid-backup';
const FORMAT_VERSION = 2;
const ARBEJDSTYPER   = ['undervisning', 'forberedelse', 'retning'];
const OPTJENING      = ['loebende', 'afslutning', 'manuel'];
const TIDSFELTER     = ['startTime', 'endTime', 'archivedAt'];   // gemmes som Timestamp
const SKOLEAAR       = /^\d{4}\/\d{2}$/;
const DATO           = /^\d{4}-\d{2}-\d{2}$/;

// Står øverst i filen, så den, der retter i den — menneske eller AI — ved,
// hvad felterne betyder. Ignoreres ved gendannelse.
const OM = [
  'Backup fra Tid (smbi.dk/tid). Kan rettes og læses ind igen under Indstillinger → Data → Gendan fra backup.',
  'Filen er sandheden ved gendannelse: det, der står her, bliver dine data; aktiviteter og registreringer, der fjernes fra filen, slettes i appen.',
  'Behold "id" på det, der findes i forvejen. Nye aktiviteter og registreringer må gerne være uden id — så får de et.',
  'Tidspunkter skrives som ISO 8601, gerne med tidszone: "2026-10-05T08:10:00+02:00". Uden tidszone læses de som dansk tid.',
  'activities: name, type ("hold" eller "opgave"), schoolYear ("2026/27"), budgetHours (timer), parentId (id på en overordnet opgave eller null — kun for opgaver), isArchived, color, order, note, optjening ("loebende", "afslutning" eller "manuel", kun opgaver).',
  'entries: activityId (id på en aktivitet, eller null for pause/ubundet tid), workType ("undervisning", "forberedelse" eller "retning" — kun når aktiviteten er et hold), startTime, endTime (null = timeren kører; højst én), note, isBreak (true for pauser). durationMinutes regnes ud af start og slut.',
  'Skemaets moduler: 1. modul 08:10–09:45, 2. modul 10:00–11:35, frokost 11:35–12:00, 3. modul 12:00–13:35, 4. modul 13:45–15:20. Et modul i undervisning har isModule: true.',
  'settings: currentSchoolYear, normHours (årsnorm i timer), ferie, normFaktorer, portefoljeAndet m.fl. Mangler settings (eller er den null), beholdes de nuværende indstillinger.'
];

const sti = (uid, del) => `users/${uid}/${del}`;

let userId = null;

// ─── Til og fra JSON ──────────────────────────────────────
// Firestore Timestamp har sin egen toJSON, som JSON.stringify kalder før
// en replacer — derfor konverteres rekursivt inden serialisering.
export const tilJson = v => {
  if (v?.toDate) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(tilJson);
  if (v && typeof v === 'object') return Object.fromEntries(
    Object.entries(v).map(([k, x]) => [k, tilJson(x)])
  );
  return v;
};

// Samme indhold → samme tekst, uanset nøglernes rækkefølge
const kanonisk = v => JSON.stringify(v, (k, x) =>
  x && typeof x === 'object' && !Array.isArray(x)
    ? Object.fromEntries(Object.keys(x).sort().map(n => [n, x[n]])) : x);

async function hentAlt(uid) {
  const [acts, entries, cfg] = await Promise.all([
    getDocs(collection(db, sti(uid, 'activities'))),
    getDocs(collection(db, sti(uid, 'entries'))),
    getDoc(doc(db, sti(uid, 'settings/config')))
  ]);
  return {
    settings:   cfg.exists() ? cfg.data() : null,
    activities: acts.docs.map(d => ({ id: d.id, ...d.data() })),
    entries:    entries.docs.map(d => ({ id: d.id, ...d.data() }))
  };
}

// Navnet på service workerens cache (tid-v41), som i Indstillinger
async function appVersion() {
  try {
    const nr = (await caches.keys())
      .map(k => /^tid-v(\d+)$/.exec(k)?.[1]).filter(Boolean).map(Number);
    return nr.length ? `tid-v${Math.max(...nr)}` : null;
  } catch { return null; }
}

function download(payload, navn) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: navn });
  document.body.append(a);
  a.click();
  a.remove();
  // Safari skal nå at læse filen, før adressen frigives
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const iDag = () => new Date().toISOString().slice(0, 10);

async function lavBackup(uid) {
  const data = await hentAlt(uid);
  return tilJson({
    format:        FORMAT,
    formatVersion: FORMAT_VERSION,
    om:            OM,
    exportedAt:    new Date().toISOString(),
    appVersion:    await appVersion(),
    user:          { uid, email: auth.currentUser?.email ?? null },
    ...data
  });
}

// ─── Eksport ──────────────────────────────────────────────
export async function eksporter() {
  const uid = userId;
  if (!uid) return;
  try {
    const payload = await lavBackup(uid);
    download(payload, `tidsregistrering-backup-${iDag()}.json`);
    showToast(`Backup downloadet · ${payload.activities.length} aktiviteter, ${payload.entries.length} registreringer`);
  } catch (err) {
    console.error('JSON eksport fejl:', err);
    showToast('Eksport fejlede — prøv igen');
  }
}

// ─── Læs en backupfil ─────────────────────────────────────
// Giver { fejl, advarsler, settings, activities, entries }. Er der fejl,
// gendannes intet. settings er undefined, når filen ikke har nogen — så
// beholdes de nuværende.

// Som Firestores egne id'er: 20 tegn
const nytId = () => {
  const t = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const b = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(b, x => t[x % t.length]).join('');
};
const gyldigtId = id => typeof id === 'string' && id.length > 0 && id.length <= 200
  && !id.includes('/') && id !== '.' && id !== '..' && !/^__.*__$/.test(id);

const tilTidspunkt = v => {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
};
const erTal = v => typeof v === 'number' && isFinite(v);
const erObjekt = v => v && typeof v === 'object' && !Array.isArray(v);

export function tolkBackup(tekst) {
  const fejl = [], advarsler = [];
  let fil;
  try { fil = JSON.parse(tekst); }
  catch (e) { return { fejl: [`Filen er ikke gyldig JSON (${e.message})`], advarsler }; }

  if (!erObjekt(fil)) return { fejl: ['Filen er ikke en backup fra Tid'], advarsler };
  if (fil.format && fil.format !== FORMAT) fejl.push(`Ukendt format «${fil.format}»`);
  if (!Array.isArray(fil.activities)) fejl.push('Filen mangler listen «activities»');
  if (!Array.isArray(fil.entries))    fejl.push('Filen mangler listen «entries»');
  if (fejl.length) return { fejl, advarsler };

  const settings   = tolkSettings(fil.settings, fejl);
  const activities = tolkAktiviteter(fil.activities, fejl, advarsler);
  const entries    = tolkPoster(fil.entries, activities, fejl, advarsler);
  return { fejl, advarsler, settings, activities, entries,
    exportedAt: tilTidspunkt(fil.exportedAt) };
}

function tolkSettings(s, fejl) {
  if (s === undefined || s === null) return undefined;
  if (!erObjekt(s)) { fejl.push('«settings» skal være et objekt'); return undefined; }
  const f = m => fejl.push(`Indstillinger: ${m}`);
  if (s.currentSchoolYear != null && s.currentSchoolYear !== '' && !SKOLEAAR.test(s.currentSchoolYear))
    f(`skoleåret «${s.currentSchoolYear}» skal skrives som 2026/27`);
  if (s.normHours != null && !(erTal(s.normHours) && s.normHours > 0)) f('normHours skal være et positivt tal');
  if (s.autoStopAfterMinutes != null && !(erTal(s.autoStopAfterMinutes) && s.autoStopAfterMinutes > 0))
    f('autoStopAfterMinutes skal være et positivt tal');
  for (const [felt, kontrol] of [['ferie', tjekFerie], ['portefoljeAndet', tjekAndet], ['normFaktorer', tjekFaktor]]) {
    if (s[felt] == null) continue;
    if (!erObjekt(s[felt])) { f(`${felt} skal være et objekt med skoleår som nøgler`); continue; }
    for (const [aar, v] of Object.entries(s[felt])) {
      const m = kontrol(v);
      if (m) f(`${felt} ${aar}: ${m}`);
    }
  }
  return s;
}
const tjekFerie = l => !Array.isArray(l) ? 'skal være en liste'
  : l.some(p => !DATO.test(p?.fra) || !DATO.test(p?.til) || p.fra > p.til)
    ? 'hver periode skal have fra og til som ÅÅÅÅ-MM-DD, og fra må ikke ligge efter til' : null;
const tjekAndet = l => !Array.isArray(l) ? 'skal være en liste'
  : l.some(x => !erTal(x?.timer)) ? 'hver linje skal have timer som tal' : null;
const tjekFaktor = v => !erObjekt(v) ? 'skal være et objekt'
  : (v.faktor != null && !erTal(v.faktor)) ? 'faktor skal være et tal' : null;

function tolkAktiviteter(liste, fejl, advarsler) {
  const ud = [], set = new Set();
  let maxOrder = Math.max(0, ...liste.map(a => erTal(a?.order) ? a.order : 0));
  liste.forEach((a, i) => {
    const hvem = `Aktivitet ${i + 1}${a?.name ? ` «${a.name}»` : ''}`;
    if (!erObjekt(a)) { fejl.push(`${hvem}: er ikke et objekt`); return; }
    const { id, ...felter } = a;
    const rid = id == null || id === '' ? nytId() : id;
    if (!gyldigtId(rid)) { fejl.push(`${hvem}: ugyldigt id «${id}»`); return; }
    if (set.has(rid)) { fejl.push(`${hvem}: id «${rid}» står to gange`); return; }
    set.add(rid);

    if (typeof felter.name !== 'string' || !felter.name.trim()) fejl.push(`${hvem}: mangler et navn`);
    if (felter.type !== 'hold' && felter.type !== 'opgave') fejl.push(`${hvem}: type skal være «hold» eller «opgave»`);
    if (!SKOLEAAR.test(felter.schoolYear ?? '')) fejl.push(`${hvem}: schoolYear skal skrives som 2026/27`);
    if (felter.budgetHours != null && !(erTal(felter.budgetHours) && felter.budgetHours >= 0))
      fejl.push(`${hvem}: budgetHours skal være et tal (timer)`);
    if (felter.optjening != null && !OPTJENING.includes(felter.optjening))
      fejl.push(`${hvem}: optjening skal være «loebende», «afslutning» eller «manuel»`);
    if (felter.rettedeSaet != null && !Array.isArray(felter.rettedeSaet))
      fejl.push(`${hvem}: rettedeSaet skal være en liste`);

    // Det, appen altid sætter på en ny aktivitet, sættes her, hvis det mangler
    const data = { ...felter };
    if (data.parentId === undefined || data.parentId === '') data.parentId = null;
    if (data.isArchived === undefined) data.isArchived = false;
    if (data.budgetHours === undefined) data.budgetHours = 0;
    if (!data.color) data.color = COLOR_PALETTE[ud.length % COLOR_PALETTE.length];
    if (!erTal(data.order)) data.order = ++maxOrder;
    for (const k of TIDSFELTER) if (k in data && data[k] != null) {
      const d = tilTidspunkt(data[k]);
      if (d) data[k] = Timestamp.fromDate(d); else fejl.push(`${hvem}: ${k} er ikke et tidspunkt`);
    }
    ud.push({ id: rid, data, hvem });
  });

  // Hierarkiet: kun opgaver under opgaver, samme skoleår, ingen løkker
  const efterId = new Map(ud.map(a => [a.id, a]));
  for (const a of ud) {
    const p = a.data.parentId;
    if (p == null) continue;
    const far = efterId.get(p);
    if (a.data.type === 'hold') fejl.push(`${a.hvem}: et hold kan ikke ligge under en anden aktivitet`);
    else if (!far) fejl.push(`${a.hvem}: parentId «${p}» findes ikke blandt aktiviteterne`);
    else if (far.data.type !== 'opgave') fejl.push(`${a.hvem}: kan kun ligge under en opgave`);
    else if (far.id === a.id) fejl.push(`${a.hvem}: kan ikke ligge under sig selv`);
    else if (far.data.schoolYear !== a.data.schoolYear)
      advarsler.push(`${a.hvem} ligger i ${a.data.schoolYear}, men den overordnede opgave i ${far.data.schoolYear}`);
  }
  return ud;
}

function tolkPoster(liste, activities, fejl, advarsler) {
  const ud = [], set = new Set();
  const akt = new Map(activities.map(a => [a.id, a.data]));
  let koerer = 0, udenType = 0, lange = 0;
  liste.forEach((e, i) => {
    const hvem = `Registrering ${i + 1}${e?.id ? ` (${e.id})` : ''}`;
    if (!erObjekt(e)) { fejl.push(`${hvem}: er ikke et objekt`); return; }
    const { id, ...felter } = e;
    const rid = id == null || id === '' ? nytId() : id;
    if (!gyldigtId(rid)) { fejl.push(`${hvem}: ugyldigt id «${id}»`); return; }
    if (set.has(rid)) { fejl.push(`${hvem}: id «${rid}» står to gange`); return; }
    set.add(rid);

    const start = tilTidspunkt(felter.startTime);
    if (!start) { fejl.push(`${hvem}: startTime mangler eller er ikke et tidspunkt`); return; }
    if (!('endTime' in felter)) { fejl.push(`${hvem}: endTime mangler (skriv null, hvis timeren skal køre)`); return; }
    const slut = felter.endTime === null ? null : tilTidspunkt(felter.endTime);
    if (felter.endTime !== null && !slut) { fejl.push(`${hvem}: endTime er ikke et tidspunkt`); return; }
    if (slut && slut <= start) { fejl.push(`${hvem}: slutter før den starter`); return; }
    if (!slut) koerer++;

    const aid = felter.activityId ?? null;
    const a = aid == null ? null : akt.get(aid);
    if (aid != null && !a) fejl.push(`${hvem}: activityId «${aid}» findes ikke blandt aktiviteterne`);
    if (felter.workType != null && !ARBEJDSTYPER.includes(felter.workType))
      fejl.push(`${hvem}: workType skal være «undervisning», «forberedelse» eller «retning»`);
    if (a?.type === 'hold' && !felter.workType) udenType++;

    const data = { ...felter, activityId: aid,
      startTime: Timestamp.fromDate(start), endTime: slut ? Timestamp.fromDate(slut) : null };
    if (!('workType' in data)) data.workType = null;
    // Varigheden følger tidspunkterne; et gemt tal, der passer, røres ikke
    const min = slut ? Math.round((slut - start) / 60000) : null;
    if (min == null) data.durationMinutes = null;
    else if (!erTal(data.durationMinutes) || Math.abs(data.durationMinutes - min) > 1) data.durationMinutes = min;
    if (min > 12 * 60) lange++;
    if ('archivedAt' in data) delete data.archivedAt;
    ud.push({ id: rid, data, hvem });
  });
  if (koerer > 1) fejl.push(`${koerer} registreringer er uden sluttid — kun én timer kan køre ad gangen`);
  if (udenType) advarsler.push(`${udenType} ${udenType === 1 ? 'registrering' : 'registreringer'} på hold er uden arbejdstype og tæller ikke med i holdets fordeling`);
  if (lange) advarsler.push(`${lange} ${lange === 1 ? 'registrering' : 'registreringer'} varer over 12 timer`);
  return ud;
}

// ─── Hvad ændres ──────────────────────────────────────────
// Sammenligner filen med det, der ligger nu, dokument for dokument
export function lavPlan(nu, fil) {
  const del = (gamle, nye) => {
    const efterId = new Map(gamle.map(({ id, ...d }) => [id, d]));
    const ny = [], aendret = [], uaendret = [];
    for (const n of nye) {
      const g = efterId.get(n.id);
      if (!g) ny.push(n);
      else if (kanonisk(tilJson(g)) !== kanonisk(tilJson(n.data))) aendret.push(n);
      else uaendret.push(n);
      efterId.delete(n.id);
    }
    const slettes = [...efterId].map(([id, data]) => ({ id, data }));
    return { ny, aendret, uaendret, slettes };
  };
  const settings = fil.settings === undefined ? 'beholdes'
    : kanonisk(tilJson(nu.settings)) === kanonisk(tilJson(fil.settings)) ? 'uaendret' : 'aendret';
  return {
    settings,
    activities: del(nu.activities, fil.activities),
    entries:    del(nu.entries, fil.entries)
  };
}

const ingenAendring = p => p.settings !== 'aendret'
  && ['activities', 'entries'].every(k => !p[k].ny.length && !p[k].aendret.length && !p[k].slettes.length);

// ─── Skriv ────────────────────────────────────────────────
// Firestore tager højst 500 skrivninger pr. batch. Først det nye og ændrede,
// til sidst det, der slettes — går noget galt undervejs, er der hellere for
// meget end for lidt.
async function skriv(uid, plan, fil) {
  const ops = [];
  if (plan.settings === 'aendret')
    ops.push(b => b.set(doc(db, sti(uid, 'settings/config')), fil.settings));
  for (const k of ['activities', 'entries'])
    for (const x of [...plan[k].ny, ...plan[k].aendret])
      ops.push(b => b.set(doc(db, sti(uid, `${k}/${x.id}`)), x.data));
  for (const k of ['entries', 'activities'])
    for (const x of plan[k].slettes)
      ops.push(b => b.delete(doc(db, sti(uid, `${k}/${x.id}`))));
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db);
    ops.slice(i, i + 400).forEach(op => op(b));
    await b.commit();
  }
}

// ─── Arket ────────────────────────────────────────────────
let valgt = null;   // den tolkede fil, mens arket er åbent

const $ = id => document.getElementById(id);
const flertal = (n, en, flere) => `${n} ${n === 1 ? en : flere}`;

async function vaelgFil(e) {
  const fil = e.target.files?.[0];
  e.target.value = '';           // samme fil kan vælges igen
  if (!fil) return;
  const uid = userId;
  if (!uid) return;
  let tekst;
  try { tekst = await fil.text(); }
  catch { showToast('Kunne ikke læse filen'); return; }
  valgt = tolkBackup(tekst);
  valgt.navn = fil.name;
  let plan = null;
  if (!valgt.fejl.length) {
    try { plan = lavPlan(await hentAlt(uid), valgt); }
    catch (err) { console.error('Gendan fejl:', err); valgt.fejl.push('Kunne ikke hente dine nuværende data — prøv igen'); }
  }
  tegnArk(plan);
  openSheet('gendan-sheet', 'gendan-backdrop');
}

function tegnArk(plan) {
  const { fejl, advarsler } = valgt;
  const knap = $('btn-do-gendan');
  let html = `<p class="sheet-desc">Fil: <strong>${esc(valgt.navn)}</strong>${valgt.exportedAt
    ? ` · taget ${valgt.exportedAt.toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}</p>`;

  if (fejl.length) {
    html += `<p class="warn-text">Filen kan ikke læses ind — ret ${fejl.length === 1 ? 'fejlen' : `de ${fejl.length} fejl`} og prøv igen:</p>
      <ul class="gendan-fejl">${fejl.slice(0, 15).map(f => `<li>${esc(f)}</li>`).join('')}
      ${fejl.length > 15 ? `<li>… og ${fejl.length - 15} mere</li>` : ''}</ul>`;
  } else if (plan) {
    const raekke = (navn, d) => `<tr><th scope="row">${navn}</th>
      <td>${d.ny.length}</td><td>${d.aendret.length}</td><td>${d.slettes.length}</td><td>${d.uaendret.length}</td></tr>`;
    html += `<table class="gendan-tabel">
      <thead><tr><th></th><th scope="col">Nye</th><th scope="col">Ændres</th><th scope="col">Slettes</th><th scope="col">Uændret</th></tr></thead>
      <tbody>${raekke('Aktiviteter', plan.activities)}${raekke('Registreringer', plan.entries)}</tbody></table>
      <p class="settings-sub">Indstillinger: ${{ aendret: 'ændres', uaendret: 'uændret', beholdes: 'står ikke i filen — dine nuværende beholdes' }[plan.settings]}</p>`;

    const efter = valgt.exportedAt
      ? plan.entries.slettes.filter(x => x.data.startTime?.toDate?.() > valgt.exportedAt).length : 0;
    if (efter) advarsler.unshift(`${flertal(efter, 'registrering', 'registreringer')} er lavet, efter backuppen blev taget, og slettes`);
    if (plan.activities.slettes.length) {
      const navne = plan.activities.slettes.slice(0, 5).map(x => `«${x.data.name}»`).join(', ');
      advarsler.push(`Slettes: ${navne}${plan.activities.slettes.length > 5 ? ' …' : ''}`);
    }
    if (advarsler.length) html += `<ul class="gendan-advarsler">${advarsler.map(a => `<li>${esc(a)}</li>`).join('')}</ul>`;
    html += ingenAendring(plan)
      ? '<p class="sheet-desc">Filen er den samme som dine data — der er intet at gendanne.</p>'
      : '<p class="settings-sub">Før noget skrives, hentes en backup af dine nuværende data, så du kan fortryde.</p>';
  }
  $('gendan-body').innerHTML = html;
  knap.disabled = !!fejl.length || !plan || ingenAendring(plan);
}

async function gendan() {
  const uid = userId;
  if (!uid || !valgt || valgt.fejl.length) return;
  const knap = $('btn-do-gendan');
  knap.disabled = true;
  try {
    // Sikkerhedskopi af det, der ligger nu — og planen laves igen ud fra
    // den, så intet registreret i mellemtiden overses
    const nu = await lavBackup(uid);
    download(nu, `tidsregistrering-foer-gendannelse-${iDag()}.json`);
    const plan = lavPlan(await hentAlt(uid), valgt);
    await skriv(uid, plan, valgt);
    closeSheet('gendan-sheet', 'gendan-backdrop');
    showToast('Backup gendannet — appen indlæses igen');
    // Indstillingerne læses kun ved opstart; en frisk start giver hele
    // appen de nye data på én gang
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    console.error('Gendan fejl:', err);
    showToast('Gendannelsen fejlede — dine data før gendannelsen ligger i den downloadede fil', 6000);
    knap.disabled = false;
  }
}

// Kaldes ved hvert skift af bruger; knapperne bindes kun første gang
let bundet = false;
export function initBackup(uid) {
  userId = uid;
  if (bundet) return;
  bundet = true;
  $('btn-export-json')?.addEventListener('click', eksporter);
  $('btn-gendan')?.addEventListener('click', () => $('gendan-fil').click());
  $('gendan-fil')?.addEventListener('change', vaelgFil);
  $('btn-do-gendan')?.addEventListener('click', gendan);
  const luk = () => { closeSheet('gendan-sheet', 'gendan-backdrop'); valgt = null; };
  $('gendan-sheet-close')?.addEventListener('click', luk);
  $('btn-gendan-annuller')?.addEventListener('click', luk);
  $('gendan-backdrop')?.addEventListener('click', luk);
}
