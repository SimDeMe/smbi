/* ═══════════════════════════════════════════════════════════
   opgaver.js — opgaverne i at indstille og bruge kompasset.

   Hver opgave har:
     tekst    opgaveteksten (HTML)
     start    hvordan kompasset står, når opgaven åbnes
              (H = kompashuset, B = kursepilens retning)
     svar     'kompas' — svaret er, hvordan kompasset står
              'tal'    — eleven skriver en kurs i grader
              'valg'   — eleven vælger et landemærke
     tjek     (t, svar) → {ok, besked}

   Kurserne til landemærkerne står i landskab.js.
   ═══════════════════════════════════════════════════════════ */
import {LANDEMAERKER, forskel} from './landskab.js';
import {afvigelse, TOL_I_HUS} from './kompas.js';

const M = Object.fromEntries(LANDEMAERKER.map(m => [m.id, m]));
const g = v => Math.round(((v % 360) + 360) % 360) + '°';

/* Står huset på kursen, og ligger nålen i hus? */
function gaaIKurs(t, maal){
  const hus = forskel(t.H, maal);
  if (Math.abs(hus) > 1)
    return {ok:false, besked:`Gradskiven viser ${g(t.H)}. Drej først kompashuset, til ${maal} står ud for indekset.`};
  return naalIHus(t);
}

function naalIHus(t){
  const dev = afvigelse(t);
  if (Math.abs(dev) <= TOL_I_HUS) return {ok:true};
  if (Math.abs(dev) >= 180 - TOL_I_HUS)
    return {ok:false, besked:'Det er den <b>hvide</b> ende af nålen, der ligger i orienteringspilen. Rød i hus! Drej dig en halv omgang.'};
  return {ok:false, besked:`Nålen ligger ${Math.round(Math.abs(dev))}° ved siden af orienteringspilen. Drej dig ${Math.abs(dev) > 20 ? '' : 'lidt '}til ${dev > 0 ? 'venstre' : 'højre'} — ikke huset.`};
}

