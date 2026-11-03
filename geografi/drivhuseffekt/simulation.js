import { starttilstand, energistroemme, udvikl } from './model.mjs';

const $ = id => document.getElementById(id);
const laerred = $('straaling');
const pensel = laerred.getContext('2d');
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
const trin = [
  { navn: 'Solens energi', kaede: 'SOLEN → JORDEN', spoergsmaal: 'Hvordan bliver jorden varm?', tekst: 'Solens kortbølgede stråling absorberes ved jordoverfladen. Energien bliver til varme.', naeste: 'Jorden stråler også', beskrivelse: 'Gule strålingsspor bevæger sig fra Solen til jordoverfladen og absorberes. Overfladen opvarmes.' },
  { navn: 'Jorden stråler', kaede: 'VARM JORD → VARMESTRÅLING', spoergsmaal: 'Stråler jorden også uden sollys?', tekst: 'Den varme jord udsender langbølget varmestråling i alle retninger over overfladen. Jo varmere den er, desto mere udsender den.', naeste: 'Tilføj drivhusgasser', beskrivelse: 'Jordoverfladen udsender røde, bølgede spor i forskellige udadgående retninger. Udsendelsen fortsætter, når sollyset afskærmes; jorden køler da af og stråler mindre.' },
  { navn: 'Gasser absorberer', kaede: 'JORDENS VARMESTRÅLING → ATMOSFÆREN', spoergsmaal: 'Hvad sker der med jordens varmestråling?', tekst: 'Drivhusgasser absorberer noget af varmestrålingen og overfører energien til luften. Noget af strålingen passerer direkte ud i rummet.', naeste: 'Atmosfæren stråler også', beskrivelse: 'Nogle røde strålingsspor fra jordoverfladen ender ved drivhusgasser i luften. Andre fortsætter ud i rummet. Gasserne er spredt i luften og danner ikke et fast låg.' },
  { navn: 'Atmosfæren stråler', kaede: 'VARM ATMOSFÆRE → STRÅLING I ALLE RETNINGER', spoergsmaal: 'Atmosfæren er også varm. Hvor stråler den hen?', tekst: 'Atmosfæren udsender selv varmestråling i alle retninger. Noget når rummet. Noget når jordoverfladen: atmosfærisk modstråling.', naeste: 'Undersøg drivhuseffekten', beskrivelse: 'Fra hvert drivhusgassymbol vises ny varmestråling både mod jordoverfladen og mod rummet, uafhængigt af den stråling, der absorberes. Nedadgående stråling absorberes ved jordoverfladen.' },
  { navn: 'Drivhuseffekten', kaede: 'SOLSTRÅLING + MODSTRÅLING → VARMERE JORDOVERFLADE', spoergsmaal: 'Hvorfor gør drivhusgasser jordoverfladen varmere?', tekst: 'Jordoverfladen modtager både solstråling og atmosfærisk modstråling. Derfor bliver den varmere end med samme solstråling uden drivhusgassernes virkning.', naeste: 'Begynd forfra', beskrivelse: 'Alle processer vises samlet. Med drivhusgassernes virkning modtager overfladen også modstråling og bliver varmere. Uden virkningen er solstrålingen den samme, men modstrålingen ophører, og overfladen bliver koldere.' },
];
let aktuelt = 0;
let sol = true;
let gas = true;
let pause = reduceret.matches;
let forklarSelv = false;
let tilstand = starttilstand();
let tid = 0;
let sidste = null;
let sidsteStatus = '';
let baner = [];
let overgang = 0;
let bredde = 1200;
let hoejde = 500;
// Få faste symboler og baner gør årsagskæden mulig at følge med øjnene.
const molekyler = [[650,222,-.15],[820,185,.2],[960,240,-.2]];
const svgNS = 'http://www.w3.org/2000/svg';
for (const [x,y,vinkel] of molekyler) {
  const gruppe = document.createElementNS(svgNS,'g');
  gruppe.setAttribute('transform',`translate(${x} ${y}) rotate(${vinkel * 55})`);
  // Symboler for drivhusgasser, ikke en målfast molekylefordeling.
  gruppe.innerHTML = '<circle r="22" fill="#fff9ee" fill-opacity=".65"/><path d="M-10 0H10" stroke="#6a9292" stroke-width="3"/><circle cx="-11" r="5" fill="#568887"/><circle r="6.5" fill="#355969"/><circle cx="11" r="5" fill="#568887"/>';
  $('molekyler').append(gruppe);
}

