/* ═══════════════════════════════════════════════════════════
   trinmotor.js — elevopgaver i trin, med stjerner.

   Én opgave ad gangen i et kort. Hvert trin giver 1–3 stjerner
   efter, hvor mange forsøg det tog. Trinene hører til faser, og en
   fase kan kræve, at en tidligere fase er klaret, før den låses op.
   Fremskridtet huskes i browseren (localStorage), men siden virker
   også uden.

   Motoren kender ikke faget. Et trin er et objekt:

     { id, fase, titel, figurtekst?, dele?: ['styr', …],
       byg(indhold, api) → evt. en oprydningsfunktion }

   og byggeklodserne nederst (placering, afstemning, quiz, valg,
   taltest) laver de almindelige opgavetyper inde i `indhold`.
   ═══════════════════════════════════════════════════════════ */
import {pling, bom, stjerne as stjerneLyd, fanfare, konfetti} from './fejring.js';

const h = (tag, attrs = {}, ...boern) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)){
    if (v === false || v == null) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const b of boern.flat()) if (b != null) n.append(b);
  return n;
};
export {h};

export const stjernerFraFejl = (fejl, graenser = [0, 2]) =>
  fejl <= graenser[0] ? 3 : fejl <= graenser[1] ? 2 : 1;

const bland = liste => {
  const a = [...liste];
  for (let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
};

/* ═══ Selve forløbet ═════════════════════════════════════ */
export function trinforloeb({vaert, noegle, faser, trin, paaSkift, paaStjerner}){
  let gemt = {aktiv:0, stjerner:{}};
  try { Object.assign(gemt, JSON.parse(localStorage.getItem(noegle) || '{}')); } catch { /* ingen lagring */ }
  const gem = () => { try { localStorage.setItem(noegle, JSON.stringify(gemt)); } catch { /* ingen lagring */ } };

  const taelles = trin.filter(t => !t.finale);
  const maks = taelles.length * 3;
  const total = () => taelles.reduce((s, t) => s + (gemt.stjerner[t.id] || 0), 0);
  const faseKlaret = f => trin.filter(t => t.fase === f && !t.finale).every(t => gemt.stjerner[t.id] > 0);
  const laast = t => { const k = faser[t.fase]?.kraever; return !!k && !faseKlaret(k); };

  /* skallen */
  const faseNavn = h('span',{class:'tf-fase'});
  const sumTal = h('b');
  const sti = h('ol',{class:'tf-sti', 'aria-label':'Trin i opgaverne'});
  const titel = h('h2',{class:'tf-titel', tabindex:'-1'});
  const indhold = h('div',{class:'tf-indhold'});
  const status = h('p',{class:'tf-status', role:'status'});
  const belonning = h('div',{class:'tf-belonning', 'aria-hidden':'true'});
  const naeste = h('button',{type:'button', class:'btn primaer tf-naeste', hidden:true}, 'Næste trin →');
  const kort = h('div',{class:'tf'},
    h('div',{class:'tf-hoved'}, faseNavn, h('span',{class:'tf-sum', title:'Dine stjerner'}, '★ ', sumTal, ' / '+maks)),
    sti, titel, indhold,
    h('div',{class:'tf-bund'}, status, belonning, naeste));
  vaert.replaceChildren(kort);

  let aktiv = Math.min(gemt.aktiv || 0, trin.length-1);
  if (laast(trin[aktiv])) aktiv = 0;
  let ryd = null;
  let fejl = 0;

  function tegnSti(){
    sti.replaceChildren();
    let forrigeFase = null;
    trin.forEach((t, i) => {
      if (forrigeFase && t.fase !== forrigeFase) sti.append(h('li',{class:'tf-skel', 'aria-hidden':'true'}));
      forrigeFase = t.fase;
      const s = gemt.stjerner[t.id] || 0;
      const l = laast(t);
      const etiket = 'Trin '+(i+1)+': '+t.titel+(l ? ' — låst' : s ? ' — '+s+' af 3 stjerner' : '');
      sti.append(h('li',{},
        h('button',{type:'button', class:'tf-prik'+(i === aktiv ? ' aktiv' : '')+(s ? ' klaret' : '')+(l ? ' laast' : '')+(t.finale ? ' finale' : ''),
                     'aria-label':etiket, title:etiket, 'aria-current':i === aktiv ? 'step' : false,
                     onclick:() => gaaTil(i, true)},
          h('span',{class:'tf-nr'}, t.finale ? '★' : l ? '🔒' : String(i+1)),
          t.finale ? null : h('span',{class:'tf-mini', 'aria-hidden':'true'}, '★'.repeat(s) + '☆'.repeat(3-s)))));
    });
    sumTal.textContent = total();
    paaStjerner?.(total(), maks);
  }

  function gaaTil(i, flytFokus){
    const t = trin[i];
    if (laast(t)){
      const krav = faser[faser[t.fase].kraever];
      saetStatus('Låst. Klar først alle trin i «'+krav.navn+'».', 'fejl');
      return;
    }
    ryd?.(); ryd = null;
    aktiv = i; gemt.aktiv = i; gem();
    fejl = 0;
    faseNavn.textContent = faser[t.fase].navn + (t.finale ? '' : ' · trin '+(i+1)+' af '+taelles.length);
    titel.textContent = t.titel;
    indhold.replaceChildren();
    status.textContent = ''; status.className = 'tf-status';
    belonning.replaceChildren();
    naeste.hidden = true;
    const tidligere = gemt.stjerner[t.id] || 0;
    if (tidligere && !t.finale){
      naeste.hidden = i >= trin.length-1;
      saetStatus('Du har klaret trinet før ('+'★'.repeat(tidligere)+'). Prøv igen, eller gå videre.', 'info');
    }
    tegnSti();
    paaSkift?.(t);
    ryd = t.byg(indhold, api) || null;
    if (flytFokus) titel.focus({preventScroll:true});
  }

  function saetStatus(tekst, slags){
    status.textContent = tekst;
    status.className = 'tf-status ' + (slags || '');
  }

  const api = {
    h,
    get fejl(){ return fejl; },
    fejlet(tekst){
      fejl++;
      bom();
      saetStatus(tekst, 'fejl');
    },
    info(tekst){ saetStatus(tekst, 'info'); },
    loest(stjerner, tekst){
      const t = trin[aktiv];
      stjerner = Math.max(1, Math.min(3, stjerner));
      const foer = gemt.stjerner[t.id] || 0;
      const varLaast = Object.fromEntries(trin.map(x => [x.fase, laast(x)]));
      gemt.stjerner[t.id] = Math.max(foer, stjerner);
      gem();
      pling();
      saetStatus(tekst, 'rigtig');
      belonning.replaceChildren(...[0,1,2].map(k =>
        h('span',{class:'tf-stj'+(k < stjerner ? ' fuld' : ''), style:'--i:'+k}, k < stjerner ? '★' : '☆')));
      for (let k=0;k<stjerner;k++) stjerneLyd(k);
      naeste.hidden = aktiv >= trin.length-1;
      tegnSti();
      (naeste.hidden ? status : naeste).scrollIntoView({block:'nearest', behavior:'smooth'});
      /* låste den her løsning en ny fase op? */
      const nyFase = trin.find(x => varLaast[x.fase] && !laast(x));
      if (nyFase){
        setTimeout(() => {
          saetStatus(tekst+' Nyt niveau låst op: «'+faser[nyFase.fase].navn+'».', 'rigtig');
          fanfare();
        }, 900);
      }
    },
    naeste(){ if (aktiv < trin.length-1) gaaTil(aktiv+1, true); },
    alleKlaret: () => taelles.every(t => gemt.stjerner[t.id] > 0),
    total, maks,
    nulstilAlt(){
      gemt = {aktiv:0, stjerner:{}};
      gem();
      gaaTil(0, true);
    },
    fejr(){ fanfare(); konfetti(); },
  };

  naeste.addEventListener('click', () => api.naeste());
  gaaTil(aktiv, false);
  return {gaaTil, api, aktivt:() => trin[aktiv], genvis:() => gaaTil(aktiv, false)};
}

/* ═══ Byggeklodser ═══════════════════════════════════════ */

/* Træk brikker hen på tomme felter — eller klik en brik og så et felt.
   `skabelon` er en blanding af tekst (html) og felter:
     {felt:'v1', accepter:['co2','h2o'], gruppe:'v', hoved?:html, tip?:tekst}
   `brikker`: [{id, html, forkert?:(felt) => tekst}] — hver bruges én gang. */
export function placering(indhold, api, {skabelon, brikker, layout = 'skema', naarFaerdig, stjerner}){
  const valgt = {brik:null};
  const felter = [];
  const ramme = h('div',{class:'tf-place tf-'+layout});
  for (const del of skabelon){
    if (typeof del === 'string'){ ramme.append(h('span',{class:'tf-op', html:del})); continue; }
    const felt = h('button',{type:'button', class:'tf-felt', 'aria-label':'Tomt felt'+(del.navn ? ': '+del.navn : '')},
      h('span',{class:'tf-felt-tom', 'aria-hidden':'true'}, '?'));
    felt.data = del;
    felt.addEventListener('click', () => {
      if (felt.classList.contains('fyldt')) return;
      if (!valgt.brik){ api.info('Vælg først en brik nedenfor — eller træk den herop.'); return; }
      proev(valgt.brik, felt);
    });
    felter.push(felt);
    ramme.append(del.hoved ? h('div',{class:'tf-kort'}, h('div',{class:'tf-kort-hoved', html:del.hoved}), felt) : felt);
  }
  const bunke = h('div',{class:'tf-bunke', role:'group', 'aria-label':'Brikker'});
  for (const b of bland(brikker)){
    const knap = h('button',{type:'button', class:'tf-brik', 'aria-pressed':'false', html:b.html});
    knap.data = b;
    bindTraek(knap);
    bunke.append(knap);
  }
  indhold.append(ramme, bunke);

  function vaelg(knap){
    for (const k of bunke.children) k.setAttribute('aria-pressed', k === knap ? 'true' : 'false');
    valgt.brik = knap;
  }

  function proev(knap, felt){
    const b = knap.data, f = felt.data;
    if (felt.classList.contains('fyldt')) return;
    if (f.accepter.includes(b.id)){
      felt.classList.add('fyldt');
      felt.replaceChildren(h('span',{class:'tf-felt-ind', html:b.html}));
      felt.setAttribute('aria-label', 'Udfyldt: '+knap.textContent);
      felt.disabled = true;
      /* i en gruppe må samme brik ikke bruges to gange */
      if (f.gruppe) for (const andet of felter)
        if (andet !== felt && andet.data.gruppe === f.gruppe) andet.data = {...andet.data, accepter:andet.data.accepter.filter(x => x !== b.id)};
      knap.remove();
      valgt.brik = null;
      pling();
      if (felter.every(x => x.classList.contains('fyldt'))){
        for (const rest of bunke.children){ rest.disabled = true; rest.classList.add('brugt'); }
        const s = stjerner ? stjerner(api.fejl) : stjernerFraFejl(api.fejl);
        naarFaerdig ? naarFaerdig(s) : api.loest(s, 'Rigtigt!');
      } else api.info('Rigtigt — fortsæt.');
    } else {
      felt.classList.remove('ryst'); void felt.offsetWidth; felt.classList.add('ryst');
      knap.setAttribute('aria-pressed','false');
      valgt.brik = null;
      api.fejlet(b.forkert?.(f) ?? f.tip ?? 'Den passer ikke her — prøv en anden.');
    }
  }

  function bindTraek(knap){
    let start = null, spoegelse = null;
    knap.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      start = {x:e.clientX, y:e.clientY, id:e.pointerId};
      knap.setPointerCapture(e.pointerId);
    });
    knap.addEventListener('pointermove', e => {
      if (!start || e.pointerId !== start.id) return;
      if (!spoegelse && Math.hypot(e.clientX-start.x, e.clientY-start.y) > 6){
        spoegelse = knap.cloneNode(true);
        spoegelse.classList.add('tf-spoegelse');
        document.body.append(spoegelse);
        knap.classList.add('loeftet');
      }
      if (spoegelse){
        spoegelse.style.left = e.clientX+'px';
        spoegelse.style.top = e.clientY+'px';
        for (const f of felter) f.classList.toggle('over', under(e) === f);
      }
    });
    const slip = e => {
      if (!start || e.pointerId !== start.id) return;
      start = null;
      if (!spoegelse) return;            /* et klik — det klares af click */
      knap.traekket = true;
      const f = under(e);
      spoegelse.remove(); spoegelse = null;
      knap.classList.remove('loeftet');
      for (const x of felter) x.classList.remove('over');
      if (f && !f.classList.contains('fyldt')) proev(knap, f);
    };
    knap.addEventListener('pointerup', slip);
    knap.addEventListener('pointercancel', e => { if (spoegelse){ spoegelse.remove(); spoegelse = null; knap.classList.remove('loeftet'); } start = null; });
    knap.addEventListener('click', () => {
      if (knap.traekket){ knap.traekket = false; return; }
      vaelg(knap.getAttribute('aria-pressed') === 'true' ? null : knap);
      if (valgt.brik) api.info('Valgt: '+knap.textContent+'. Vælg nu et felt.');
    });
  }
  const under = e => document.elementsFromPoint(e.clientX, e.clientY).map(n => n.closest?.('.tf-felt')).find(Boolean) || null;
}

