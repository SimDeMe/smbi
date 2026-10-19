import {nyModel, beregn, effektivVind, fase, havTilstand, begræns} from './model.mjs';

const $ = id => document.getElementById(id);
const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
let model = nyModel();
let kører = !reduceret.matches;
let afvigelse = false;
let historik = [{tid:0, temperatur:0, vind:1}];
let næsteMåling = 1;
let visuelTid = 0;
let sidsteBillede = null;
let sidsteGraf = 0;
let sidsteFase = '';
let valgtScenarie = 'neutral';
const format = (tal, decimaler=2) => (tal > .004 ? '+' : '') + (Math.abs(tal) < .004 ? 0 : tal).toLocaleString('da-DK', {minimumFractionDigits:decimaler, maximumFractionDigits:decimaler});

const begreber = {
  enso: {navn:'ENSO', kort:'Det koblede system: hav + atmosfære.', tekst:'ENSO står for El Niño–Southern Oscillation. Det er samspillet mellem havet og atmosfæren i det tropiske Stillehav. El Niño, La Niña og neutral er systemets tre faser. En ENSO-hændelse udvikler sig over måneder og kan påvirke vejret langt uden for Stillehavet.', tip:'Vælg en fase som startforsøg. Knapperne ændrer vinden; havet skal selv nå at reagere. Fasemærket følger temperaturen, ikke den knap, du vælger.'},
  elnino: {navn:'El Niño', kort:'Varmere overfladevand mod øst og i det centrale hav.', tekst:'Under El Niño er overfladevandet i det centrale og østlige tropiske Stillehav varmere end normalt. Passatvinden er typisk svækket, termoklinen ligger dybere i øst, og opvellingen af koldt vand er mindre effektiv. Området med kraftig tropisk regn flytter typisk østpå.', tip:'Vælg El Niño. Se det varme vand brede sig mod øst, termoklinen flade ud og regnområdet flytte sig.'},
  lanina: {navn:'La Niña', kort:'Koldere overfladevand mod øst og i det centrale hav.', tekst:'Under La Niña er overfladevandet i det centrale og østlige tropiske Stillehav koldere end normalt. Passatvinden er typisk stærkere. Mere varmt vand samles mod vest, mens opvelling og en mere overfladenær termoklin i øst gør det lettere for koldt vand at nå overfladen.', tip:'Vælg La Niña. Sammenlign termoklinens hældning og de opadgående pile med neutral tilstand.'},
  passat: {navn:'Passatvinde', kort:'Vinden skubber varmt overfladevand mod vest.', tekst:'Over det tropiske Stillehav blæser passatvindene normalt fra øst mod vest: fra Sydamerika mod Indonesien. Vinden driver overfladestrømme og er med til at samle varmt vand i den vestlige del af havet.', tip:'Træk vindskyderen ned. Svagere passatvind gør det lettere for varmt vand at flytte mod øst. Pile i luften viser den effektive vind; 100 % er modellens normale grundvind.'},
  opvelling: {navn:'Opvelling', kort:'Koldt, næringsrigt dybvand når overfladen.', tekst:'Opvelling er opstigning af vand fra dybet til overfladen. Langs Perus og Ecuadors kyst hjælper vinddrevet transport overfladevand væk, så koldt, næringsrigt vand kan stige op. Der findes også opvelling langs ækvator. Næringsstofferne understøtter plankton og fiskeri.', tip:'Følg de opadgående pile ved Sydamerika. Når termoklinen bliver dybere under El Niño, når mindre koldt, næringsrigt vand overfladen. Pilenes antal og længde viser den relative styrke.'},
  termoklin: {navn:'Termoklin', kort:'Overgangslaget mellem varmt og koldt vand.', tekst:'Termoklinen er det lag i havet, hvor temperaturen falder hurtigt med dybden. Normalt ligger den dybt i det vestlige tropiske Stillehav og tættere på overfladen i øst. Under El Niño bliver den typisk mindre skrå og dybere i øst.', tip:'Den lyse, stiplede linje markerer overgangslaget. Når den synker i øst, ligger det kolde vand længere fra overfladen. Figuren viser laget som en linje for at gøre bevægelsen tydelig.'},
  anomali: {navn:'Temperaturanomali', kort:'Forskellen fra det normale for sted og årstid.', tekst:'En anomali er en afvigelse fra en reference. En temperaturanomali på +2 °C betyder to grader varmere end normalt for stedet og årstiden — ikke en havtemperatur på to grader. Reelle ENSO-indeks bruger gennemsnit over bestemte havområder og tidsrum.', tip:'Skift fra Temperatur til Afvigelse over figuren. Skalaen skifter fra havtemperatur til forskellen fra modellens neutrale hav. Det store tal ved siden af figuren er den centrale temperaturafvigelse.'},
  walker: {navn:'Walker-cirkulationen', kort:'Luftens øst–vestgående kredsløb over troperne.', tekst:'Varmt vand i det vestlige Stillehav giver normalt fugtig luft, der stiger, danner skyer og giver regn. Luften bevæger sig østpå i højden og synker over det køligere østlige Stillehav. Passatvinden fører luft tilbage mod vest nær overfladen. Under El Niño svækkes og forskydes denne cirkulation.', tip:'De øvre pile viser luftens returbevægelse, og skyerne viser det idealiserede område med opstigende luft og regn. Følg, hvordan det flytter østpå, når havet bliver varmere mod øst.'},
  feedback: {navn:'Bjerknes-feedback', kort:'Hav og vind kan forstærke hinandens ændringer.', tekst:'Svagere passatvind kan varme det østlige Stillehav op. Så bliver temperaturforskellen mellem øst og vest mindre, hvilket kan svække vinden yderligere. Kæden kan også forstærke en afkøling. Det kaldes positiv feedback: positiv betyder forstærkende, ikke godt. Andre processer begrænser og afslutter hændelserne.', tip:'Åbn Samspil og modelvalg, og slå tilbagekoblingen til eller fra. Sammenlign forsøg med samme grundvind og samme varighed. Den langsomme varmebalance i modellen modvirker også ændringen.'},
  southern: {navn:'Southern Oscillation', kort:'ENSO-systemets udsving i lufttryk.', tekst:'Southern Oscillation er udsving i lufttryksforskellen mellem det østlige og vestlige tropiske Stillehav. Under El Niño er trykket typisk lavere mod øst og højere mod vest end normalt; under La Niña er tendensen omvendt. Lufttrykket hænger sammen med vind og tropisk nedbør.', tip:'Vind og regnområde repræsenterer atmosfærens del af samspillet her. Lufttryk og Southern Oscillation-indekset (SOI) beregnes ikke i denne model.'},
  tele: {navn:'Teleforbindelser', kort:'Ændringer ét sted kan påvirke vejret langt væk.', tekst:'Når tropisk havtemperatur og nedbør ændrer sig, ændres opvarmningen af atmosfæren. Det kan forskyde storstilede cirkulationsmønstre og påvirke vejrets sandsynligheder langt væk. Virkningerne afhænger af årstid og andre klimaforhold; et sted får ikke altid samme vejr ved hver El Niño.', tip:'Åbn Verden reagerer. Her vises typiske regionale tendenser, ikke præcise forudsigelser. ENSO er kun én blandt flere påvirkninger af vejret.'},
};

