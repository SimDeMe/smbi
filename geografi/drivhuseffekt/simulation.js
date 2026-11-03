import { ABSORPTION, starttilstand, energistroemme, udvikl } from './model.mjs';

const $ = id => document.getElementById(id);
const scene = document.querySelector('.scene');
const laerred = $('straaling');
const pensel = laerred.getContext('2d');
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
const trin = [
  { navn: 'Solens energi', kaede: 'SOLEN → JORDEN', spoergsmaal: 'Hvordan bliver jorden varm?', tekst: 'Solens kortbølgede stråling absorberes ved jordoverfladen. Energien bliver til varme.', naeste: 'Jorden stråler også', beskrivelse: 'Gule strålingsspor bevæger sig fra Solen til jordoverfladen og absorberes. Overfladen opvarmes.' },
  { navn: 'Jorden stråler', kaede: 'VARM JORD → VARMESTRÅLING', spoergsmaal: 'Stråler jorden også uden sollys?', tekst: 'Den varme jord udsender langbølget varmestråling i alle retninger over overfladen. Jo varmere den er, desto mere udsender den.', naeste: 'Tilføj drivhusgasser', beskrivelse: 'Jordoverfladen udsender røde, bølgede spor i forskellige udadgående retninger. Udsendelsen fortsætter, når sollyset afskærmes; jorden køler da af og stråler mindre.' },
  { navn: 'Gasser absorberer', kaede: 'JORDENS VARMESTRÅLING → ATMOSFÆREN', spoergsmaal: 'Hvad sker der med jordens varmestråling?', tekst: 'Drivhusgasser absorberer noget af varmestrålingen og overfører energien til luften. Noget af strålingen passerer direkte ud i rummet.', naeste: 'Atmosfæren stråler også', beskrivelse: 'Nogle røde strålingsspor fra jordoverfladen ender ved drivhusgasser i luften. Andre fortsætter ud i rummet. Gasserne er spredt i luften og danner ikke et fast låg.' },
  { navn: 'Atmosfæren stråler', kaede: 'VARM ATMOSFÆRE → STRÅLING I ALLE RETNINGER', spoergsmaal: 'Atmosfæren er også varm. Hvor stråler den hen?', tekst: 'Atmosfæren udsender selv varmestråling i alle retninger. Noget når rummet. Noget når jordoverfladen: atmosfærisk modstråling.', naeste: 'Undersøg drivhuseffekten', beskrivelse: 'Atmosfæren udsender nye røde strålingsspor opad, nedad og til siderne, uafhængigt af de spor, der absorberes. Nedadgående stråling absorberes ved jordoverfladen.' },
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
let spor = [];
let glimt = [];
let solRest = 0;
let jordRest = 0;
let luftRest = 0;
let bredde = 1200;
let hoejde = 500;
const molekyler = [
  [355,238,-.2],[476,192,.4],[616,248,-.5],[745,172,.2],
  [879,255,-.3],[1027,211,.6],[520,289,-.6],[818,308,.3],
  [1088,310,-.2],[319,302,.3],[660,128,.7],[960,142,-.5],
];
const svgNS = 'http://www.w3.org/2000/svg';
for (const [x,y,vinkel] of molekyler) {
  const gruppe = document.createElementNS(svgNS,'g');
  gruppe.setAttribute('transform',`translate(${x} ${y}) rotate(${vinkel * 55})`);
  // Symboler for drivhusgasser, ikke en målfast molekylefordeling.
  gruppe.innerHTML = '<path d="M-10 0H10" stroke="#a6cecc" stroke-width="3"/><circle cx="-11" r="5" fill="#b9dad1"/><circle r="6.5" fill="#f0f1d8"/><circle cx="11" r="5" fill="#b9dad1"/>';
  $('molekyler').append(gruppe);
}

function overflade(x) {
  // Visuel tilnærmelse til den tegnede buede overflade.
  return 365 + 36 * ((x - 520) / 680) ** 2;
}
function gasAktiv() { return aktuelt >= 2 && gas; }
function tilpas() {
  const r = laerred.getBoundingClientRect();
  bredde = r.width; hoejde = r.height;
  const pixel = Math.min(devicePixelRatio || 1, 2);
  laerred.width = Math.round(bredde * pixel);
  laerred.height = Math.round(hoejde * pixel);
  pensel.setTransform(laerred.width / 1200, 0, 0, laerred.height / 500, 0, 0);
  // Kompensér for den brede figur, så Solen og molekylsymbolerne er runde.
  const forhold = (hoejde / 500) / (bredde / 1200);
  $('sol-tegning').setAttribute('transform', `translate(156 103) scale(${forhold} 1) translate(-156 -103)`);
  [...$('molekyler').children].forEach((gruppe, i) => {
    const [x,y,vinkel] = molekyler[i];
    gruppe.setAttribute('transform', `translate(${x} ${y}) scale(${forhold} 1) rotate(${vinkel * 55})`);
  });
  tegn();
}
new ResizeObserver(tilpas).observe(laerred);

function nytSpor(type, x, y, slutX, slutY, absorberes = false, alder = 0) {
  const afstand = Math.hypot(slutX-x,slutY-y);
  spor.push({ type,x,y,slutX,slutY,alder,levetid:afstand/(type==='sol'?190:125),absorberes,fase:Math.random()*Math.PI*2 });
}
function solSpor(alder=0) {
  const x = 300 + Math.random()*270;
  nytSpor('sol',185,128,x,overflade(x),true,alder);
}
function jordSpor(alder=0) {
  const absorberes = gasAktiv() && Math.random()<ABSORPTION;
  if (absorberes) {
    const m = molekyler[Math.floor(Math.random()*molekyler.length)];
    const x = Math.max(30,Math.min(1170,m[0]+(Math.random()-.5)*300));
    nytSpor('jord',x,overflade(x),m[0],m[1],true,alder);
  } else {
    const x = 160+Math.random()*880;
    const vinkel = -Math.PI/2 + (Math.random()-.5)*2.2;
    const afstand = 620;
    nytSpor('jord',x,overflade(x),x+Math.cos(vinkel)*afstand,overflade(x)+Math.sin(vinkel)*afstand,false,alder);
  }
}
function luftSpor(alder=0) {
  const m = molekyler[Math.floor(Math.random()*molekyler.length)];
  const vinkel = Math.random()*Math.PI*2;
  let x=m[0]+Math.cos(vinkel)*700, y=m[1]+Math.sin(vinkel)*700;
  let absorberes=false;
  if (Math.sin(vinkel)>.05) {
    // Find skæringen med overfladen, så modstråling absorberes dér.
    for(let a=0;a<700;a+=3) {
      const px=m[0]+Math.cos(vinkel)*a, py=m[1]+Math.sin(vinkel)*a;
      if(py>=overflade(px)) {x=px;y=py;absorberes=true;break;}
    }
  }
  nytSpor('luft',m[0],m[1],x,y,absorberes,alder);
}
function forfyld() {
  spor=[];glimt=[];solRest=jordRest=luftRest=0;
  if(sol)for(let i=0;i<9;i++)solSpor(Math.random()*1.4);
  if(aktuelt>=1)for(let i=0;i<13;i++)jordSpor(Math.random()*2.4);
  if(aktuelt>=3&&gasAktiv())for(let i=0;i<15;i++)luftSpor(Math.random()*2);
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

function tegnSpor(s) {
  const fremskridt=s.alder/s.levetid;
  if(fremskridt<0||fremskridt>1)return;
  const dx=s.slutX-s.x,dy=s.slutY-s.y;
  const vinkel=Math.atan2(dy,dx);
  const x=s.x+dx*fremskridt,y=s.y+dy*fremskridt;
  if(x< -40||x>1240||y< -40||y>530)return;
  const gul=s.type==='sol';
  const farve=gul?'#ffe4a0':'#ffad91';
  const laengde=gul?35:29;
  pensel.save();pensel.translate(x,y);pensel.rotate(vinkel);
  pensel.globalAlpha=Math.min(1,fremskridt*9+.15)*.9;
  pensel.lineWidth=gul?2.1:2; pensel.strokeStyle=farve;
  pensel.shadowColor=farve;pensel.shadowBlur=7;
  pensel.beginPath();
  if(gul){pensel.moveTo(-laengde,0);pensel.lineTo(0,0);}
  else for(let a=-laengde;a<=0;a+=1){const b=Math.sin(a*.45+s.fase)*3.2;if(a===-laengde)pensel.moveTo(a,b);else pensel.lineTo(a,b);}
  pensel.stroke();pensel.shadowBlur=0;
  // En lille pilespids gør retningen læsbar også ved pause.
  pensel.beginPath();pensel.moveTo(-5,-4);pensel.lineTo(1,0);pensel.lineTo(-5,4);pensel.stroke();
  pensel.restore();
}
function tegn() {
  pensel.clearRect(0,0,1200,500);
  for(const s of spor)tegnSpor(s);
  for(const g of glimt){
    pensel.beginPath();pensel.arc(g.x,g.y,3+g.alder*13,0,Math.PI*2);
    pensel.strokeStyle=g.type==='sol'?`rgba(255,227,151,${(1-g.alder)*.65})`:`rgba(255,178,148,${(1-g.alder)*.65})`;
    pensel.lineWidth=1.3;pensel.stroke();
  }
}
function billede(nu) {
  if(sidste===null)sidste=nu;
  const dt=Math.min((nu-sidste)/1000,.05);sidste=nu;
  if(!pause&&!document.hidden){
    tid+=dt;
    udvikl(tilstand,dt,sol,gasAktiv());
    const f=energistroemme(tilstand,sol,gasAktiv());
    solRest+=dt*(sol?5:0);jordRest+=dt*(aktuelt>=1?f.jordUd*5.5:0);luftRest+=dt*(aktuelt>=3?f.modstraaling*14:0);
    while(solRest>=1){solSpor();solRest--;}
    while(jordRest>=1){jordSpor();jordRest--;}
    while(luftRest>=1){luftSpor();luftRest--;}
    spor=spor.filter(s=>{
      s.alder+=dt;
      if(s.alder>=s.levetid){if(s.absorberes)glimt.push({x:s.slutX,y:s.slutY,type:s.type,alder:0});return false;}
      return s.x+(s.slutX-s.x)*s.alder/s.levetid>-80&&s.x+(s.slutX-s.x)*s.alder/s.levetid<1280&&s.y+(s.slutY-s.y)*s.alder/s.levetid>-80;
    });
    glimt=glimt.filter(g=>(g.alder+=dt*1.9)<1);
    opdaterVarme();tegn();
  }
  requestAnimationFrame(billede);
}
vaelgTrin(0);tilpas();requestAnimationFrame(billede);
