/* ─────────────────────────────────────────────────────────
   Bestemmelsesnøglen: spørgsmål man kan svare på med lup,
   syre, glasplade og kniv. Hver post har sine svar i `kend`.

   Nøglen er en «flersporet» nøgle: man svarer på de spørgsmål,
   man kan, i den rækkefølge man vil, og listen snævres ind.
   En post, der mangler et svar, bliver ikke sorteret fra —
   hellere en sten for meget end at miste den rigtige.
   ───────────────────────────────────────────────────────── */

export const spoergsmaal = [
  {id:'korn', navn:'Korn', hjaelp:'Kig med lup',
   svar:[
     ['store',  'Store korn — kan ses uden lup'],
     ['fine',   'Små korn — kun med lup'],
     ['ingen',  'Ingen korn — glas eller helt tæt'],
     ['krystal','Ét mineral — krystal eller spaltestykke']
   ]},
  {id:'syre', navn:'Syretest', hjaelp:'En dråbe fortyndet saltsyre',
   svar:[
     ['ja',  'Bruser'],
     ['nej', 'Bruser ikke']
   ]},
  {id:'haard', navn:'Hårdhed', hjaelp:'Glasplade, kniv og negl',
   svar:[
     ['glas', 'Ridser glas'],
     ['kniv', 'Ridses af kniv, ikke af negl'],
     ['negl', 'Ridses af negl']
   ]},
  {id:'opbygning', navn:'Opbygning', hjaelp:'Se på hele stenen',
   svar:[
     ['massiv',   'Ens hele vejen igennem'],
     ['lagdelt',  'Lag'],
     ['skifret',  'Bånd, striber eller flager på rad'],
     ['porfyr',   'Store krystaller i fin grundmasse'],
     ['klaster',  'Sten eller korn kittet sammen'],
     ['huller',   'Huller eller blærer'],
     ['fossiler', 'Fossiler eller aftryk']
   ]},
  {id:'farve', navn:'Farve', hjaelp:'Brug en frisk brudflade',
   svar:[
     ['lys',      'Lys'],
     ['moerk',    'Mørk'],
     ['spaettet', 'Spættet'],
     ['roed',     'Rød'],
     ['groen',    'Grøn'],
     ['metal',    'Metalglans']
   ]}
];

/* Syretesten står som sand/falsk i data. */
function vaerdier(post, id){
  const v = post.kend?.[id];
  if(v === undefined) return null;
  if(typeof v === 'boolean') return [v ? 'ja' : 'nej'];
  return Array.isArray(v) ? v : [v];
}

/* valg: {korn:'store', syre:'nej', …} — tomme svar tæller ikke. */
export function passer(post, valg, undtagen){
  for(const [id, svar] of Object.entries(valg)){
    if(!svar || id === undtagen) continue;
    const v = vaerdier(post, id);
    if(v && !v.includes(svar)) return false;
  }
  return true;
}

/* Hvor mange af posterne der ville være tilbage med hvert svar —
   så man kan se, hvor et svar fører hen, før man vælger det. */
export function antalPrSvar(poster, valg){
  const ud = {};
  for(const s of spoergsmaal){
    const rest = poster.filter(p => passer(p, valg, s.id));
    ud[s.id] = Object.fromEntries(s.svar.map(([v]) =>
      [v, rest.filter(p => { const x = vaerdier(p, s.id); return !x || x.includes(v); }).length]));
  }
  return ud;
}
