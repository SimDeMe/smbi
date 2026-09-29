/* ─────────────────────────────────────────────────────────
   Samlingen: de fire hovedgrupper og alle poster i én liste.

   En ny gruppe er én ny datafil plus én linje i `grupper`.
   En ny sten er én ny post i gruppens datafil — intet her.
   ───────────────────────────────────────────────────────── */

import mineraler   from './mineraler.js';
import magmatiske  from './magmatiske.js';
import sedimentaere from './sedimentaere.js';
import metamorfe   from './metamorfe.js';

export const grupper = [
  {id:'mineral',     prefiks:'MI', navn:'Mineraler',             kortnavn:'Mineraler',   ental:'Mineral',
   flade:'#E2D6F8', poster:mineraler,
   om:'Byggestenene: ét stof med fast kemisk sammensætning og krystalstruktur.'},
  {id:'magmatisk',   prefiks:'MA', navn:'Magmatiske bjergarter', kortnavn:'Magmatiske',  ental:'Magmatisk bjergart',
   flade:'#FFD9C9', poster:magmatiske,
   om:'Størknet magma — grovkornede i dybet, finkornede eller glasagtige på overfladen.'},
  {id:'sedimentaer', prefiks:'SE', navn:'Sedimentære bjergarter', kortnavn:'Sedimentære', ental:'Sedimentær bjergart',
   flade:'#D6EFC4', poster:sedimentaere,
   om:'Aflejret af vand, vind, is eller levende væsner og siden presset og kittet sammen.'},
  {id:'metamorf',    prefiks:'ME', navn:'Metamorfe bjergarter',   kortnavn:'Metamorfe',   ental:'Metamorf bjergart',
   flade:'#C7E6F6', poster:metamorfe,
   om:'Omdannet i fast form af tryk og varme — ofte med mineraler på rad.'}
];

export const gruppe = Object.fromEntries(grupper.map(g => [g.id, g]));

export const alle = grupper.flatMap(g => g.poster.map(p => ({...p, gruppe:g.id})));

export const efterId = Object.fromEntries(alle.map(p => [p.id, p]));

/* Et mineral er med i disse bjergarter — regnes ud, så det
   aldrig skal skrives to steder. */
export function bjergarterMed(mineralId){
  return alle.filter(p => p.gruppe !== 'mineral' && (p.mineraler || []).some(m => m.id === mineralId));
}

/* Koder skrives på mange måder på et mærkat: «MA-01», «ma01»,
   «MA 1». De sammenlignes derfor uden bindestreg og foranstillede nuller. */
export function normKode(s){
  const m = String(s).trim().toUpperCase().match(/^([A-ZÆØÅ]{2})[\s\-]*0*(\d+)$/);
  return m ? m[1] + '-' + m[2].padStart(2, '0') : null;
}
const normNr = s => String(s).trim().toLowerCase().replace(/^(nr\.?|#)\s*/, '');

/* Slå en sten op på kode eller på nummeret skrevet på stenen. */
export function findKodeEllerNr(s){
  const k = normKode(s);
  if(k){ const p = alle.find(x => x.kode === k); if(p) return p; }
  const n = normNr(s);
  if(!n) return null;
  return alle.find(x => (x.nr || []).some(v => normNr(v) === n)) || null;
}

/* Fritekstsøgning: navn, andre navne, type og mineraler. */
export function soeg(tekst){
  const q = tekst.trim().toLowerCase();
  if(!q) return null;
  const hit = findKodeEllerNr(q);
  return alle.filter(p => p === hit || [
    p.navn, p.kode, p.type, ...(p.andreNavne || []), ...(p.nr || []).map(String),
    ...(p.mineraler || []).map(m => m.id ? (efterId[m.id]?.navn || m.id) : m.navn)
  ].some(t => t && String(t).toLowerCase().includes(q)));
}

/* Tjek ved indlæsning, så en tastefejl i en ny post ses i konsollen
   i stedet for at give et forkert link. */
(function tjek(){
  const set = new Set(), koder = new Set(), numre = new Map();
  for(const p of alle){
    const g = gruppe[p.gruppe];
    if(set.has(p.id))      console.warn('Stensamling: id bruges to gange:', p.id);
    if(koder.has(p.kode))  console.warn('Stensamling: kode bruges to gange:', p.kode);
    if(normKode(p.kode) !== p.kode || !p.kode.startsWith(g.prefiks + '-'))
      console.warn('Stensamling: koden passer ikke til gruppen', g.prefiks, '→', p.kode);
    for(const n of p.nr || []){
      const k = normNr(n);
      if(numre.has(k)) console.warn('Stensamling: nummer', n, 'står både på', numre.get(k), 'og', p.kode);
      numre.set(k, p.kode);
    }
    for(const m of p.mineraler || [])
      if(m.id && !efterId[m.id]) console.warn('Stensamling:', p.id, 'peger på et mineral, der ikke findes:', m.id);
    set.add(p.id); koder.add(p.kode);
  }
})();