/* Afstem et reaktionsskema med tal foran hvert stof.
   led: [{formel, atomer:{C:1,O:2}, side:'v'|'h'}] */
export function afstemning(indhold, api, {led, tillaeg = '', naarFaerdig, maksTal = 12}){
  const tal = led.map(() => 1);
  let hjaelp = false;
  const raekke = h('div',{class:'tf-afstem'});
  const visninger = [];
  led.forEach((l, i) => {
    if (i > 0) raekke.append(h('span',{class:'tf-op'}, l.side !== led[i-1].side ? '→' : '+'));
    if (i > 0 && l.side !== led[i-1].side && tillaeg) raekke.lastChild.before(h('span',{class:'tf-op lys', html:tillaeg}));
    const vis = h('output',{class:'tf-koef', 'aria-live':'polite'}, '1');
    visninger.push(vis);
    const skift = d => {
      tal[i] = Math.max(1, Math.min(maksTal, tal[i] + d));
      vis.textContent = tal[i];
      vis.classList.toggle('en', tal[i] === 1);
      opdaterRegnskab();
    };
    raekke.append(h('div',{class:'tf-led'},
      h('button',{type:'button', class:'tf-pil', 'aria-label':'Flere '+l.formel, onclick:() => skift(1)}, '▲'),
      vis,
      h('button',{type:'button', class:'tf-pil', 'aria-label':'Færre '+l.formel, onclick:() => skift(-1)}, '▼'),
      h('span',{class:'tf-formel', html:l.formel})));
  });
  visninger.forEach(v => v.classList.add('en'));

  const atomer = [...new Set(led.flatMap(l => Object.keys(l.atomer)))];
  const taelling = () => Object.fromEntries(atomer.map(a => [a, {
    v:led.reduce((s,l,i) => s + (l.side === 'v' ? tal[i]*(l.atomer[a]||0) : 0), 0),
    h:led.reduce((s,l,i) => s + (l.side === 'h' ? tal[i]*(l.atomer[a]||0) : 0), 0),
  }]));
  const tabel = h('table',{class:'tf-atomer', hidden:true},
    h('thead',{}, h('tr',{}, h('th',{}, 'Atom'), h('th',{}, 'Før pilen'), h('th',{}, 'Efter pilen'), h('th',{}, ''))));
  const krop = h('tbody');
  tabel.append(krop);
  function opdaterRegnskab(){
    const t = taelling();
    krop.replaceChildren(...atomer.map(a => h('tr',{class:t[a].v === t[a].h ? 'lige' : ''},
      h('th',{}, a), h('td',{}, String(t[a].v)), h('td',{}, String(t[a].h)),
      h('td',{}, t[a].v === t[a].h ? '✓' : '≠'))));
  }
  opdaterRegnskab();

  const hjaelpKnap = h('button',{type:'button', class:'btn-mini', onclick:() => {
    hjaelp = true; tabel.hidden = false; hjaelpKnap.remove();
    api.info('Atomregnskabet tæller atomerne på hver side for dig.');
  }}, 'Vis atomregnskab (−1 ★)');
  const tjek = h('button',{type:'button', class:'btn primaer', onclick:() => {
    const t = taelling();
    const skaev = atomer.find(a => t[a].v !== t[a].h);
    if (skaev){
      const ord = n => n+' '+skaev+'-atom'+(n === 1 ? '' : 'er');
      api.fejlet('Ikke afstemt endnu: der er '+ord(t[skaev].v)+' før pilen og '+ord(t[skaev].h)+' efter.');
      return;
    }
    const g = tal.reduce((a, b) => { while (b){ [a, b] = [b, a % b]; } return a; });
    if (g > 1){ api.info('Det går op! Men alle tallene kan deles med '+g+'. Brug de mindste hele tal.'); return; }
    const s = Math.max(1, stjernerFraFejl(api.fejl, [0, 2]) - (hjaelp ? 1 : 0));
    naarFaerdig ? naarFaerdig(s, tal) : api.loest(s, 'Afstemt!');
  }}, 'Tjek');
  indhold.append(raekke, h('div',{class:'tf-handling'}, tjek, hjaelpKnap), tabel);
}