let guideTrin = -1;
const guide = ['enso','passat','termoklin','opvelling','feedback','tele'];
function forklar(nøgle, fraGuide=false) {
  const b = begreber[nøgle];
  if (!b) return;
  if (!fraGuide) guideTrin = -1;
  $('dialogkategori').textContent = fraGuide ? 'EN GUIDET TUR GENNEM STILLEHAVET' : 'FORSTÅ PROCESSEN';
  $('dialogtitel').textContent = b.navn;
  $('dialogtekst').textContent = b.tekst;
  $('dialogtip').textContent = b.tip;
  $('guide-trin').textContent = fraGuide ? `${guideTrin+1} / ${guide.length}` : '';
  $('guide-naeste').hidden = !fraGuide;
  $('guide-naeste').textContent = guideTrin === guide.length - 1 ? 'Klar til at undersøge ✓' : 'Næste →';
  if (!$('begrebsdialog').open) $('begrebsdialog').showModal();
}
document.querySelectorAll('[data-begreb]').forEach(knap => knap.addEventListener('click', () => forklar(knap.dataset.begreb)));
$('ordliste').innerHTML = Object.entries(begreber).map(([id,b]) => `<button data-ord="${id}">${b.navn}<b>↗</b><small>${b.kort}</small></button>`).join('');
$('ordliste').addEventListener('click', e => {const knap=e.target.closest('[data-ord]'); if(knap) forklar(knap.dataset.ord);});
$('luk-dialog').onclick = () => $('begrebsdialog').close();
$('begrebsdialog').addEventListener('click', e => { if(e.target === $('begrebsdialog')) {const r=e.target.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) e.target.close();} });
$('guide').onclick = () => {guideTrin=0;forklar(guide[0],true);};
$('guide-naeste').onclick = () => {if(++guideTrin >= guide.length) $('begrebsdialog').close();else forklar(guide[guideTrin],true);};

