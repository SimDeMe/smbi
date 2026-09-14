/* ═══════════════════════════════════════════════════════════
   journal.js — arbejdssedlen ved siden af bordet.

   To faneblade: fremgangsmåden fra øvelsesvejledningen, hvor
   trinnene sætter flueben, efterhånden som de bliver udført, og
   journalen, hvor de målinger, man selv har taget, samler sig —
   temperaturer, tid for første boble, bobletællinger og BTB's
   farveskift. Det er de tal, grafen i databehandlingen skal
   bygges på.
   ═══════════════════════════════════════════════════════════ */
import {btbNavn, roerPH, btbFarve} from './gaering.js';

export const KOLBEFARVER = ['#5FB030', '#0FA593', '#0E86C8'];

export function urTekst(s){
  if(s === null || s === undefined) return '–';
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

const komma = (v, n = 0) => Number(v).toFixed(n).replace('.', ',');

/* ── Fremgangsmåden ────────────────────────────────────── *
 * Trinnene er dem fra Øvelser/Biologi/gaerforsog-bobleforsog.
 * Rækkefølgen er den anbefalede, men intet er spærret: man må
 * gerne gøre tingene i en anden orden og se, hvad der så sker.  */
export function trinListe(v){
  const [k1, k2, k3] = v.kolber;
  const alle = (f, liste = v.kolber) => liste.every(f);
  const opvarmet = k1.plads.type !== 'plade' && k2.plads.type === 'plade' && k3.plads.type === 'plade';

  const taelt = v.kolber.filter(k => k.taellinger.length > 0).length;

  return [
    {gruppe:'A · Klargøring af gærrør'},
    {klar:alle(r => r.vand, v.roer), navn:'Fyld de tre gærrør med vand',
     tekst:'Træk måleglasset op på et gærrør i stativet — ét ad gangen.'},
    {klar:alle(r => r.btb, v.roer), navn:'Dryp BTB i',
     tekst:'Bromthymolblåt farver vandet blåt. Notér farven, før forsøget går i gang.'},

    {gruppe:'B · De tre kolber'},
    {klar:alle(k => k.sukker > 0 && k.vand > 0), navn:'Sukker i vand',
     tekst:'25 g sukker og 100 mL vand i hver af de tre kolber.'},
    {klar:alle(k => k.gaer > 0 && k.roert), navn:'Gær i hver kolbe',
     tekst:'20 g gær i hver kolbe, og rør rundt.'},
    {klar:opvarmet, navn:'Tre forskellige temperaturer',
     tekst:'Kolbe 1 bliver stående ved stuetemperatur — den skal ikke på en varmeplade. Sæt Kolbe 2 på en varmeplade ved ca. 37 °C (håndvarmt) og Kolbe 3 på den anden ved ca. 60 °C (varmt), og mål efter med termometeret.'},
    {klar:alle(k => !!k.roer), navn:'Prop med gærrør på alle tre',
     tekst:'Træk et klargjort gærrør fra stativet ned på kolbens hals.'},
    {klar:v.ur.løber, navn:'Start stopuret',
     tekst:'Samtidig for alle tre kolber.'},

    {gruppe:'C · Observation'},
    {klar:v.kolber.some(k => k.foersteBoble !== null), navn:'Første boble',
     tekst:'Tidspunktet skrives i journalen af sig selv, når den første boble forlader gærrøret.'},
    {klar:taelt >= 3, navn:`Tæl bobler i ét minut — ${taelt} af 3 kolber talt`,
     tekst:'Vælg en kolbe, og tryk "Tæl bobler i 1 min", når gæringen er kommet i gang. Gør det én gang for hver af de tre kolber.'},
    {klar:v.kolber.some(k => k.skift.groen || k.skift.gul), navn:'BTB skifter farve',
     tekst:'Hold øje med farven i gærrørene. Blå over pH 7,6, grøn 6,0-7,6 og gul under 6,0.'},
  ];
}

export function tegnTrin(el, v){
  const liste = trinListe(v);
  const næste = liste.findIndex(t => !t.gruppe && !t.klar);
  el.innerHTML = liste.map((t, i) => {
    if(t.gruppe) return `<div class="trinhoved">${t.gruppe}</div>`;
    const k = t.klar ? 'klar' : i === næste ? 'naeste' : '';
    return `<ul class="trin"><li class="${k}"><span class="boks"></span>
      <div><b>${t.navn}</b><span>${t.tekst}</span></div></li></ul>`;
  }).join('');
}

/* ── Journalen ─────────────────────────────────────────── */
export function tegnJournal(el, v){
  const blokke = v.kolber.map((k, i) => {
    const r = k.roer;
    const rækker = [];

    const temp = k.maaltTemp === null
      ? '<span class="jtom">Ikke målt endnu</span>'
      : `<b>${komma(k.maaltTemp)}</b> °C`;
    rækker.push(`<div class="jrow"><span class="mono">Temperatur</span>${temp}</div>`);

    rækker.push(`<div class="jrow"><span class="mono">1. boble</span>${
      k.foersteBoble === null ? '–' : `<b>${urTekst(k.foersteBoble)}</b>`}</div>`);

    if(k.taellinger.length === 0){
      rækker.push('<div class="jrow"><span class="mono">Bobler/min</span>–</div>');
    } else {
      for(const t of k.taellinger)
        rækker.push(`<div class="jrow"><span class="mono">${urTekst(t.tid)}</span><b>${t.antal}</b> bobler/min</div>`);
    }

    const skift = [];
    if(k.skift.groen) skift.push(`grøn ${urTekst(k.skift.groen)}`);
    if(k.skift.gul)   skift.push(`gul ${urTekst(k.skift.gul)}`);
    const farve = r && r.vand && r.btb ? btbNavn(roerPH(r)) : '–';
    rækker.push(`<div class="jrow"><span class="mono">BTB</span><b>${farve}</b>${
      skift.length ? ` <span style="color:#5A6C69">(${skift.join(', ')})</span>` : ''}</div>`);

    return `<div class="jblok" style="--kf:${KOLBEFARVER[i]}">
      <h4><span class="prik"></span>${k.navn}<span class="t">${komma(k.temp)} °C</span></h4>
      ${rækker.join('')}
    </div>`;
  }).join('');

  el.innerHTML = `<button type="button" class="btn-mini" id="btn-kopi"
      style="margin-bottom:12px">Kopiér skema</button>${blokke}
    <p class="jnote">Tallene her svarer til skemaet i øvelsesvejledningen. Tegn en graf
    med temperaturen på x-aksen og bobler pr. minut på y-aksen, og sæt de tre kolbers
    tællinger ind som hvert sit punkt.</p>`;
}

/** Journalen som et skema, der kan sættes ind i et regneark — én
    række pr. kolbe, så temperatur og bobler/min står ved siden af
    hinanden og er klar til et (x,y)-plot. */
export function skemaTekst(v){
  const linjer = [];
  linjer.push(['Kolbe', 'Temperatur (°C)', 'Tid for første boble',
    'Tid for tælling', 'Bobler/min', 'BTB grøn fra', 'BTB gul fra'].join('\t'));
  for(const k of v.kolber){
    const sidste = k.taellinger[k.taellinger.length - 1];
    linjer.push([
      k.navn,
      k.maaltTemp === null ? '' : komma(k.maaltTemp),
      urTekst(k.foersteBoble),
      sidste ? urTekst(sidste.tid) : '–',
      sidste ? sidste.antal : '',
      urTekst(k.skift.groen),
      urTekst(k.skift.gul),
    ].join('\t'));
  }
  return linjer.join('\n');
}

/** Farveklatten til instrumentet. */
export function btbKlat(r){
  if(!r || !r.vand) return '#FFFFFF';
  return r.btb ? btbFarve(roerPH(r)) : '#CFE6F2';
}
