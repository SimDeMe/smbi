// Én undersøgelse: samme løft, to vandindhold. Data åbnes særskilt.
import { TOP, tilstand, skybase, pakketemperatur } from './model.mjs';
export const STIGETRIN = 100;
const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits:n, maximumFractionDigits:n }).replace('-', '−');
const fortegn = v => `${v > 0 ? '+' : ''}${tal(v)}`;
const PAKKER = [['toer', 'Mindre vanddamp', 29], ['fugtig', 'Mere vanddamp', 73]];
const procent = z => `${z / TOP * 100}%`;
function skelet() {
  return `<div class="stige"><span class="stige-enhed">Højde · m</span><div class="stige-akse">${[0,1000,2000,3000].map(h => `<span style="bottom:${procent(h)}">${tal(h,0)}</span>`).join('')}</div><div class="stige-spor">${PAKKER.map(([luft,navn,x]) => `
    <div class="stige-sky" data-sky="${luft}" style="left:${x}%"></div>
    <div class="stige-base" data-base="${luft}" style="bottom:${procent(skybase(luft))}"><span>Skybase ${tal(skybase(luft),0)} m</span></div>
    <div class="stige-pakke" data-pakke="${luft}" style="left:${x}%"><small>${navn}</small><b></b><span data-status></span></div>
    <div class="stige-fald" data-fald="${luft}" style="left:${x}%"></div>`).join('')}</div><div class="stige-jord"></div></div>`;
}
export function tegnStige(el, z, retning) {
  if (!el.querySelector('.stige')) el.innerHTML = skelet();
  for (const [luft] of PAKKER) {
    const s = tilstand('stabil',luft,z), base = skybase(luft), pakke = el.querySelector(`[data-pakke="${luft}"]`);
    pakke.style.bottom = procent(z);
    pakke.style.setProperty('--stoerrelse', `${94*Math.cbrt(s.volumen)}px`);
    pakke.classList.toggle('maettet',s.maettet);
    pakke.querySelector('b').textContent = `${tal(s.temperatur)} °C`;
    pakke.querySelector('[data-status]').textContent = s.maettet ? 'Mættet · sky' : 'Umættet';
    const fra = z-retning*STIGETRIN, fald = el.querySelector(`[data-fald="${luft}"]`);
    fald.style.bottom = procent(z); fald.classList.toggle('maettet',s.maettet);
    fald.textContent = fra < 0 || fra > TOP ? '' : `${fortegn(s.temperatur-pakketemperatur(luft,fra))} °C`;
    const sky = el.querySelector(`[data-sky="${luft}"]`);
    sky.style.bottom=procent(base);sky.style.height=procent(Math.max(0,z-base));sky.hidden=z<=base;
    el.querySelector(`[data-base="${luft}"]`).hidden=z<base;
  }
}
export function tegnMaalinger(el,z,retning) {
  const hoejder=Array.from({length:3},(_,i)=>z-retning*i*STIGETRIN).filter(h=>h>=0&&h<=TOP).sort((a,b)=>b-a);
  el.innerHTML=`<table><caption>De seneste trin · temperatur og ændring</caption><thead><tr><th>Højde</th><th>Mindre vanddamp</th><th>Mere vanddamp</th></tr></thead><tbody>${hoejder.map(h=>`<tr class="${h===z?'nu':''}"><th scope="row">${tal(h,0)} m</th>${PAKKER.map(([l])=>{const fra=h-retning*STIGETRIN,s=tilstand('stabil',l,h);return `<td>${tal(s.temperatur)} °C <small>${fra<0||fra>TOP?'start':fortegn(s.temperatur-pakketemperatur(l,fra))+' °C'} · RF ${tal(s.fugtighed,0)} %</small></td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
}
export function stigeForklaring(z,retning) {
  const lav=Math.round(skybase('fugtig')),hoej=Math.round(skybase('toer'));
  if(z===0)return ['Hvad sker der, når du løfter luft?', 'Følg to luftpakker på 22 °C. Den ene indeholder mere vanddamp. Løft dem 100 m ad gangen.'];
  if(retning<0)return ['Sammentrykning varmer luften', 'På vej ned presses pakkerne sammen. Omgivelserne udfører arbejde på luften, så dens temperatur stiger.'];
  if(z<lav)return ['Udvidelsen koster energi', 'Trykket falder, og luften udvider sig. Pakkerne bruger indre energi på at skubbe omgivelserne væk og bliver koldere.'];
  if(z===lav)return ['Nu begynder fortætningen', 'Pakken med mere vanddamp er mættet. Ved næste løft frigiver fortætning varme: forudsig, hvilken pakke der køler mest.'];
  if(z<hoej)return ['Fortætning bremser afkølingen', 'Den mættede pakke får varme fra fortætning. Begge udvider sig stadig, men den mættede køler kun 0,5 °C pr. 100 m mod 1,0 °C.'];
  return ['Nu er begge pakker mættede', 'I begge frigiver fortætning varme. Temperaturen falder stadig under opstigningen, her med 0,5 °C pr. 100 m.'];
}
export function stigeBeskrivelse(z) {
  return PAKKER.map(([l,navn])=>{const s=tilstand('stabil',l,z);return `${navn}: ${tal(s.temperatur)} °C, ${s.maettet?'mættet':'umættet'}, relativ luftfugtighed ${tal(s.fugtighed,0)} %`;}).join('. ');
}