function overflade(x) {
  return 363 + 35 * ((x - 620) / 650) ** 2;
}
function gasAktiv() { return aktuelt >= 2 && gas; }
function tilpas() {
  const r = laerred.getBoundingClientRect();
  bredde = r.width; hoejde = r.height;
  const pixel = Math.min(devicePixelRatio || 1, 2);
  laerred.width = Math.round(bredde * pixel);
  laerred.height = Math.round(hoejde * pixel);
  pensel.setTransform(laerred.width / 1200, 0, 0, laerred.height / 500, 0, 0);
  // Kompensér for det brede lærred: sol og molekylsymboler bevarer formen.
  const forhold = (hoejde / 500) / (bredde / 1200);
  $('sol-tegning').setAttribute('transform', `translate(156 103) scale(${forhold} 1) translate(-156 -103)`);
  [...$('molekyler').children].forEach((gruppe, i) => {
    const [x,y,vinkel] = molekyler[i];
    gruppe.setAttribute('transform', `translate(${x} ${y}) scale(${forhold} 1) rotate(${vinkel * 55})`);
  });
  let solIndeks = 0;
  baner = baner.map(b => b.type === 'sol' ? solBane(solIndeks++) : b);
  tegn();
}
new ResizeObserver(tilpas).observe(laerred);

