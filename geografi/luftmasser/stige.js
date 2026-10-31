// Højdestigen: tør og fugtig pakke løftes 100 m ad gangen, så reglen kan aflæses.
import { TOP, tilstand, skybase, pakketemperatur } from './model.mjs';
export const STIGETRIN = 100;
const RAEKKER = 6;
const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits:n, maximumFractionDigits:n }).replace('-', '−');
const fortegn = v => `${v > 0 ? '+' : ''}${tal(v)}`;
const PAKKER = [['toer', 'Tør'], ['fugtig', 'Fugtig']];
const procent = z => `${z / TOP * 100}%`;

function celle(luft, h, fra) {
  const t = pakketemperatur(luft, h), sky = h >= skybase(luft);
  const skift = fra === null ? '<span class="skift">start</span>' : `<span class="skift">${fortegn(t - pakketemperatur(luft, fra))}</span>`;
  return `<td class="${sky ? 'maettet' : ''}">${tal(t)} °C ${skift}${sky ? ' <small>sky</small>' : ''}</td>`;
}
// Seneste seks højder, højest øverst. Skiftet er regnet fra det forrige trin på vejen.
function raekker(z, retning) {
  const hoejder = Array.from({ length: RAEKKER }, (_, i) => z - retning * i * STIGETRIN).filter(h => h >= 0 && h <= TOP).sort((a, b) => b - a);
  return hoejder.map(h => {
    const fra = h - retning * STIGETRIN;
    const start = fra < 0 || fra > TOP ? null : fra;
    return `<tr class="${h === z ? 'nu' : ''}"><th scope="row">${tal(h, 0)} m</th>${celle('toer', h, start)}${celle('fugtig', h, start)}</tr>`;
  }).join('');
}
function skelet() {
  const pakker = PAKKER.map(([luft, navn], i) => `<div class="stige-sky" data-sky="${luft}" style="left:${i ? 72 : 28}%"></div>
    <div class="stige-base" data-base="${luft}" style="bottom:${procent(skybase(luft))}"><span style="left:calc(${i ? 72 : 28}% + 42px)">sky fra ${tal(skybase(luft), 0)} m</span></div>
    <div class="stige-pakke" data-pakke="${luft}" style="left:${i ? 72 : 28}%"><small>${navn}</small><b></b><small data-rf></small></div>`).join('');
  const akse = [0, 1000, 2000, 3000].map(h => `<span style="bottom:${procent(h)}">${tal(h, 0)}</span>`).join('');
  return `<div class="stige">
    <div class="stige-regel">
      <p class="umaettet"><strong>Umættet luft: 1,0 °C pr. 100 m</strong><small>Kaldes «tør» · RF under 100 % · tøradiabatisk</small></p>
      <p class="maettet"><strong>Mættet luft: 0,5 °C pr. 100 m</strong><small>RF 100 %, der dannes sky · fugtadiabatisk</small></p>
    </div>
    <div class="stige-midte">
      <div class="stige-figur"><span class="stige-enhed">Højde · m</span><div class="stige-akse">${akse}</div><div class="stige-spor">${pakker}</div><div class="stige-jord"></div></div>
      <div class="stige-tabel"><table><caption class="sr">Temperatur og ændring for hvert løft</caption><thead><tr><th scope="col">Højde</th><th scope="col">Tør pakke</th><th scope="col">Fugtig pakke</th></tr></thead><tbody></tbody></table></div>
    </div>
  </div>`;
}
// Elementerne genbruges mellem trin, så pakkerne glider op i stedet for at hoppe.
export function tegnStige(el, z, retning) {
  if (!el.querySelector('.stige')) el.innerHTML = skelet();
  for (const [luft] of PAKKER) {
    const s = tilstand('stabil', luft, z), base = skybase(luft), pakke = el.querySelector(`[data-pakke="${luft}"]`);
    pakke.style.bottom = procent(z);
    pakke.style.setProperty('--stoerrelse', `${72 * Math.cbrt(s.volumen)}px`);
    pakke.classList.toggle('maettet', s.maettet);
    pakke.querySelector('b').textContent = `${tal(s.temperatur)} °C`;
    pakke.querySelector('[data-rf]').textContent = `RF ${tal(s.fugtighed, 0)} %`;
    const sky = el.querySelector(`[data-sky="${luft}"]`);
    sky.style.bottom = procent(base);
    sky.style.height = procent(Math.max(0, z - base));
    sky.hidden = z <= base;
    el.querySelector(`[data-base="${luft}"]`).hidden = z < base;
  }
  el.querySelector('tbody').innerHTML = raekker(z, retning);
}
export function stigeForklaring(z, retning) {
  const lav = Math.round(skybase('fugtig')), hoej = Math.round(skybase('toer'));
  if (z === 0) return ['Løft pakkerne 100 m ad gangen', 'To luftpakker starter ved 22 °C, men den fugtige indeholder mere vanddamp. Hvor meget falder temperaturen for hvert løft?'];
  if (retning < 0) return ['Luft, der synker, bliver varmere', 'Pakkerne presses sammen og varmes op: 0,5 °C pr. 100 m, så længe skydråber fordamper, og derefter 1,0 °C pr. 100 m.'];
  if (z < lav) return ['Begge pakker er umættede', 'De bliver begge 1,0 °C koldere pr. 100 m. Hold øje med den fugtige pakkes RF, og løft videre.'];
  if (z === lav) return ['Den fugtige pakke er blevet mættet', 'RF er nået 100 %, og skyen begynder. Hvor meget falder temperaturen ved næste løft?'];
  if (z < hoej) return ['Nu afkøles de forskelligt', 'Den mættede pakke mister kun 0,5 °C pr. 100 m, den umættede stadig 1,0 °C. Derfor vokser forskellen mellem dem.'];
  if (z === hoej) return ['Nu er den tørre pakke også mættet', 'Den skulle højere op, fordi den indeholder mindre vanddamp. Hvad sker der ved næste løft?'];
  return ['Begge pakker er mættede', 'Nu mister begge 0,5 °C pr. 100 m, så forskellen mellem dem er konstant. Det er mætningen, der afgør afkølingen.'];
}
export function stigeBeskrivelse(z) {
  return PAKKER.map(([luft, navn]) => {
    const s = tilstand('stabil', luft, z);
    return `${navn} pakke ${tal(s.temperatur)} °C, relativ luftfugtighed ${tal(s.fugtighed, 0)} %, ${s.maettet ? 'mættet' : 'umættet'}`;
  }).join('. ');
}