export const OPGAVER = [
  {
    tekst:'Indstil kompasset til kurs <b>60°</b>: Drej kompashuset, til 60 står ud for indekset ved kursepilen.',
    start:{H:0, B:0}, svar:'kompas',
    tjek(t){
      if (Math.abs(forskel(t.H, 60)) <= 1)
        return {ok:true, besked:'Rigtigt — gradskiven viser 60°. Men du går ikke i den retning endnu: kursepilen peger stadig mod nord. Det retter du i næste opgave.'};
      return {ok:false, besked:`Gradskiven viser ${g(t.H)}. Drej ringen — ikke hele kompasset — til 60 står ved indekset.`};
    }
  },
  {
    tekst:'Kompasset står på 60°. Drej nu <b>dig selv</b> — hele kompasset — til den røde ende af nålen ligger inde i orienteringspilen. Så går du i kurs 60°.',
    start:{H:60, B:330}, svar:'kompas',
    tjek(t){
      if (Math.abs(forskel(t.H, 60)) > 1)
        return {ok:false, besked:`Kompashuset står ikke længere på 60° (det viser ${g(t.H)}). Sæt det tilbage, og drej hele kompasset i stedet.`};
      const r = naalIHus(t);
      if (r.ok) r.besked = 'Nålen er i hus. Kursepilen peger nu i kurs 60° — mod nordøst.';
      return r;
    }
  },
  {
    tekst:'Gå i kurs <b>150°</b>. Indstil kompashuset, drej dig, til nålen ligger i orienteringspilen, og se hvad kursepilen sigter på.',
    start:{H:0, B:0}, svar:'kompas',
    tjek(t){
      const r = gaaIKurs(t, 150);
      if (r.ok) r.besked = `Rigtigt — kurs 150° fører dig ned til ${M.bro.navn.toLowerCase()}.`;
      return r;
    }
  },
  {
    tekst:'Du skal gå mod <b>sydvest</b>. Hvilken kurs er det? Indstil kompasset, og drej dig i den retning.',
    start:{H:0, B:90}, svar:'kompas',
    tjek(t){
      if ([45, 135, 315].some(v => Math.abs(forskel(t.H, v)) <= 1))
        return {ok:false, besked:`${g(t.H)} er ikke sydvest. Sydvest ligger midt mellem syd (180°) og vest (270°).`};
      const r = gaaIKurs(t, 225);
      if (!r.ok && Math.abs(forskel(t.H, 225)) > 1)
        r.besked = `Gradskiven viser ${g(t.H)}. Sydvest ligger midt mellem syd (180°) og vest (270°).`;
      if (r.ok) r.besked = `Sydvest er 225°. Du går mod ${M.moelle.navn.toLowerCase()}.`;
      return r;
    }
  },
  {
    tekst:'Indstil kompasset til <b>300°</b>, og gå efter nålen. Hvad kommer du til?',
    start:{H:0, B:120}, svar:'valg', valg:['kirke', 'moelle', 'hytte', 'mast'],
    tjek(t, svar){
      if (svar === 'hytte') return {ok:true, besked:'Rigtigt — i kurs 300° ligger skovhytten.'};
      if (!svar) return {ok:false, besked:'Vælg et af landemærkerne.'};
      return {ok:false, besked:`Nej, ${M[svar].navn.toLowerCase()} ligger ikke i kurs 300°. Står huset på 300, og ligger nålen i orienteringspilen? Følg så kursepilen.`};
    }
  },
  {
    tekst:'Tag en kurs mod <b>kirken</b>: Sigt med kursepilen mod kirken. Drej så kompashuset, til nålen ligger i orienteringspilen, og aflæs kursen ved indekset.',
    start:{H:0, B:200}, svar:'tal',
    tjek(t, svar){ return tagKurs(t, svar, M.kirke); }
  },
  {
    tekst:'Tag en kurs mod <b>fyrtårnet</b> på samme måde. Hvilken kurs skal du gå?',
    start:{H:200, B:260}, svar:'tal',
    tjek(t, svar){ return tagKurs(t, svar, M.fyr); }
  },
  {
    tekst:`Du går ud til fyrtårnet i kurs ${M.fyr.kurs}° og skal samme vej hjem igen. Indstil kompasset til <b>tilbagekursen</b>.`,
    start:{H:M.fyr.kurs, B:M.fyr.kurs}, svar:'kompas',
    tjek(t){
      const maal = (M.fyr.kurs + 180) % 360;
      if (Math.abs(forskel(t.H, maal)) <= 1)
        return {ok:true, besked:`${M.fyr.kurs}° + 180° = ${maal}°. Tilbagekursen ligger altid 180° fra udkursen — under 180° lægger man til, over 180° trækker man fra.`};
      if (Math.abs(forskel(t.H, M.fyr.kurs)) <= 1)
        return {ok:false, besked:'Det er udkursen. Hjem går du den stik modsatte vej.'};
      return {ok:false, besked:`Gradskiven viser ${g(t.H)}. Den modsatte vej ligger en halv omgang — 180° — fra udkursen.`};
    }
  },
  {
    tekst:'En elev har sat kompasset til 40°, men har drejet sig, så den <b>hvide</b> ende af nålen ligger i orienteringspilen — sådan som kompasset står nu. I hvilken kurs går eleven i virkeligheden?',
    start:{H:40, B:220}, svar:'tal',
    tjek(t, svar){
      if (svar === null) return {ok:false, besked:'Skriv en kurs i grader.'};
      if (Math.abs(forskel(svar, 220)) <= 3)
        return {ok:true, besked:'220° — præcis den modsatte vej af de 40°. Derfor huskereglen: rød i hus.'};
      if (Math.abs(forskel(svar, 40)) <= 3)
        return {ok:false, besked:'Det er det, gradskiven viser — men se, hvor kursepilen peger. Er det nordøst?'};
      return {ok:false, besked:'Nej. Hvor meget er kompasset drejet forkert, når den hvide ende ligger, hvor den røde skulle?'};
    }
  },
];

function tagKurs(t, svar, m){
  if (svar === null) return {ok:false, besked:'Skriv den kurs, du aflæser, i grader.'};
  if (Math.abs(forskel(svar, m.kurs)) <= 3)
    return {ok:true, besked:`Rigtigt — kursen til ${m.navn.toLowerCase()} er ${m.kurs}°.`};
  const sigter = Math.abs(forskel(t.B, m.kurs)) <= 4;
  const iHus = Math.abs(afvigelse(t)) <= TOL_I_HUS;
  if (!sigter) return {ok:false, besked:`Ikke helt. Peger kursepilen mod ${m.navn.toLowerCase()}? Sigt først, og drej så kun huset.`};
  if (!iHus) return {ok:false, besked:'Kursepilen sigter rigtigt, men nålen ligger ikke i orienteringspilen endnu. Drej kompashuset — ikke dig selv.'};
  return {ok:false, besked:`Kompasset står rigtigt, men ${g(svar)} er ikke det, der står ved indekset. Aflæs igen.`};
}