function bane(type, x, y, slutX, slutY, absorberes = false, forsinkelse = 0) {
  return { type, x, y, slutX, slutY, absorberes, forsinkelse };
}
function solBane(i) {
  // Skær den parallelle bane med den synlige solskive, også efter resize.
  // Start en anelse inden for kanten, så der ikke opstår et lyst mellemrum.
  const rx = 43 * (hoejde / 500) / (bredde / 1200), ry = 43;
  const forskydning = (i - 1) * 24;
  const a = 1 / rx ** 2 + .9 ** 2 / ry ** 2;
  const b = 2 * forskydning * .9 / ry ** 2;
  const c = forskydning ** 2 / ry ** 2 - 1;
  const t = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  const x = 156 + t, y = 103 + forskydning + .9 * t;
  let slutX = x + 250;
  for (let j = 0; j < 4; j++) slutX = x + (overflade(slutX) - y) / .9;
  return bane('sol', x, y, slutX, overflade(slutX), true, i * .12);
}
function forfyld() {
  baner = [];
  overgang = 0;
  if (sol) {
    // Parallelle solstråler; ingen vifte af projektiler fra et enkelt punkt.
    for (let i = 0; i < 3; i++) baner.push(solBane(i));
  }
  if (aktuelt >= 1) {
    if (gasAktiv()) {
      baner.push(bane('jord',565,overflade(565),650,222,true,.15));
      baner.push(bane('jord',925,overflade(925),960,240,true,.3));
      baner.push(bane('jord',1065,overflade(1065),1110,35,false,.45));
    } else {
      baner.push(bane('jord',565,overflade(565),505,72,false,.15));
      baner.push(bane('jord',745,overflade(745),755,44,false,.3));
      baner.push(bane('jord',1065,overflade(1065),1110,35,false,.45));
    }
  }
  if (aktuelt >= 3 && gasAktiv()) {
    // Hvert symbol udsender selvstændigt mod både jord og rum. De to viste
    // retninger er eksempler; udsendelsen udløses ikke af en ankommende bane.
    for (const [x,y] of molekyler) {
      baner.push(bane('luft',x,y,x-8,30,false,.6));
      baner.push(bane('luft',x,y,x+35,overflade(x+35),true,.6));
    }
  }
}
function opdaterUI() {
  const t=trin[aktuelt];
  $('trin-navn').textContent=t.navn;
  $('trin-overlinje').textContent=forklarSelv?'FORKLAR MED DINE EGNE ORD':t.kaede;
  $('spoergsmaal').textContent=forklarSelv?'Hvordan virker drivhuseffekten?':t.spoergsmaal;
  $('forklaring').textContent=forklarSelv?'Brug figuren til at forklare hele vejen fra Solens stråling til den varmere jordoverflade.':t.tekst;
  $('figur-beskrivelse').textContent=t.beskrivelse;
  $('naeste').innerHTML=`${t.naeste} <span aria-hidden="true">${aktuelt===4?'↺':'→'}</span>`;
  $('forrige').disabled=aktuelt===0;
  $('sol-knap').hidden=aktuelt!==1;
  $('sol-knap').textContent=sol?'Afskærm sollyset':'Lad sollyset komme ind igen';
  $('sol-knap').setAttribute('aria-pressed',String(!sol));
  $('gas-knap').hidden=aktuelt!==4;
  $('gas-knap').textContent=gas?'Uden drivhusgassernes virkning':'Med drivhusgassernes virkning';
  $('gas-knap').setAttribute('aria-pressed',String(!gas));
  $('forklar-knap').hidden=aktuelt!==4;
  $('forklar-knap').textContent=forklarSelv?'Vis forklaringer':'Forklar selv';
  $('forklar-knap').setAttribute('aria-pressed',String(forklarSelv));
  $('start-hint').hidden=aktuelt!==0;
  $('pause').textContent=pause?'▷ Fortsæt':'Ⅱ Pause';
  $('pause').setAttribute('aria-pressed',String(pause));
  $('jord-proces').hidden=aktuelt<1;
  $('gas-proces').hidden=aktuelt<2||!gas;
  $('mod-proces').hidden=aktuelt<3||!gas;
  $('ud-proces').hidden=aktuelt<3;
  $('sol-proces').hidden=!sol;
  $('sammenlign-maerke').hidden=aktuelt!==4||gas;
  $('atmosfaere-tegning').setAttribute('opacity',gasAktiv()?1:0);
  $('molekyler').setAttribute('opacity',gasAktiv()?'.8':0);
  $('solskaerm').setAttribute('opacity',sol?0:1);
  $('sol-tegning').setAttribute('opacity',sol?1:.55);
  document.body.classList.toggle('forklar-selv',forklarSelv);
  document.querySelectorAll('[data-trin]').forEach((b,i)=>{
    if(i===aktuelt)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
  });
  opdaterVarme();
}
function opdaterVarme() {
  const varme=Math.max(0,Math.min(1,(tilstand.jord-.82)/.35));
  $('overflade-varme').setAttribute('opacity',String(.08+varme*.8));
  $('varmesloer').setAttribute('opacity',String(.06+varme*.6));
  $('varmetekst').textContent=!sol?'køler af · udsender stadig varmestråling':aktuelt===4?(gas?'bliver varmere med modstråling':'bliver koldere uden modstråling'):'opvarmes af Solen';
  let status='';
  if(aktuelt===1)status=sol?'Prøv at afskærme sollyset. Varm jord stråler også uden lys.':'Sollyset er afskærmet. Jorden stråler stadig, men køler af og udsender efterhånden mindre.';
  if(aktuelt===2)status='Atmosfæren udsender også stråling. Det viser vi i næste trin.';
  if(aktuelt===3)status='Følg strålingen fra ét sted i luften: den udsendes i forskellige retninger.';
  if(aktuelt===4)status=gas?'Sammenlign med samme solstråling uden drivhusgassernes virkning.':'Solstrålingen er uændret. Uden modstråling køler overfladen gradvist af.';
  if(forklarSelv)status='';
  if(status!==sidsteStatus){$('observation').textContent=status;sidsteStatus=status;}
}
function vaelgTrin(n) {
  aktuelt=n;sol=true;gas=true;forklarSelv=false;tilstand=starttilstand();tid=0;
  // Start atmosfæretrinnene med en varm overflade, som allerede udsender.
  if(n>=2)tilstand.jord=1;
  if(n===4)udvikl(tilstand,200,true,true);
  forfyld();opdaterUI();tegn();
}
document.querySelectorAll('[data-trin]').forEach(b=>b.addEventListener('click',()=>vaelgTrin(+b.dataset.trin)));
$('naeste').addEventListener('click',()=>vaelgTrin((aktuelt+1)%trin.length));
$('forrige').addEventListener('click',()=>vaelgTrin(Math.max(0,aktuelt-1)));
$('nulstil').addEventListener('click',()=>vaelgTrin(aktuelt));
$('pause').addEventListener('click',()=>{pause=!pause;sidste=null;opdaterUI();});
$('sol-knap').addEventListener('click',()=>{sol=!sol;forfyld();opdaterUI();tegn();});
$('gas-knap').addEventListener('click',()=>{gas=!gas;forfyld();opdaterUI();tegn();});
$('forklar-knap').addEventListener('click',()=>{forklarSelv=!forklarSelv;opdaterUI();});
$('fokus').addEventListener('click',()=>{
  const aktiv=document.body.classList.toggle('fokus');
  $('fokus').textContent=aktiv?'Afslut fokusvisning ↙':'Fokusvisning ↗';
  $('fokus').setAttribute('aria-pressed',String(aktiv));
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&document.body.classList.contains('fokus'))$('fokus').click();
});
reduceret.addEventListener('change',e=>{if(e.matches){pause=true;opdaterUI();}});
if(new URLSearchParams(location.search).has('projektor'))$('fokus').click();

