// Højdestigen: tør og fugtig pakke løftes 100 m ad gangen, så reglen kan aflæses.
import { TOP, tilstand, skybase, pakketemperatur } from './model.mjs';
export const STIGETRIN = 100;
const RAEKKER = 3;
export const TAEND_UMAETTET = 300, TAEND_MAETTET = 500; // reglerne tændes, når de er set
const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits:n, maximumFractionDigits:n }).replace('-', '−');
const fortegn = v => `${v > 0 ? '+' : ''}${tal(v)}`;
const PAKKER = [['toer', 'Tør', 20], ['fugtig', 'Fugtig', 66]];
const procent = z => `${z / TOP * 100}%`;

function celle(luft, h, fra) {
  const t = pakketemperatur(luft, h), sky = h >= skybase(luft);
  const skift = fra === null ? '<span class="skift">start</span>' : `<span class="skift">${fortegn(t - pakketemperatur(luft, fra))}</span>`;
  return `<td class="${sky ? 'maettet' : ''}">${tal(t)} °C ${skift}${sky ? ' <small>sky</small>' : ''}</td>`;
}
// Seneste højder, højest øverst. Skiftet er regnet fra det forrige trin på vejen.
function raekker(z, retning) {
  const hoejder = Array.from({ length: RAEKKER }, (_, i) => z - retning * i * STIGETRIN).filter(h => h >= 0 && h <= TOP).sort((a, b) => b - a);
  return hoejder.map(h => {
    const fra = h - retning * STIGETRIN;
    const start = fra < 0 || fra > TOP ? null : fra;
    return `<tr class="${h === z ? 'nu' : ''}"><th scope="row">${tal(h, 0)} m</th>${celle('toer', h, start)}${celle('fugtig', h, start)}</tr>`;
  }).join('');
}
function skelet() {
  const pakker = PAKKER.map(([luft, navn, x]) => `<div class="stige-sky" data-sky="${luft}" style="left:${x}%"></div>
    <div class="stige-base" data-base="${luft}" style="bottom:${procent(skybase(luft))}"><span style="left:calc(${x}% + 44px)">sky fra ${tal(skybase(luft), 0)} m</span></div>
    <div class="stige-pakke" data-pakke="${luft}" style="left:${x}%"><small>${navn}</small><b></b><small data-rf></small></div>
    <div class="stige-fald" data-fald="${luft}" style="left:calc(${x}% + 44px)"></div>`).join('');
  const akse = [0, 1000, 2000, 3000].map(h => `<span style="bottom:${procent(h)}">${tal(h, 0)}</span>`).join('');
  return `<div class="stige">
    <div class="stige-figur"><span class="stige-enhed">Højde · m</span><div class="stige-akse">${akse}</div><div class="stige-spor">${pakker}</div><div class="stige-jord"></div></div>
    <div class="stige-svar">
      <p class="stige-energi"></p>
      <p class="stige-regel" data-regel="umaettet"><strong></strong><small></small></p>
      <p class="stige-regel maettet" data-regel="maettet"><strong></strong><small></small></p>
      <div class="stige-tabel"><table><caption class="sr">Temperatur og ændring for de seneste løft</caption><thead><tr><th scope="col">Højde</th><th scope="col">Tør pakke</th><th scope="col">Fugtig pakke</th></tr></thead><tbody></tbody></table></div>
    </div>
  </div>`;
}
function regel(el, navn, taendt, vaerdi, forklaring, ventetekst) {
  const r = el.querySelector(`[data-regel="${navn}"]`);
  r.classList.toggle('taendt', taendt);
  r.querySelector('strong').textContent = `${navn === 'maettet' ? 'Mættet' : 'Umættet'} luft: ${taendt ? vaerdi : '?'} °C pr. 100 m`;
  r.querySelector('small').textContent = taendt ? forklaring : ventetekst;
}
// Elementerne genbruges mellem trin, så pakkerne glider op i stedet for at hoppe.
export function tegnStige(el, z, retning, hoejst) {
  if (!el.querySelector('.stige')) el.innerHTML = skelet();
  const fra = z - retning * STIGETRIN;
  for (const [luft] of PAKKER) {
    const s = tilstand('stabil', luft, z), base = skybase(luft), pakke = el.querySelector(`[data-pakke="${luft}"]`);
    pakke.style.bottom = procent(z);
    pakke.style.setProperty('--stoerrelse', `${72 * Math.cbrt(s.volumen)}px`);
    pakke.classList.toggle('maettet', s.maettet);
    pakke.querySelector('b').textContent = `${tal(s.temperatur)} °C`;
    pakke.querySelector('[data-rf]').textContent = `RF ${tal(s.fugtighed, 0)} %`;
    const fald = el.querySelector(`[data-fald="${luft}"]`);
    fald.style.bottom = procent(z);
    fald.classList.toggle('maettet', z >= base);
    fald.textContent = fra < 0 || fra > TOP ? '' : `${fortegn(s.temperatur - pakketemperatur(luft, fra))} °C`;
    const sky = el.querySelector(`[data-sky="${luft}"]`);
    sky.style.bottom = procent(base);
    sky.style.height = procent(Math.max(0, z - base));
    sky.hidden = z <= base;
    const linje = el.querySelector(`[data-base="${luft}"]`);
    linje.hidden = z < base;
    linje.querySelector('span').hidden = z <= base;
  }
  el.querySelector('.stige-energi').textContent = z === 0
    ? 'Når du løfter: lavere tryk → udvidelse → energi bruges på at skubbe omgivelserne væk → koldere luft.'
    : z <= skybase('fugtig')
      ? 'Pakken udvider sig og skubber omgivelserne væk. Arbejdet tager af dens indre energi, så temperaturen falder.'
      : 'Udvidelsen bruger stadig energi. Fortætning frigiver varme til den mættede luft og bremser afkølingen.';
  regel(el, 'umaettet', hoejst >= TAEND_UMAETTET, '1,0', 'Kaldes også «tør» · RF under 100 % · tøradiabatisk', 'Løft pakkerne, og aflæs faldet');
  regel(el, 'maettet', hoejst >= TAEND_MAETTET, '0,5', 'RF 100 %, der dannes sky · fugtadiabatisk', 'Viser sig, når der dannes sky');
  el.querySelector('tbody').innerHTML = raekker(z, retning);
}
export function stigeForklaring(z, retning) {
  const lav = Math.round(skybase('fugtig')), hoej = Math.round(skybase('toer'));
  if (z === 0) return ['Hvor meget koldere bliver pakkerne for hvert løft?', 'Begge starter ved 22 °C, men den fugtige indeholder mere vanddamp.'];
  if (retning < 0) return ['Luft, der synker, bliver varmere', 'Pakkerne presses sammen. De varmes 0,5 °C pr. 100 m, mens skydråber fordamper, og ellers 1,0 °C.'];
  if (z < lav) return ['Begge pakker falder lige meget', 'Hold øje med RF på den fugtige pakke.'];
  if (z === lav) return ['Den fugtige pakke er blevet mættet, og skyen begynder', 'Hvor meget falder den ved næste løft?'];
  if (z < hoej) return ['Mættet luft afkøles langsommere', 'Derfor bliver forskellen mellem den fugtige og den tørre pakke større.'];
  if (z === hoej) return ['Nu er den tørre pakke også mættet', 'Den skulle højere op, fordi den indeholder mindre vanddamp. Hvor meget falder den nu?'];
  return ['Begge pakker er mættede', 'Nu falder begge lige meget igen. Det er mætningen, der afgør afkølingen.'];
}
export function stigeBeskrivelse(z) {
  return PAKKER.map(([luft, navn]) => {
    const s = tilstand('stabil', luft, z);
    return `${navn} pakke ${tal(s.temperatur)} °C, relativ luftfugtighed ${tal(s.fugtighed, 0)} %, ${s.maettet ? 'mættet' : 'umættet'}`;
  }).join('. ');
}