function afspilningsknap() { $('afspil').textContent = kører ? 'Ⅱ Pause' : '▶ Start'; }
function vælgScenarie(navn) {
  valgtScenarie = navn;
  const vind = {varm:.45,neutral:1,kold:1.55}[navn];
  model = nyModel(vind,$('feedback').checked);
  historik = [{tid:0,temperatur:0,vind}];
  næsteMåling = 1;
  sidsteFase = '';
  $('vind').value = vind * 100;
  $('vindpust').disabled = false;
  document.querySelectorAll('[data-scenarie]').forEach(b => {const aktiv=b.dataset.scenarie===navn;b.classList.toggle('valgt',aktiv);b.setAttribute('aria-pressed',String(aktiv));});
  opdater();tegnGraf();
}
document.querySelectorAll('[data-scenarie]').forEach(b => b.onclick = () => vælgScenarie(b.dataset.scenarie));
$('afspil').onclick = () => {kører=!kører;afspilningsknap();};
$('frem').onclick = () => {kører=false;afspilningsknap();frem(1);opdater();tegnGraf();};
$('nulstil').onclick = () => { $('feedback').checked=true;vælgScenarie('neutral');};
$('vind').addEventListener('input', () => {
  model.grundvind=Number($('vind').value)/100;
  valgtScenarie=null;
  document.querySelectorAll('[data-scenarie]').forEach(b=>{b.classList.remove('valgt');b.setAttribute('aria-pressed','false');});
  opdater();
});
$('feedback').onchange = () => {model.feedback=$('feedback').checked;opdater();};
$('vindpust').onclick = () => {model.pustTil=model.tid+2;opdater();};
for(const [id,tilstand] of [['temperatur',false],['anomali',true]]) $(id).onclick = () => {
  afvigelse=tilstand;
  for(const [knap,aktiv] of [['temperatur',!tilstand],['anomali',tilstand]]) {$(knap).classList.toggle('valgt',aktiv);$(knap).setAttribute('aria-pressed',String(aktiv));}
  $('skala-kold').textContent=tilstand?'−3 °C':'16 °C';$('skala-varm').textContent=tilstand?'+3 °C':'30 °C';
  document.querySelector('.skala i').style.background=tilstand?'linear-gradient(90deg,#246a9c,#f0ebce,#d35c3c)':'';
};
function frem(dt) {
  const mål=model.tid+dt;
  while(model.tid < mål-1e-8) {
    const slut=Math.min(mål,næsteMåling);
    beregn(model,slut-model.tid);
    if(model.tid>=næsteMåling-1e-8) {historik.push({tid:næsteMåling,temperatur:model.temperatur,vind:effektivVind(model)});næsteMåling++;}
  }
}
function opdater() {
  $('vindtal').textContent=`${Math.round(model.grundvind*100)} %`;
  $('tid').textContent=`Måned ${Math.floor(model.tid+1e-7)}`;
  $('anomalital').textContent=format(model.temperatur);
  $('anomalital').style.color = model.temperatur>.5?'#b34524':model.temperatur<-.5?'#08699c':'#172d38';
  const nuværende=fase(model);
  $('fase').textContent=nuværende+' ↗';
  $('fasemarkør').style.left=`${begræns(50+model.temperatur*20,2,98)}%`;
  $('effektivvind').textContent=`Effektiv vind lige nu: ${Math.round(effektivVind(model)*100)} % af normal. Negative værdier betyder vind mod øst.`;
  $('vindpust').disabled=model.tid<model.pustTil;
  $('puststatus').textContent=model.tid<model.pustTil?`Vindpust aktivt: ${(model.pustTil-model.tid).toLocaleString('da-DK',{maximumFractionDigits:1})} modelmåneder tilbage.`:'Et kort skub mod øst — modsat passatvinden.';
  // Skærmlæserens procestekst opdateres kun ved faseskift.
  if(nuværende!==sidsteFase) {
    sidsteFase=nuværende;
    $('forklaring').textContent={
      'El Niño':'Varmen breder sig mod øst. Termoklinen ligger dybere ved Sydamerika, og mindre koldt vand når overfladen.',
      'La Niña':'Varmen samles mod vest. Termoklinen ligger tættere på overfladen i øst, og mere koldt vand stiger op.',
      'Neutral':'Passatvinden samler normalt varmt vand mod vest. Ved Sydamerika stiger koldt vand op. Dine indgreb kan ændre balancen.'
    }[nuværende];
    opdaterVerden();
  }
}

