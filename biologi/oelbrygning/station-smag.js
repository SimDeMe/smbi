/* ═══════════════════════════════════════════════════════════
   station-smag.js — 6 · Smagning.

   Øllet er færdigt. Her er intet ur — kun resultatet: glasset,
   to hydrometre (før og efter gæringen), en smagsprofil og de
   få sætninger, der binder smagen sammen med de valg, man
   traf undervejs. Tabellen under figuren samler alle bryg, så
   de kan sammenlignes.
   ═══════════════════════════════════════════════════════════ */
import * as B from './brygning.js';
import {INK, SLATE, FARVE, GRAF, blaek, boks, maerkat, tekst, komma, ebcFarve} from './model.js';
import {tegnGlas, tegnHydrometer} from './udstyr.js';
import {opskrift} from './opskrifter.js';

/* ── Smagsprofilen ─────────────────────────────────────── */
const lim = v => Math.max(0, Math.min(1, v));

function maltStyrke(r){
  const m = r.maltsmag;
  return m.karamel * 0.6 + m.ristet * 2 + m.malt * 0.3;
}
function bismag(r){ return lim(Math.max(0, r.fusel - 0.6) / 4 + Math.max(0, r.snerp - 1) / 5); }

function profil(r){
  return [
    {navn:'Alkohol',    andel:lim(r.abv / 9),                          farve:FARVE.stivelse},
    {navn:'Sødme',      andel:lim((r.fg - 1.003) / 0.022 + r.restsukker / 40), farve:FARVE.sukker},
    {navn:'Fylde',      andel:lim(r.fylde / 55),                        farve:FARVE.dextrin},
    {navn:'Bitterhed',  andel:lim(r.ibu / 80),                          farve:'#8BA81E'},
    {navn:'Humlearoma', andel:lim(r.aroma / 16),                        farve:FARVE.alfa},
    {navn:'Maltsmag', andel:lim(maltStyrke(r)),                    farve:'#8E4A1C'},
    {navn:'Gærpræg',    andel:lim((r.ester + r.fenol) / 3.2),           farve:'#D9A400'},
    {navn:'Bismag',     andel:bismag(r),                                farve:FARVE.varme},
  ];
}

/** Én linje, der siger, hvad det blev til. */
function overskrift(b){
  const r = b.oel;
  if(r.abv < 1) return 'Sød urt — næsten ingen alkohol';
  if(r.fusel > 2.5) return 'Frugtig og brændende — gæret for varmt';
  if(r.snerp > 2.5) return 'Snerpende og tør — skyllet for varmt';
  if(r.maltsmag.ristet > 0.2) return r.bugu > 0.6 ? 'Sort, ristet og bitter — som en stout' : 'Sort og ristet — som en stout';
  if(r.gaer === 'hvede') return 'Uklar, med banan og nellike — som en hvedeøl';
  if(r.gaer === 'saison') return 'Tør og krydret — som en saison';
  if(r.gaer === 'lager' && r.fusel < 1) return r.bugu > 0.5 ? 'Ren, frisk og bitter — som en pilsner' : 'Ren og frisk — som en lagerøl';
  if(r.bugu > 0.85) return 'Tør og meget bitter — som en IPA';
  if(r.bugu > 0.6) return 'Frisk og bitter — som en pale ale';
  if(r.fg > 1.018) return 'Sød og fyldig — maltet, med meget restsødme';
  if(r.bugu < 0.3) return 'Blød og maltet — næsten uden bitterhed';
  return 'Balanceret og let — som en blond ale';
}

