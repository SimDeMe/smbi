/* ═══════════════════════════════════════════════════════════
   trin.js — opgaverne til fotosyntesen.

   To faser. Først selve fotosyntesen: molekylerne, råstofferne,
   reaktionsskemaet, afstemningen og lyset. Når de fem trin er
   klaret, låses fasen om respirationen og regnskabet BPP, R og NPP
   op — regnskabet giver først mening, når eleven har set,
   hvor glukosen kommer fra.

   Motoren (stjerner, låse, træk-til-plads osv.) står i
   ../faelles/trinmotor.js. Simuleringen styres gennem `sim`.
   ═══════════════════════════════════════════════════════════ */
import {sim, klokkeslet, medFortegn} from './side.js';
import {trinforloeb, placering, afstemning, valg, quiz, taltest, stjernerFraFejl, h} from '../faelles/trinmotor.js';
import {tegnMolekyle} from '../faelles/molekyler.js';
import {lydTil, saetLyd} from '../faelles/fejring.js';

const M = sim.model;
const T = M.tilstand;

/* Et lille billede af et molekyle til opgavekortene. Gradienterne
   låner det fra figurens <defs>, som ligger i samme dokument. */
function molekyleBillede(id, bredde = 56){
  const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.setAttribute('viewBox', id === 'glukose' ? '-16 -15 32 30' : '-24 -14 48 28');
  s.setAttribute('width', bredde);
  s.setAttribute('height', Math.round(bredde*0.6));
  s.setAttribute('aria-hidden','true');
  s.appendChild(tegnMolekyle(id, {navn:false}));
  return s.outerHTML;
}

const F = {co2:'CO₂', h2o:'H₂O', glukose:'C₆H₁₂O₆', o2:'O₂', n2:'N₂'};
const NAVN = {co2:'kuldioxid', h2o:'vand', glukose:'glukose', o2:'ilt'};

/* Brikkerne til reaktionsskemaerne. `roller` siger, hvor stoffet
   hører til i fotosyntesen (v = før pilen, h = efter). */
function skemaBrikker(proces){
  const foer = proces === 'foto' ? ['co2','h2o'] : ['glukose','o2'];
  const efter = proces === 'foto' ? ['glukose','o2'] : ['co2','h2o'];
  const ord = proces === 'foto' ? 'fotosyntesen' : 'respirationen';
  const brikker = ['co2','h2o','glukose','o2'].map(id => ({
    id, html:F[id],
    forkert:f => f.gruppe === 'v' && efter.includes(id)
      ? F[id]+' ('+NAVN[id]+') dannes i '+ord+' — det hører til efter pilen.'
      : F[id]+' ('+NAVN[id]+') bruges i '+ord+' — det hører til før pilen.',
  }));
  brikker.push({id:'n2', html:F.n2, forkert:() => 'N₂ (kvælstof) er der masser af i luften, men det er ikke med i '+ord+'.'});
  const felt = (gruppe, navn) => ({felt:true, gruppe, accepter:gruppe === 'v' ? foer : efter, navn});
  return {brikker, foer:[felt('v','første stof før pilen'), felt('v','andet stof før pilen')],
          efter:[felt('h','første stof efter pilen'), felt('h','andet stof efter pilen')]};
}

/* ── Trinene ─────────────────────────────────────────────── */
const faser = {
  foto:{navn:'Fotosyntesen'},
  regnskab:{navn:'Respiration og regnskab', kraever:'foto'},
  slut:{navn:'Mester i fotosyntese', kraever:'regnskab'},
};