// Canvas tegnes i et logisk koordinatsystem, så figuren følger sin beholder.
const canvas=$('hav');
const ctx=canvas.getContext('2d');
const felt=document.createElement('canvas');felt.width=140;felt.height=60;
const fc=felt.getContext('2d');
let w=1000,h=360;
const resize = new ResizeObserver(() => { const r=canvas.getBoundingClientRect(); const dpr=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0); });
resize.observe(canvas);
const bland=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*begræns(t,0,1)));
function farve(temp) {
  if(afvigelse) return temp<0?bland([242,236,209],[35,105,155],-temp/3):bland([242,236,209],[210,86,53],temp/3);
  const stop=[[15,[24,69,105]],[21,[49,139,159]],[25,[129,186,178]],[27,[237,211,140]],[30,[235,112,69]]];
  for(let i=1;i<stop.length;i++) if(temp<stop[i][0]) return bland(stop[i-1][1],stop[i][1],(temp-stop[i-1][0])/(stop[i][0]-stop[i-1][0]));
  return stop.at(-1)[1];
}
function vandtemperatur(x,dybde,tilstand) {
  const thermo=tilstand.vestDybde+(tilstand.østDybde-tilstand.vestDybde)*x;
  const overflade=tilstand.vestTemperatur+(tilstand.østTemperatur-tilstand.vestTemperatur)*x;
  const varm=1/(1+Math.exp((dybde-thermo)/17));
  return 15.5+(overflade-15.5)*varm;
}
const neutralHav=havTilstand(nyModel());
function pil(x1,y1,x2,y2,farve='#315f71',bredde=1.5) {
  const a=Math.atan2(y2-y1,x2-x1),l=5;
  ctx.strokeStyle=farve;ctx.lineWidth=bredde;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.moveTo(x2-l*Math.cos(a-.5),y2-l*Math.sin(a-.5));ctx.lineTo(x2,y2);ctx.lineTo(x2-l*Math.cos(a+.5),y2-l*Math.sin(a+.5));ctx.stroke();
}
function tegnHav() {
  if(!ctx||!fc) return;
  const s=havTilstand(model),a=model.temperatur;
  const top=h*.47,bund=h-12,venstre=w*.065,højre=w*.945,vidde=højre-venstre;
  ctx.clearRect(0,0,w,h);
  const himmel=ctx.createLinearGradient(0,0,0,top);himmel.addColorStop(0,'#f0f3eb');himmel.addColorStop(1,'#deece6');ctx.fillStyle=himmel;ctx.fillRect(0,0,w,top+4);
  const data=fc.createImageData(felt.width,felt.height);
  for(let y=0;y<felt.height;y++) for(let x=0;x<felt.width;x++) {
    const pos=x/(felt.width-1),dybde=y/(felt.height-1)*300;
    const temperatur=vandtemperatur(pos,dybde,s);
    const farver=farve(afvigelse?temperatur-vandtemperatur(pos,dybde,neutralHav):temperatur);
    const i=(y*felt.width+x)*4;data.data[i]=farver[0];data.data[i+1]=farver[1];data.data[i+2]=farver[2];data.data[i+3]=255;
  }
  fc.putImageData(data,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(felt,venstre,top,vidde,bund-top);
  // Kysterne afgrænser modellen geografisk uden at udgive sig for et kort.
  ctx.fillStyle='#b8ba97';ctx.strokeStyle='#637f6b';ctx.lineWidth=1;
  for(const side of [0,1]) {const x=side?højre:venstre,retning=side?1:-1;ctx.beginPath();ctx.moveTo(x,top+7);ctx.lineTo(x+retning*w*.02,top-18);ctx.lineTo(x+retning*w*.035,top-12);ctx.lineTo(x+retning*w*.065,top-40);ctx.lineTo(x+retning*w*.09,top-30);ctx.lineTo(x+retning*w*.09,bund);ctx.lineTo(x,bund);ctx.closePath();ctx.fill();ctx.stroke();}
  // Overflade og dybdeskala.
  ctx.beginPath();ctx.strokeStyle='#1a5965';ctx.lineWidth=1.3;
  for(let x=venstre;x<=højre;x+=3) {const y=top+Math.sin((x/w)*65-visuelTid*1.7)*1.1;x===venstre?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
  ctx.font='9px "IBM Plex Mono",monospace';ctx.fillStyle='#426775';ctx.fillText('0 m',5,top-7);
  ctx.strokeStyle='#ffffff18';ctx.lineWidth=1;for(let d=100;d<=200;d+=100){const y=top+(bund-top)*d/300;ctx.beginPath();ctx.moveTo(venstre,y);ctx.lineTo(højre,y);ctx.stroke();}
  // Termoklinens dybde beregnes fra havtilstanden.
  ctx.save();ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.strokeStyle='#ffffe3';ctx.beginPath();ctx.moveTo(venstre,top+(bund-top)*s.vestDybde/300);ctx.lineTo(højre,top+(bund-top)*s.østDybde/300);ctx.stroke();ctx.restore();
  // Overfladens strømspor følger den effektive vind, men er ikke målte hastigheder.
  const vind=effektivVind(model);
  // Svag vind tillader en illustrativ østgående omfordeling af det varme vand.
  const overfladestrøm=vind-.7;
  ctx.save();ctx.beginPath();ctx.rect(venstre,top+2,vidde,bund-top-2);ctx.clip();
  for(let i=0;i<25;i++) {const position=((i/25-visuelTid*.035*overfladestrøm)%1+1)%1;const x=venstre+vidde*position,y=top+13+(i%3)*7;pil(x,y,x-15*overfladestrøm,y,'#fff8df99',1.1);}
  const antal=Math.max(1,Math.round(2+s.opvelling*2));
  for(let i=0;i<antal;i++) {const x=højre-13-i*12;const nederst=top+(bund-top)*.65;const længde=begræns((bund-top)*.4*s.opvelling,8,(bund-top)*.58);pil(x,nederst,x,nederst-længde,'#d6f6f4cc',1.7);}
  ctx.restore();
  // Passatvind og returstrøm i Walker-cirkulationen.
  const vindY=top*.71;
  for(let i=0;i<5;i++) {const x=w*(.25+i*.135)+Math.sin(visuelTid*.8)*3;pil(x+15*vind,vindY,x-15*vind,vindY,'#315e6d',Math.max(1,Math.abs(vind)*1.7));}
  const regnX=venstre+vidde*s.regnX;
  const retur=begræns(vind,-.5,1.5);
  for(let i=0;i<3;i++) {const x=w*(.38+i*.14);pil(x-12*retur,top*.30,x+12*retur,top*.30,'#809ba2',1);}
  pil(regnX,top*.68,regnX,top*.23,'#809ba2',1);
  pil(w*.82,top*.24,w*.82,top*.64,'#809ba2',1);
  // Regnområdet flytter med det varme vand.
  ctx.fillStyle='#fafff6';ctx.strokeStyle='#8ca7a6';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(regnX,top*.54,26,11,0,0,Math.PI*2);ctx.ellipse(regnX-14,top*.56,16,9,0,0,Math.PI*2);ctx.ellipse(regnX+16,top*.56,17,9,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#5c8d9f';for(let i=0;i<6;i++){const rx=regnX-19+i*8;const ry=top*.65+((visuelTid*12+i*4)%15);ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-3,ry+7);ctx.stroke();}
  // Etiketter supplerer farverne og er læselige på mobil.
  ctx.font=`600 ${w<450?10:12}px Archivo,Arial`;ctx.textAlign='center';
  ctx.fillStyle='#433f2c';if(!afvigelse)ctx.fillText('Varmt overfladevand',venstre+vidde*.3,top+35);
  ctx.fillStyle='#dbf0ee';ctx.fillText(afvigelse?'Afvigelse fra det neutrale hav':'Koldere dybvand',venstre+vidde*.5,bund-17);
  ctx.textAlign='left';
}
if(!ctx) canvas.insertAdjacentHTML('afterend','<p>Din browser kan ikke vise havfiguren. Brug temperaturtallet, grafen og procesteksten til at følge forsøget.</p>');

function tegnGraf() {
  const nu={tid:model.tid,temperatur:model.temperatur};
  const start=Math.max(0,model.tid-60),slut=Math.max(24,model.tid);
  const målinger=historik.filter(p=>p.tid>=start).concat([nu]);
  const max=Math.max(2,...målinger.map(p=>Math.abs(p.temperatur)+.3));
  const bredde=Math.max(340,Math.min(1000,$('graf').clientWidth || 1000));
  const højre=bredde-20, venstre=45, vidde=højre-venstre;
  $('graf').setAttribute('viewBox',`0 0 ${bredde} 180`);
  const x=t=>venstre+(t-start)/(slut-start)*vidde;
  const y=t=>85-t/max*63;
  let svg='<title>Temperaturafvigelse over tid, modelværdier</title>';
  svg+=`<rect x="${venstre}" y="${y(.5)}" width="${vidde}" height="${y(-.5)-y(.5)}" fill="#e1e5d4"/>`;
  for(const temp of [-2,-1,0,1,2]) if(Math.abs(temp)<=max) svg+=`<line x1="${venstre}" y1="${y(temp)}" x2="${højre}" y2="${y(temp)}" stroke="${temp===0?'#718481':'#d5d9ce'}" ${temp===0?'stroke-dasharray="5 5"':''}/><text x="${venstre-12}" y="${y(temp)+4}" text-anchor="end" font-size="11" fill="#52676e">${temp>0?'+':''}${temp}</text>`;
  svg+='<text x="14" y="17" font-size="11" fill="#52676e">°C</text>';
  for(let i=0;i<=6;i++){const t=start+(slut-start)*i/6;svg+=`<text x="${x(t)}" y="166" text-anchor="middle" font-size="11" fill="#52676e">${Math.round(t)}</text>`;}
  svg+=`<text x="${højre}" y="17" text-anchor="end" font-size="10" fill="#52676e">MODEL · MÅNEDER</text>`;
  svg+=`<path d="${målinger.map((p,i)=>`${i?'L':'M'}${x(p.tid).toFixed(2)},${y(p.temperatur).toFixed(2)}`).join(' ')}" fill="none" stroke="#087bb4" stroke-width="2.5"/><circle cx="${x(nu.tid)}" cy="${y(nu.temperatur)}" r="4" fill="#087bb4"/>`;
  $('graf').innerHTML=svg;
  $('graf').setAttribute('aria-label',`Temperaturafvigelse fra måned ${Math.round(start)} til ${Math.round(slut)}. Aktuel afvigelse: ${format(model.temperatur)} °C.`);
}
function opdaterVerden() {
  const tilstand=fase(model);
  const tekster=tilstand==='El Niño'?[
    ['Indonesien & Australien','Typisk tørrere','Øget tendens til tørke i dele af regionen.'],
    ['Peru & Ecuador','Typisk vådere','Mere regn og risiko for oversvømmelser langs dele af kysten.'],
    ['Perus fiskeri','Færre næringsstoffer','Svagere tilførsel af koldt, næringsrigt vand kan påvirke fødekæden.'],
    ['Det sydlige USA','Ofte vådere vinter','En forskudt jetstrøm kan øge vinternedbøren.'],
  ]:tilstand==='La Niña'?[
    ['Indonesien & Australien','Typisk vådere','Øget tendens til kraftig regn i dele af regionen.'],
    ['Peru & Ecuador','Typisk tørrere','Mindre regn langs dele af kysten; ikke samme respons overalt.'],
    ['Perus fiskeri','Mere opvelling','Mere koldt, næringsrigt vand kan understøtte produktionen. Andre forhold spiller også ind.'],
    ['Det sydlige USA','Ofte tørrere vinter','Øget tendens til mindre vinternedbør.'],
  ]:[
    ['Indonesien & Australien','Intet ENSO-signal','Andre klimaforhold og årstiden har stadig betydning.'],
    ['Peru & Ecuador','Intet ENSO-signal','Neutral betyder ikke, at vejret er uden udsving.'],
    ['Perus fiskeri','Normal modelopvelling','Koldt vand tilfører næringsstoffer til overfladen.'],
    ['Det sydlige USA','Intet ENSO-signal','ENSO giver ikke en tydelig fasebestemt tendens her.'],
  ];
  $('regioner').innerHTML=tekster.map(([sted,tendens,tekst])=>`<article><h3>${sted}</h3><span>${tendens}</span><p>${tekst}</p></article>`).join('');
  $('verdensfase').textContent=tilstand==='Neutral'?'I neutral tilstand er der ikke noget El Niño- eller La Niña-signal her.':`Modellen viser ${tilstand}. Her er nogle typiske tendenser ved en vedvarende hændelse.`;
  $('varmefelt').setAttribute('fill',tilstand==='La Niña'?'#4f9cba':tilstand==='El Niño'?'#ee8a58':'#a7c9c4');
}
const faner=[...document.querySelectorAll('[role=tab]')];
function vælgFane(knap) {
  faner.forEach(b=>{const valgt=b===knap;b.setAttribute('aria-selected',String(valgt));b.tabIndex=valgt?0:-1;$(b.getAttribute('aria-controls')).hidden=!valgt;});
  if(knap.id==='tab-forloeb')tegnGraf();
}
faner.forEach((b,i)=>{b.onclick=()=>vælgFane(b);b.onkeydown=e=>{let n;if(e.key==='ArrowRight')n=(i+1)%faner.length;else if(e.key==='ArrowLeft')n=(i+faner.length-1)%faner.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=faner.length-1;else return;e.preventDefault();vælgFane(faner[n]);faner[n].focus();};});
$('eksport').onclick = () => {
  const rækker=historik.concat([{tid:model.tid,temperatur:model.temperatur,vind:effektivVind(model)}]).filter((p,i,alle)=>!i||Math.abs(p.tid-alle[i-1].tid)>1e-7);
  const csv='\uFEFF# Idealiseret ENSO-undervisningsmodel v1; ikke observationer\nMåned;Temperaturafvigelse (°C);Effektiv vind (% af normal)\n'+rækker.map(p=>[p.tid.toFixed(2),p.temperatur.toFixed(4),(p.vind*100).toFixed(2)].map(x=>x.replace('.',',')).join(';')).join('\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='enso-modelmaalinger.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
};
function fokus() {
  const aktiv=document.body.classList.toggle('fokus');$('fokus').setAttribute('aria-pressed',String(aktiv));
  if(aktiv){const b=document.createElement('button');b.id='fokus-retur';b.textContent='↙ Forlad fokusvisning';b.onclick=fokus;document.body.append(b);b.focus();}else{$('fokus-retur')?.remove();$('fokus').focus();}
}
$('fokus').onclick=fokus;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('begrebsdialog').open&&document.body.classList.contains('fokus'))fokus();});
if(new URLSearchParams(location.search).get('projektor')==='1')fokus();
reduceret.addEventListener('change',e=>{if(e.matches){kører=false;afspilningsknap();}});
function billede(nu) {
  const dt=sidsteBillede===null?0:Math.min((nu-sidsteBillede)/1000,.1);sidsteBillede=nu;
  if(!document.hidden) {
    if(kører){frem(dt*.75*Number($('tempo').value));if(!reduceret.matches)visuelTid+=dt;opdater();}
    tegnHav();
    if(nu-sidsteGraf>250){if(!$('forloeb').hidden)tegnGraf();sidsteGraf=nu;}
  }
  requestAnimationFrame(billede);
}
afspilningsknap();vælgScenarie('neutral');requestAnimationFrame(billede);