/* Ét multiple choice-spørgsmål. Ét forsøg; derefter vises forklaringen. */
export function valg(indhold, api, {tekst, svar, rigtig, forklaring, naarSvaret, straf = true}){
  const boks = h('div',{class:'tf-valg'});
  boks.append(h('p',{class:'tf-spm', html:tekst}));
  const liste = h('div',{class:'tf-svar'});
  const ordnet = bland(svar.map((s, i) => ({s, i})));
  for (const {s, i} of ordnet){
    liste.append(h('button',{type:'button', class:'tf-svar-knap', html:s, onclick:e => {
      for (const k of liste.children){ k.disabled = true; if (k.dataset.i == rigtig) k.classList.add('rigtig'); }
      const ok = i === rigtig;
      if (!ok){ e.currentTarget.classList.add('forkert'); if (straf) api.fejlet('Ikke helt.'); }
      else pling();
      boks.append(h('p',{class:'tf-forklaring', html:(ok ? '<b>Rigtigt.</b> ' : '<b>Svaret er markeret med grønt.</b> ') + forklaring}));
      naarSvaret?.(ok);
    }, 'data-i':i}));
  }
  boks.append(liste);
  indhold.append(boks);
  return boks;
}

/* En lille quiz: spørgsmålene ét ad gangen, stjerner efter antal rigtige. */
export function quiz(indhold, api, {spoergsmaal, naarFaerdig}){
  let nr = 0, rigtige = 0;
  const taeller = h('p',{class:'tf-quiz-nr'});
  const felt = h('div');
  indhold.append(taeller, felt);
  function vis(){
    felt.replaceChildren();
    taeller.textContent = 'Spørgsmål '+(nr+1)+' af '+spoergsmaal.length+' · '+rigtige+' rigtige';
    const q = spoergsmaal[nr];
    valg(felt, api, {...q, straf:false, naarSvaret:ok => {
      if (ok) rigtige++; else api.fejlet('Ikke helt — læs forklaringen.');
      taeller.textContent = 'Spørgsmål '+(nr+1)+' af '+spoergsmaal.length+' · '+rigtige+' rigtige';
      const sidst = nr === spoergsmaal.length-1;
      felt.append(h('button',{type:'button', class:'btn primaer', onclick:() => {
        if (!sidst){ nr++; vis(); return; }
        const n = spoergsmaal.length;
        const s = rigtige === n ? 3 : rigtige >= n-1 ? 2 : 1;
        naarFaerdig ? naarFaerdig(s, rigtige) : api.loest(s, rigtige+' af '+n+' rigtige.');
      }}, sidst ? 'Se resultatet' : 'Næste spørgsmål →'));
    }});
  }
  vis();
}

