// «Hvorfor»: tre korte trin med én figur og én forklaring ad gangen.
import { PAKKE, skybase, tilstand, uden_kondensation, latentVarme } from './model.mjs';
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

export function hvorforForklaring(trin, z) {
  const [titel, tekst] = HVORFOR[trin];
  if (trin !== 2) return [titel, tekst];
  const base = skybase('fugtig');
  return [titel, z <= base
    ? 'Den fugtige pakke har endnu ikke fået varme fra fortætning. Løft den over 400 m: vanddamp fortættes til dråber og frigiver energi.'
    : 'Vanddamp fortættes til dråber og frigiver den energi, der blev optaget ved fordampning. Det bremser afkølingen, mens luften stadig udvider sig.'];
}

export function tegnBegreb(trin, z) {
  const jord = tilstand('stabil', 'toer', 0), oppe = tilstand('stabil', 'toer', z), faktor = Math.cbrt(oppe.volumen), hoej = `${tal(z, 0)} m`;
  const fugtig = tilstand('stabil', 'fugtig', z), varme = latentVarme('fugtig', z);
  const udenVolumen = fugtig.volumen * (uden_kondensation(z) + 273.15) / (fugtig.temperatur + 273.15);
  const scener = [
    () => boble('Ved jorden', `${tal(jord.tryk, 0)} hPa`) + pil('→') + boble(hoej, `${tal(oppe.tryk, 0)} hPa`, { faktor, ring: true, under: `Fylder ${tal(oppe.volumen, 2)} gange så meget` }),
    () => boble('Ved jorden', `${tal(PAKKE)} °C`) + pil(`${tal(oppe.temperatur - PAKKE)} °C`) + boble(`${hoej} · tør pakke`, `${tal(oppe.temperatur)} °C`, { faktor, ring: true, pile: true, under: oppe.maettet ? 'Nu også mættet: fortætning bremser afkølingen' : 'Skubber omgivelserne væk', maettet: oppe.maettet }),
    () => boble(`${hoej} · fugtig, uden fortætning`, `${tal(uden_kondensation(z))} °C`, { faktor: Math.cbrt(udenVolumen) }) + pil(`+${tal(latentVarme('fugtig', z))} °C`, 'opbygget forskel') + boble(`${hoej} · fugtig, som på stigen`, `${tal(fugtig.temperatur)} °C`, { faktor: Math.cbrt(fugtig.volumen), maettet: fugtig.maettet })
  ];
  const kontekst = z === 0 ? 'Du er ved jorden. Vend tilbage til stigen og løft pakkerne for at se ændringen.'
    : trin === 2 ? varme > .01
      ? `Forskellen på ${tal(varme)} °C er opbygget fra 400 m til ${hoej}. Den fugtige pakke er stadig kølet fra 22,0 til ${tal(fugtig.temperatur)} °C.`
      : 'Ved denne højde er temperaturerne ens. Ved videre løft over 400 m begynder fortætningen at bremse afkølingen.'
    : `Samme forsøg som på stigen: fra jorden til ${hoej}. Den stiplede ring viser startstørrelsen.`;
  return `<div class="h-forklaring"><div class="h-scene">${scener[trin]()}</div><p class="h-kontekst">${kontekst}</p></div>`;
}