/** Årsag og virkning: højst tre, i brygningens rækkefølge. Fejl går forud. */
function noter(b){
  const ud = [], r = b.oel, m = b.maesk, sk = b.skyl, gae = b.gaering;
  const y = B.gaertype(gae.type);
  /* mæskning */
  const hoved = m.temperaturer.filter(T => T < 76);
  const mT = hoved.length ? hoved[hoved.length - 1] : m.temperaturer[0];
  if(m.stivelseRest > 0.2)
    ud.push(`Mæsken nåede ikke at omsætte stivelsen (${komma(m.stivelseRest * 100)} % tilbage) — mindre sukker og en uklar øl.`);
  else if(m.program === 'trin')
    ud.push('Trinmæskning: β-amylasen fik en rast ved 63 °C til maltosen, og α-amylasen en ved 72 °C til resten.');
  else if(mT >= 69)
    ud.push(`Mæsket ved ${mT} °C: β-amylasen blev hurtigt denatureret, så mere blev til dextriner — øllet bliver sødere og fyldigere.`);
  else if(mT <= 66 && mT >= 61)
    ud.push(`Mæsket ved ${mT} °C: β-amylasen nåede at klippe meget maltose af — urten var let at gære.`);
  /* skylning */
  if(r.snerp > 1.5)
    ud.push(sk.Tmaks > 80 ? `Skyllevandet ved ${sk.skylT} °C trak garvestoffer ud af avnerne — øllet snerper.`
                          : 'Der blev skyllet, til afløbet var næsten rent vand — det trak garvestoffer ud af avnerne.');
  else if(sk.udbytte < 0.85)
    ud.push(`Kun ${komma(sk.udbytte * 100)} % af sukkeret blev skyllet ud af kornene${sk.skylT < 72 ? ' — skyllevandet var for koldt' : ''}.`);
  /* humle */
  const tidlig = b.kog.humle.filter(h => b.kog.tid - h.tid >= 30).reduce((s, h) => s + h.g, 0);
  const sen = b.kog.humle.filter(h => b.kog.tid - h.tid < 15);
  const senG = sen.reduce((s, h) => s + h.g, 0);
  const duft = [...new Set(sen.map(h => B.humlesort(h.sort)).filter(h => h.duft > 0.5).map(h => h.aroma))];
  if(!b.kog.humle.length) ud.push('Ingen humle: øllet har ingen bitterhed til at holde sødmen i skak.');
  else if(tidlig && senG) ud.push(`${tidlig} g tidlig humle gav bitterhed (${komma(r.ibu)} IBU); ${senG} g sen humle gav aroma${duft.length ? ' af ' + duft.join(' og ') : ''}.`);
  else if(tidlig) ud.push(`Humlen kogte længe: α-syrerne blev til bitterstof (${komma(r.ibu)} IBU), men aromaen dampede af.`);
  else if(senG) ud.push(`Humlen kom i sent: masser af aroma${duft.length ? ' (' + duft.join(', ') + ')' : ''}, men kun lidt bitterstof.`);
  /* gæring */
  const Tmaks = Math.max(...gae.temperaturer);
  if(gae.fase === 'død') ud.push('Gæren døde af varmen, før den var færdig — sukkeret er stadig i øllet.');
  else if(r.restsukker > 5) ud.push(`Gæringen nåede ikke at blive færdig — der er ${komma(r.restsukker)} g/L sukker tilbage.`);
  else if(r.fusel > 1.5) ud.push(`${y.navn} arbejder bedst ved ${y.Tmin}–${y.Tmax} °C; ved ${Tmaks} °C lavede den fuselalkoholer.`);
  else if(y.fenol > 0 || y.ester > 1.2) ud.push(`${y.navn} giver selv smagen: ${y.smag}.`);
  else if(y.maltotriose < 0.5) ud.push(`${y.navn} kan kun bruge lidt af maltotriosen — øllet bliver lidt sødere.`);
  else if(Tmaks <= y.Tmin + 3) ud.push('Kølig gæring: langsommere, men rent i smagen.');
  return ud.slice(0, 3);
}

function ombryd(g, t, maks, størrelse){
  g.font = `400 ${størrelse}px 'Source Serif 4',Georgia,serif`;
  const ord = t.split(' '), linjer = [];
  let linje = '';
  for(const o of ord){
    const prøve = linje ? linje + ' ' + o : o;
    if(g.measureText(prøve).width > maks && linje){ linjer.push(linje); linje = o; }
    else linje = prøve;
  }
  if(linje) linjer.push(linje);
  return linjer;
}