// Motion design: en vedvarende sammenhængende bane bærer forklaringen.
// Bølgernes fase og sollysets glans bevæger sig langs banen; intet drys af
// tilfældige partikler. Nye processer tegnes frem fra deres egen kilde.
function punktPaaBane(b, p, fase) {
  const dx=b.slutX-b.x, dy=b.slutY-b.y, laengde=Math.hypot(dx,dy);
  const amplitude=b.type==='sol'?0:3.2;
  const boelge=Math.sin(p*laengde/7-fase)*amplitude*Math.min(1,p*8,(1-p)*8);
  return {x:b.x+dx*p-dy/laengde*boelge,y:b.y+dy*p+dx/laengde*boelge};
}
function tegnBane(b, f) {
  const nyProces = b.type === 'sol' ? aktuelt === 0
    : b.type === 'jord' ? aktuelt === 1 || aktuelt === 2
    : aktuelt === 3;
  const synlig = pause || !nyProces ? 1 : Math.max(0,Math.min(1,(overgang-b.forsinkelse)/1.1));
  if (!synlig) return;
  const frem = 1-(1-synlig)**3;
  const gul=b.type==='sol';
  const farve=gul?'#ad760b':'#b94737';
  const styrke=gul?f.solInd:b.type==='jord'?f.jordUd:f.modstraaling;
  const fase=tid*1.7;
  const dx=b.slutX-b.x,dy=b.slutY-b.y;
  const vinkel=Math.atan2(dy,dx);
  pensel.save();
  pensel.lineCap='round';pensel.lineJoin='round';
  pensel.strokeStyle=farve;
  if (gul) {
    const glans = .18 + (tid * .12 % .64);
    const lys = pensel.createLinearGradient(b.x,b.y,b.slutX,b.slutY);
    lys.addColorStop(0,farve);
    lys.addColorStop(Math.max(0,glans-.18),farve);
    lys.addColorStop(glans,'#eac15f');
    lys.addColorStop(Math.min(1,glans+.18),farve);
    lys.addColorStop(1,farve);
    pensel.strokeStyle=lys;
  }
  pensel.globalAlpha=Math.min(.9,.65+styrke*.12);
  pensel.lineWidth=(gul?2.3:1.6)+Math.min(1.8,styrke)*.7;
  pensel.beginPath();
  for(let p=0;p<=frem+.002;p+=.003){
    const q=punktPaaBane(b,Math.min(p,frem),fase);
    if(p===0)pensel.moveTo(q.x,q.y);else pensel.lineTo(q.x,q.y);
  }
  pensel.stroke();
  // Kun endepilen viser retning. Ingen løse pile langs banen eller ved labels.
  pensel.strokeStyle=farve;
  for(const p of [frem]) {
    if(p>frem)continue;
    const q=punktPaaBane(b,p,fase);
    pensel.save();pensel.translate(q.x,q.y);pensel.rotate(vinkel);
    pensel.globalAlpha=.9;pensel.lineWidth=2.2;
    pensel.beginPath();pensel.moveTo(-8,-5);pensel.lineTo(0,0);pensel.lineTo(-8,5);pensel.stroke();
    pensel.restore();
  }
  if(b.absorberes && synlig===1){
    const radius=9+Math.sin(tid*1.6+b.forsinkelse)*2;
    const glod=pensel.createRadialGradient(b.slutX,b.slutY,0,b.slutX,b.slutY,radius*2);
    glod.addColorStop(0,gul?'#e9b23b66':'#c75d3d55');glod.addColorStop(1,'#ffffff00');
    pensel.globalAlpha=.8;pensel.fillStyle=glod;
    pensel.beginPath();pensel.ellipse(b.slutX,b.slutY,radius*2,radius,0,0,Math.PI*2);pensel.fill();
  }
  pensel.restore();
}
function tegn() {
  pensel.clearRect(0,0,1200,500);
  const f=energistroemme(tilstand,sol,gasAktiv());
  for(const b of baner)tegnBane(b,f);
}
function billede(nu) {
  if(sidste===null)sidste=nu;
  const dt=Math.min((nu-sidste)/1000,.05);sidste=nu;
  if(!pause&&!document.hidden){
    tid+=dt;overgang+=dt;
    udvikl(tilstand,dt,sol,gasAktiv());
    opdaterVarme();tegn();
  }
  requestAnimationFrame(billede);
}
vaelgTrin(0);tilpas();requestAnimationFrame(billede);