const trin = [
  {
    id:'navne', fase:'foto', titel:'Mød molekylerne',
    figurtekst:'<b>Kig:</b> CO₂ svæver i luften, og H₂O ligger i jorden. Glukose og ilt dannes inde i bladet.',
    byg(ind, api){
      ind.append(h('p',{class:'tf-tekst'}, 'Træk navnet hen til det rigtige molekyle. Formlen fortæller, hvilke atomer molekylet består af: C er kulstof, H er brint, og O er ilt.'));
      const kort = (id, tip) => ({felt:true, accepter:[id], navn:F[id], tip,
        hoved:molekyleBillede(id)+'<span class="tf-kort-formel">'+F[id]+'</span>'});
      placering(ind, api, {
        layout:'kort',
        skabelon:[
          kort('co2','CO₂ er ét kulstofatom og to iltatomer.'),
          kort('h2o','H₂O er to brintatomer og ét iltatom.'),
          kort('glukose','C₆H₁₂O₆ er et stort molekyle med seks kulstofatomer — et sukker.'),
          kort('o2','O₂ er to iltatomer sat sammen.'),
        ],
        brikker:[
          {id:'co2', html:'Kuldioxid'}, {id:'h2o', html:'Vand'}, {id:'glukose', html:'Glukose'}, {id:'o2', html:'Ilt'},
          {id:'co', html:'Kulilte', forkert:() => 'Kulilte er CO — kun ét iltatom. Den er ikke med i fotosyntesen.'},
        ],
        naarFaerdig:s => api.loest(s, 'Alle fire på plads. Kulilte (CO) var en fælde — den er ikke med.'),
      });
    },
  },
  {
    id:'saml', fase:'foto', titel:'Saml råstofferne',
    figurtekst:'<b>Prøv:</b> Klik på et H₂O i jorden, og følg vandets vej op gennem roden og stænglen.',
    byg(ind, api){
      if (!M.erLyst()){ T.klokken = 11; }
      sim.saetUr(false);
      sim.saetModus('traek', true);
      ind.append(h('p',{class:'tf-tekst', html:'Klik eller træk <b>6 CO₂</b> fra luften og <b>6 H₂O</b> fra jorden ind i bladet. Tryk så på <b>«Udfør fotosyntese»</b> under figuren.'}));
      const maaler = h('div',{class:'tf-maaler'});
      const tegn = () => maaler.replaceChildren(
        ...['co2','h2o'].map(id => h('div',{class:'tf-maal'},
          h('span',{class:'tf-maal-navn'}, F[id]),
          h('span',{class:'tf-prikker', 'aria-label':T[id]+' af 6'},
            ...Array.from({length:6}, (_, i) => h('i',{class:i < T[id] ? 'fuld' : ''}))),
          h('b',{}, T[id]+'/6'))));
      tegn();
      ind.append(maaler);
      let fulde = 0;
      const af = [
        sim.on('molekyle', tegn),
        sim.on('nulstil', tegn),
        sim.on('fuld', () => { fulde++; }),
        sim.on('reaktion', () => {
          tegn();
          api.loest(fulde > 2 ? 2 : 3, '12 små molekyler blev til 1 glukose og 6 O₂. Ilten slipper ud gennem bladets spalteåbninger.');
        }),
      ];
      return () => af.forEach(f => f());
    },
  },
  {
    id:'skema', fase:'foto', titel:'Opstil reaktionsskemaet',
    figurtekst:'<b>Husk:</b> Det, der går ind i kloroplasten, står før pilen. Det, der kommer ud, står efter.',
    byg(ind, api){
      ind.append(h('p',{class:'tf-tekst'}, 'Hvilke stoffer bruges, og hvilke dannes? Træk dem på plads i skemaet.'));
      const {brikker, foer, efter} = skemaBrikker('foto');
      placering(ind, api, {
        skabelon:[foer[0], '+', foer[1], '+ <span class="lys">lysenergi</span>', '→', efter[0], '+', efter[1]],
        brikker,
        naarFaerdig:s => api.loest(s, 'Skemaet er rigtigt. Men passer antallet af atomer? Det ser vi på i næste trin.'),
      });
    },
  },
  {
    id:'afstem', fase:'foto', titel:'Afstem skemaet',
    figurtekst:'<b>Kig:</b> Kloroplasten har plads til præcis 6 CO₂ og 6 H₂O. Hvorfor lige seks?',
    byg(ind, api){
      ind.append(h('p',{class:'tf-tekst'}, 'Atomer forsvinder ikke i en reaktion — de bliver bare sat sammen på en ny måde. Skru på tallene, så der er lige mange C-, H- og O-atomer på begge sider af pilen.'));
      afstemning(ind, api, {
        led:[
          {formel:'CO₂', atomer:{C:1, O:2}, side:'v'},
          {formel:'H₂O', atomer:{H:2, O:1}, side:'v'},
          {formel:'C₆H₁₂O₆', atomer:{C:6, H:12, O:6}, side:'h'},
          {formel:'O₂', atomer:{O:2}, side:'h'},
        ],
        tillaeg:'+ lys',
        naarFaerdig:s => api.loest(s, '6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂. Derfor skal kloroplasten bruge seks af hver.'),
      });
    },
  },
  {
    id:'lys', fase:'foto', titel:'Lys er energikilden', dele:['styr'],
    figurtekst:'<b>Prøv:</b> Træk «Tid på døgnet» til efter kl. 18. Hvad sker der med himlen og med grana i kloroplasten?',
    byg(ind, api){
      sim.saetUr(false);
      sim.saetModus('traek', true);
      let forudsigelse = null, saaMoerke = false;
      const opgave = h('div',{class:'tf-skjult', hidden:true},
        h('p',{class:'tf-tekst', html:'<b>Afprøv det:</b> Træk tiden til nat (efter 18:00), og saml 6 CO₂ og 6 H₂O. Træk så tiden frem til morgen, og udfør fotosyntesen.'}),
        h('p',{class:'tf-flueben', id:'tf-moerke'}, '○ 6 + 6 samlet i mørke'),
        h('p',{class:'tf-flueben', id:'tf-morgen'}, '○ Fotosyntese, da det blev lyst'));
      valg(ind, api, {
        tekst:'<b>Forudsig først:</b> Planten har 6 CO₂ og 6 H₂O, men det er nat. Hvad sker der?',
        svar:['Der dannes ingen glukose, før det bliver lyst',
              'Fotosyntesen kører bare langsommere',
              'Planten bruger varmen i stedet for lyset'],
        rigtig:0, straf:false,
        forklaring:'Fotosyntesen skal bruge lysenergi for at binde de små molekyler sammen til glukose.',
        naarSvaret:ok => { forudsigelse = ok; opgave.hidden = false; },
      });
      ind.append(opgave);
      const kryds = (id, tekst) => { const n = ind.querySelector('#'+id); n.textContent = '● '+tekst; n.classList.add('ok'); };
      const tjekMoerke = () => {
        if (!M.erLyst() && T.co2 === 6 && T.h2o === 6 && !saaMoerke){
          saaMoerke = true; kryds('tf-moerke','6 + 6 samlet i mørke — kloroplasten venter');
        }
      };
      const af = [
        sim.on('fuld-i-moerke', tjekMoerke),
        sim.on('lys', tjekMoerke),
        sim.on('molekyle', tjekMoerke),
        sim.on('reaktion', () => {
          if (!saaMoerke){ api.info('Fotosyntesen kørte i lyset. Prøv nu at samle de 12 molekyler, mens det er nat.'); return; }
          kryds('tf-morgen','Fotosyntese, da det blev lyst');
          api.loest(forudsigelse ? 3 : 2, 'Uden lys ingen fotosyntese. Lysenergien bliver bundet i glukosen som kemisk energi.');
        }),
      ];
      return () => af.forEach(f => f());
    },
  },

  {
    id:'resp', fase:'regnskab', titel:'Respirationen',
    figurtekst:'<b>Kig:</b> Mitokondriet nederst til højre i cellen. Her forbrændes glukosen igen.',
    byg(ind, api){
      sim.saetUr(false);
      ind.append(h('p',{class:'tf-tekst'}, 'Planten bruger selv en del af sin glukose. I mitokondrierne forbrændes den med ilt, og energien bruges i cellen. Opstil skemaet for respirationen.'));
      const {brikker, foer, efter} = skemaBrikker('resp');
      placering(ind, api, {
        skabelon:[foer[0], '+', foer[1], '→', efter[0], '+', efter[1], '+ <span class="lys">energi</span>'],
        brikker,
        naarFaerdig:s => api.loest(s, 'C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + energi. Respirationen er fotosyntesen baglæns.'),
      });
    },
  },
  {
    id:'doegn', fase:'regnskab', titel:'Et døgn i planten', dele:['styr','processer','regnskab'],
    figurtekst:'<b>Følg:</b> Hvad sker der med «Glukose i cellen», når solen går ned?',
    byg(ind, api){
      sim.nulstil();
      T.klokken = 6;
      sim.saetUr(false);
      ind.append(h('p',{class:'tf-tekst', html:
        'Nu holder vi regnskab med glukosen:<br><b>BPP</b> (bruttoprimærproduktion) er al den glukose, fotosyntesen danner.<br>'+
        '<b>R</b> (respiration) er den glukose, planten selv forbrænder.<br>'+
        'Vælg <b>«Automatisk»</b>, og tryk <b>«Start døgnet»</b>. Følg tallene et helt døgn.'}));
      const fremdrift = h('div',{class:'tf-fremdrift'}, h('i'));
      const etiket = h('p',{class:'tf-lille'}, 'Regnskabet starter kl. 06:00.');
      ind.append(fremdrift, etiket);
      let start = null, faerdig = false;
      const ur = setInterval(() => {
        if (faerdig) return;
        if (T.modus === 'auto' && T.urKoerer && start === null) start = {d:T.doegn, k:T.klokken};
        if (start === null) return;
        const gaaet = (T.doegn - start.d)*24 + (T.klokken - start.k);
        fremdrift.firstChild.style.width = Math.min(100, 100*gaaet/24).toFixed(1)+'%';
        etiket.textContent = 'Klokken er '+klokkeslet(T.klokken)+' · BPP '+T.bpp+' · R '+T.r+' · NPP '+medFortegn(M.npp());
        if (gaaet >= 24){
          faerdig = true;
          sim.saetUr(false);
          valg(ind, api, {
            tekst:'Døgnet er gået. <b>Hvornår faldt NPP?</b>',
            svar:['Om natten — så er der kun respiration', 'Midt på dagen — så er der mest lys', 'Hele tiden'],
            rigtig:0, straf:false,
            forklaring:'Om natten er BPP 0, men respirationen fortsætter. Så tærer planten på glukosen, og NPP falder.',
            naarSvaret:ok => api.loest(ok ? 3 : 2, 'Planten har nu levet et helt døgn. NPP = BPP − R var '+medFortegn(M.npp())+' glukose.'),
          });
        }
      }, 200);
      const af = sim.on('nulstil', () => { start = null; fremdrift.firstChild.style.width = '0%'; });
      return () => { clearInterval(ur); af(); };
    },
  },
  {
    id:'npp', fase:'regnskab', titel:'Regn på NPP', dele:['regnskab'],
    figurtekst:'<b>Husk:</b> NPP er den glukose, der bliver til mere plante — ny biomasse.',
    byg(ind, api){
      ind.append(h('div',{class:'tf-formelboks', html:'NPP = BPP − R'}));
      taltest(ind, api, {
        opgaver:[
          {tekst:'En plante har BPP = 18 glukose og R = 7 glukose. Hvad er NPP?', facit:11, enhed:'glukose',
           tip:'NPP = BPP − R. Træk respirationen fra.'},
          {tekst:'Om natten er BPP = 0 og R = 4. Hvad er NPP?', facit:-4, enhed:'glukose',
           tip:'Uden fotosyntese er der kun respiration — så bliver NPP negativ.',
           efter:'om natten er NPP negativ.'},
          {tekst:'En plante har NPP = 5 og R = 9. Hvad er BPP?', facit:14, enhed:'glukose',
           tip:'BPP = NPP + R.'},
          {tekst:'Aflæs dit eget regnskab i sidepanelet. Hvad er NPP lige nu?', facit:() => M.npp(), enhed:'glukose',
           tip:'Se på NPP i «Regnskab» — eller regn BPP − R ud fra tallene dér.'},
        ],
        naarFaerdig:s => api.loest(s, 'Du kan regne med BPP, R og NPP. Kun NPP bliver til ny plante.'),
      });
    },
  },
  {
    id:'quiz', fase:'regnskab', titel:'Quiz',
    byg(ind, api){
      quiz(ind, api, {
        spoergsmaal:[
          {tekst:'Hvor i cellen foregår fotosyntesen?',
           svar:['I kloroplasten','I mitokondriet','I cellekernen','I cellevæggen'], rigtig:0,
           forklaring:'Grana i kloroplasten indeholder klorofyl, som opfanger lyset.'},
          {tekst:'Hvornår respirerer planten?',
           svar:['Hele døgnet','Kun om natten','Kun når solen skinner','Aldrig — det gør kun dyr'], rigtig:0,
           forklaring:'Cellerne skal bruge energi hele tiden, så respirationen kører døgnet rundt.'},
          {tekst:'Hvad er NPP?',
           svar:['BPP minus respirationen','Al den glukose, fotosyntesen danner','Den ilt, planten afgiver','Den glukose, planten forbrænder'], rigtig:0,
           forklaring:'NPP = BPP − R. Det er den glukose, der er tilbage til vækst.'},
          {tekst:'Det er 38 °C. Hvorfor vokser planten dårligt?',
           svar:['Respirationen stiger, mens fotosyntesen falder','Der kommer for meget lys','Planten mangler CO₂','Respirationen stopper ved høj temperatur'], rigtig:0,
           forklaring:'I modellen har fotosyntesen et optimum ved 25 °C, mens respirationen bliver ved at stige med temperaturen.'},
          {tekst:'Hvordan kommer vandet til fotosyntesen ind i bladet?',
           svar:['Gennem rødderne og op gennem stænglen','Ind gennem spalteåbningerne fra luften','Det dannes i kloroplasten','Det kommer fra glukosen'], rigtig:0,
           forklaring:'Rødderne optager vandet, og det transporteres op gennem stænglen til bladene.'},
        ],
        naarFaerdig:(s, n) => api.loest(s, n+' af 5 rigtige.'),
      });
    },
  },
  {
    id:'finale', fase:'slut', titel:'Mester i fotosyntese', finale:true,
    byg(ind, api){
      const alle = api.alleKlaret();
      ind.append(
        h('div',{class:'tf-medalje', 'aria-hidden':'true'}, h('span',{}, '★')),
        h('p',{class:'tf-tekst tf-midt', html:'Du har samlet <b>'+api.total()+' af '+api.maks+'</b> stjerner.'}),
        h('p',{class:'tf-tekst'}, 'Nu kan du forklare, hvordan planten laver glukose af CO₂ og vand med lysenergi, hvordan den selv forbrænder noget af glukosen igen, og hvorfor kun NPP bliver til ny plante.'),
        h('div',{class:'tf-handling'},
          h('button',{type:'button', class:'btn primaer', onclick:() => saetVisning('fri')}, 'Udforsk frit'),
          h('button',{type:'button', class:'btn', onclick:() => { if (confirm('Slet alle dine stjerner og start forfra?')) api.nulstilAlt(); }}, 'Start forfra')));
      if (alle) api.fejr();
    },
  },
];