/* Regneopgaver med et tal som svar. `facit` kan være en funktion,
   så svaret kan hentes fra simuleringen i det øjeblik, der tjekkes. */
export function taltest(indhold, api, {opgaver, naarFaerdig}){
  let nr = 0;
  const felt = h('div',{class:'tf-tal'});
  indhold.append(felt);
  function vis(){
    const o = opgaver[nr];
    const input = h('input',{type:'text', inputmode:'decimal', class:'tf-input', 'aria-label':'Dit svar', autocomplete:'off'});
    const form = h('form',{class:'tf-talform', onsubmit:e => {
      e.preventDefault();
      const v = parseFloat(input.value.replace('−','-').replace(',','.'));
      const facit = typeof o.facit === 'function' ? o.facit() : o.facit;
      if (!Number.isFinite(v)){ api.info('Skriv et tal.'); return; }
      if (Math.abs(v - facit) < 1e-9){
        pling();
        input.disabled = true;
        form.classList.add('rigtig');
        if (nr < opgaver.length-1){ api.info('Rigtigt — '+(o.efter || 'næste opgave.')); nr++; setTimeout(vis, 450); }
        else { const s = stjernerFraFejl(api.fejl, [0, 2]); naarFaerdig ? naarFaerdig(s) : api.loest(s, o.efter || 'Rigtigt!'); }
      } else api.fejlet(o.tip || 'Ikke rigtigt. Prøv igen.');
    }},
      h('label',{class:'tf-spm', html:'<span class="tf-opg-nr">'+(nr+1)+'/'+opgaver.length+'</span> '+o.tekst}),
      h('div',{class:'tf-talfelt'}, input, o.enhed ? h('span',{class:'tf-enhed'}, o.enhed) : null,
        h('button',{type:'submit', class:'btn primaer'}, 'Tjek')));
    felt.append(form);
    input.focus({preventScroll:true});
  }
  vis();
}
