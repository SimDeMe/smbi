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
/* Numrene på stenene stammer fra to gamle nummereringer, der ikke
   har noget med hinanden at gøre. I data skrives systemet foran:
   'klassesæt-13', 'gymnasiesamling-2'. Den samme værdi kan derfor
   godt stå på to sten — 9 er stensalt i klassesættet, men
   kalifeldspat i gymnasiesamlingen. */
export const nummersystemer = [
  {id:'klassesæt',       navn:'Klassesæt',       alias:['klassesæt','klassesaet','klassesat','ks']},
  {id:'gymnasiesamling', navn:'Gymnasiesamling', alias:['gymnasiesamling','samling','gs']}
];

/* «Klassesæt nr. 13», «ks13», «samling-2» og bare «13» → {system, tal}.
   Uden system er `system` null og passer på alle systemer. */
export function delNr(s){
  const t = String(s).trim().toLowerCase().replace(/(^|\s)(nr\.?|#)\s*/g, ' ').trim();
  const m = t.match(/^([a-zæøå]*)[\s\-.]*0*(\d+[a-z]?)$/);
  if(!m) return null;
  if(!m[1]) return {system:null, tal:m[2]};
  const sys = nummersystemer.find(x => x.alias.includes(m[1]));
  return sys ? {system:sys.id, tal:m[2]} : null;
}

export function visNr(v){
  const d = delNr(v);
  if(!d) return String(v);
  const sys = nummersystemer.find(x => x.id === d.system);
  return sys ? `${sys.navn} ${d.tal}` : d.tal;
}

/* Alle sten, som nummeret kan pege på. */
export function findNr(s){
  const q = delNr(s);
  if(!q) return [];
  return alle.filter(p => (p.nr || []).some(v => {
    const d = delNr(v);
    return d && d.tal === q.tal && (!q.system || !d.system || q.system === d.system);
  }));
}

/* Slå en sten op på kode eller nummer. Peger nummeret på flere
   sten, er svaret null — så viser søgningen dem i listen. */
export function findKodeEllerNr(s){
  const k = normKode(s);
  if(k){ const p = alle.find(x => x.kode === k); if(p) return p; }
  const hits = findNr(s);
  return hits.length === 1 ? hits[0] : null;
}

/* Fritekstsøgning: navn, andre navne, type, mineraler og numre. */
export function soeg(tekst){
  const q = tekst.trim().toLowerCase();
  if(!q) return null;
  const kode = findKodeEllerNr(q), numre = findNr(q);
  /* et bart tal er et nummer fra en sten — ikke «09» i MA-09 */
  if(/^\d+$/.test(q)) return numre;
  return alle.filter(p => p === kode || numre.includes(p) || [
    p.navn, p.kode, p.type, ...(p.andreNavne || []),
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
      const d = delNr(n);
      if(!d){ console.warn('Stensamling: nummeret kan ikke læses:', n, 'på', p.kode); continue; }
      const k = d.system + '-' + d.tal;
      if(numre.has(k)) console.warn('Stensamling: nummer', n, 'står både på', numre.get(k), 'og', p.kode);
      numre.set(k, p.kode);
    }
    for(const m of p.mineraler || [])
      if(m.id && !efterId[m.id]) console.warn('Stensamling:', p.id, 'peger på et mineral, der ikke findes:', m.id);
    set.add(p.id); koder.add(p.kode);
  }
})();