/* ── Opgaver eller fri udforskning ─────────────────────── */
const vaert = document.getElementById('opgaver');
const fri = document.getElementById('btn-fri');
const opg = document.getElementById('btn-opgaver');
const sum = document.getElementById('opg-sum');
const FRI_TEKST = '<b>Prøv:</b> Sæt temperaturen op, og start døgnet. Hvornår er NPP størst — ved 15, 25 eller 35 °C?';
let visning = 'opgaver';

const forloeb = trinforloeb({
  vaert, noegle:'smbi-fotosyntese-opgaver-v1', faser, trin,
  paaSkift:t => {
    if (visning !== 'opgaver') return;
    document.querySelector('.side').scrollTop = 0;
    sim.visDele(t.dele || []);
    sim.saetStandardTekst(t.figurtekst || '<b>Klar?</b> Løs opgaven i panelet til højre.');
  },
  paaStjerner:(n, maks) => { sum.textContent = n; sum.parentElement.title = n+' af '+maks+' stjerner'; },
});

function saetVisning(v){
  visning = v;
  fri.setAttribute('aria-pressed', v === 'fri' ? 'true' : 'false');
  opg.setAttribute('aria-pressed', v === 'opgaver' ? 'true' : 'false');
  vaert.hidden = v !== 'opgaver';
  if (v === 'fri'){
    sim.visDele('alle');
    sim.saetStandardTekst(FRI_TEKST);
  } else forloeb.genvis();
  try { localStorage.setItem('smbi-fotosyntese-visning', v); } catch { /* ingen lagring */ }
}
fri.addEventListener('click', () => saetVisning('fri'));
opg.addEventListener('click', () => saetVisning('opgaver'));

let start = 'opgaver';
try { start = localStorage.getItem('smbi-fotosyntese-visning') || 'opgaver'; } catch { /* ingen lagring */ }
if (/[?&]fri=1/.test(location.search)) start = 'fri';
saetVisning(start);

/* ── Lyd til og fra ────────────────────────────────────── */
const lydKnap = document.getElementById('btn-lyd');
const visLyd = () => {
  lydKnap.setAttribute('aria-pressed', lydTil() ? 'true' : 'false');
  lydKnap.textContent = lydTil() ? '🔊 Lyd' : '🔇 Lyd';
};
lydKnap.addEventListener('click', () => { saetLyd(!lydTil()); visLyd(); });
visLyd();