/* ── Stationen ─────────────────────────────────────────── */
export default {
  id:'smag', nr:6, navn:'Smagning',
  tid:null,
  knapper:[],

  ligninger:[
    {id:'alk', titel:'Alkohol ud fra hydrometeret', tone:'#F1ECFC',
     html:b => `(OG − FG) · 131,25 = (${komma(b.oel.og, 3)} − ${komma(b.oel.fg, 3)}) · 131,25<span class="pil">≈</span>${komma(B.alkoholAfSG(b.oel.og, b.oel.fg), 1)} % vol`},
    {id:'forg', titel:'Tilsyneladende forgæring', tone:'#FFF1D6',
     html:b => `(OG − FG) / (OG − 1)<span class="pil">=</span>${komma(b.oel.forgaering * 100)} %`},
  ],

  maalere:[
    {id:'alk', navn:'Alkohol', klasse:'g-lilla', cc:'linear-gradient(90deg,#C6AEF0,#7A4FD6)'},
    {id:'sg', navn:'Vægtfylde · OG → FG', klasse:'g-gul', cc:'linear-gradient(90deg,#FFE3A0,#D98A00)'},
    {id:'ibu', navn:'Bitterhed', klasse:'g-groen', cc:'linear-gradient(90deg,#D6EFC4,#5FB030)'},
    {id:'ebc', navn:'Farve', klasse:'g-blaa', cc:'linear-gradient(90deg,#F8DE78,#B45E16)'},
  ],

  signatur:'',

  start(batch){ return {b:batch}; },

  tegn(g, st, rt){
    const b = st.b, r = b.oel;
    tegnGlas(g, 170, 150, {farve:ebcFarve(r.ebc), skum:r.ebc > 50 ? 0.95 : 0.8, rt, uklar:r.uklar});
    maerkat(g, 'Færdigt øl', 170, 124, {størrelse:10.5});

    const våd = ebcFarve(b.urtKogt.ebc, 0.25);
    tegnHydrometer(g, 380, 150, r.og, {vaeske:våd, titel:'Før gæring · OG'});
    tegnHydrometer(g, 500, 150, r.fg, {vaeske:ebcFarve(r.ebc, 0.25), titel:'Efter · FG'});
    maerkat(g, 'Hydrometeret flyder højere i tung urt', 440, 410, {størrelse:9, farve:SLATE, stort:false});

    /* smagsprofil i grafens plads */
    const {x, y, b:bb, h} = GRAF;
    boks(g, x, y, bb, h, 12); blaek(g, '#fff', 2);
    maerkat(g, 'Smagsprofil', x + 14, y + 17, {justering:'left', størrelse:10.5, farve:SLATE});
    tekst(g, overskrift(b), x + 16, y + 46, {størrelse:15, justering:'left'});
    profil(r).forEach((p, i) => {
      const yy = y + 66 + i * 22, lx = x + 16, bx = x + 128, bw = bb - 146;
      maerkat(g, p.navn, lx, yy + 8, {justering:'left', størrelse:9.5, spær:0.8});
      boks(g, bx, yy + 1, bw, 14, 7); blaek(g, '#F4F6F5', 1.5);
      if(p.andel > 0.01){ boks(g, bx, yy + 1, Math.max(14, bw * p.andel), 14, 7); blaek(g, p.farve, 1.5); }
    });
    let ly = y + 262;
    for(const n of noter(b)){
      const linjer = ombryd(g, n, bb - 44, 12.5);
      g.beginPath(); g.arc(x + 20, ly - 4, 3, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
      for(const l of linjer){
        g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        g.fillText(l, x + 30, ly);
        ly += 16;
      }
      ly += 6;
    }
  },

  aflaes(st){
    const r = st.b.oel;
    return {
      alk:{tal:komma(r.abv, 1), enhed:'% vol', andel:r.abv / 10},
      sg:{tal:komma(r.og, 3) + ' → ' + komma(r.fg, 3), enhed:'', andel:(r.og - r.fg) / (r.og - 1)},
      ibu:{tal:komma(r.ibu), enhed:'IBU', andel:r.ibu / 100},
      ebc:{tal:komma(r.ebc), enhed:'EBC', andel:r.ebc / 40},
    };
  },

  aktiv(){ return {alk:true, forg:true}; },

  status(st){ return 'Smagning · ' + overskrift(st.b).split(' — ')[0].toLowerCase(); },

  fortael(st){
    const r = st.b.oel;
    return `Færdigt øl: ${overskrift(st.b)}. ${komma(r.abv, 1)} procent alkohol, vægtfylde fra ${komma(r.og, 3)} til ${komma(r.fg, 3)}, ` +
           `${komma(r.ibu)} IBU. ${noter(st.b).join(' ')}`;
  },
};
