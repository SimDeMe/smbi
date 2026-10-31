// «Hvorfor»: tre korte trin med én figur og én forklaring ad gangen.
import { PAKKE, tilstand, uden_kondensation, latentVarme } from './model.mjs';
const HOEJDE = 1500; // her er den tørre pakke netop umættet hele vejen
const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits:n, maximumFractionDigits:n }).replace('-', '−');

export const HVORFOR_INTRO = '<strong>Hvorfor bliver stigende luft koldere?</strong> Adiabatisk betyder, at der ikke går varme ind eller ud af pakken.';
export const HVORFOR = [
  ['Trin 1 af 3 · Trykket falder, og luften udvider sig', 'Højere oppe er der mindre luft ovenover, så trykket er lavere. Derfor fylder pakken mere.'],
  ['Trin 2 af 3 · Udvidelsen koster energi', 'Pakken skubber omgivelserne væk og betaler med sin egen energi: molekylerne bliver langsommere, og temperaturen falder.'],
  ['Trin 3 af 3 · Fortætning giver varme tilbage', 'Når luften er mættet, bliver vanddamp til skydråber og frigiver varme. Luften bliver stadig koldere, men kun 0,5 °C pr. 100 m.']
];
const PILE = '<svg class="h-pile" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 -3V-19M44 -13l6-6 6 6M50 103v16M44 113l6 6 6-6M-3 50h-16M-13 44l-6 6 6 6M103 50h16M113 44l6 6-6 6"/></svg>';
function boble(etiket, vaerdi, { faktor = 1, under = '', ring = false, pile = false, maettet = false } = {}) {
  return `<div class="h-kolonne"><p class="h-etiket">${etiket}</p>
    <div class="h-boble ${maettet ? 'maettet' : ''} ${pile ? 'medpile' : ''}" style="--faktor:${faktor}">${ring ? '<i class="h-ring"></i>' : ''}${pile ? PILE : ''}<b>${vaerdi}</b>${maettet ? '<small>● ● ●<br>skydråber</small>' : ''}</div>
    <p class="h-under">${under}</p></div>`;
}
const pil = (tekst, under = '') => `<div class="h-pil"><b>${tekst}</b><small>${under}</small></div>`;

export function tegnBegreb(trin) {
  const jord = tilstand('stabil', 'toer', 0), oppe = tilstand('stabil', 'toer', HOEJDE), faktor = Math.cbrt(oppe.volumen), hoej = `${tal(HOEJDE, 0)} m`;
  const scener = [
    () => boble('Ved jorden', `${tal(jord.tryk, 0)} hPa`) + pil('→') + boble(hoej, `${tal(oppe.tryk, 0)} hPa`, { faktor, ring: true, under: `Fylder ${tal(oppe.volumen, 2)} gange så meget` }),
    () => boble('Ved jorden', `${tal(PAKKE)} °C`) + pil(`${tal(oppe.temperatur - PAKKE)} °C`) + boble(hoej, `${tal(oppe.temperatur)} °C`, { faktor, ring: true, pile: true, under: 'Skubber omgivelserne væk' }),
    () => boble(`${hoej}, uden sky`, `${tal(uden_kondensation(HOEJDE))} °C`) + pil(`+${tal(latentVarme('fugtig', HOEJDE))} °C`, 'varme fra fortætning') + boble(`${hoej}, med sky`, `${tal(tilstand('stabil', 'fugtig', HOEJDE).temperatur)} °C`, { maettet: true })
  ];
  return `<div class="h-scene">${scener[trin]()}</div>`;
}
