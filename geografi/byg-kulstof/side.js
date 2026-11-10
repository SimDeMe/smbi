import {FORMER,STEDER,PROCESSER,krav,noegle,fremskridt,placer,hentData,gemData} from './model.js';
import {LANDSKAB} from './landskab.js';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',LAGRING='byg-kulstof.v2';
let t=hentData(null),valgt=null,hintTrin=0,hintSted=null,traek=null,ignorerKlik=null;
try{t=hentData(JSON.parse(localStorage.getItem(LAGRING)));}catch{}
const gem=()=>{try{localStorage.setItem(LAGRING,JSON.stringify(gemData(t)));}catch{}};
function besked(tekst,status=''){ $('besked').textContent=tekst;$('besked').className=status; }
function svgEl(navn,attrs={},tekst){const e=document.createElementNS(NS,navn);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(tekst!==undefined)e.textContent=tekst;return e;}
$('landskab').innerHTML=LANDSKAB;
const pile=svgEl('g',{id:'pile',class:'pile'}),stedLag=svgEl('g',{id:'sted-lag'});$('landskab').append(pile,stedLag);
for(const p of PROCESSER){
  const g=svgEl('g',{'data-proces':p.id});
  g.append(svgEl('path',{d:p.sti,fill:'none',stroke:'#874e30','stroke-width':7,'stroke-linecap':'round','marker-end':'url(#pilspids)',...(p.dobbelt?{'marker-start':'url(#pilspids)'}:{})}));pile.append(g);
  const o=document.createElement('option');o.value=p.id;o.textContent=p.navn;$('proces-valg').append(o);
}
const grupper=new Map();
for(const s of STEDER){
  const g=svgEl('g',{'data-sted':s.id,class:'sted',role:'button',tabindex:0});
  g.append(svgEl('title',{},s.navn),svgEl('path',{d:s.omraade,class:'sted-flade'}));
  const [x,y]=s.punkt,w=Math.max(168,Math.min(340,s.navn.length*14+26));
  const maerke=svgEl('g',{class:'maerke','pointer-events':'none'});
  maerke.append(svgEl('rect',{x:x-w/2,y:y-24,width:w,height:45,rx:13,class:'navnefelt'}),svgEl('text',{x,y:y+7,'text-anchor':'middle',class:'stednavn'},s.navn),svgEl('g',{class:'svar'}));
  g.append(maerke);g.onclick=()=>{if(valgt)saet(s.id,valgt);else besked(`${s.navn}: Vælg en kulstofform først, eller træk et kort hertil.`);};
  g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();g.dispatchEvent(new MouseEvent('click',{bubbles:true}));}};
  g.onpointerenter=()=>g.classList.add('over');g.onpointerleave=()=>g.classList.remove('over');
  stedLag.append(g);grupper.set(s.id,g);
}
function tegnSteder(){
  for(const s of STEDER){
    const g=grupper.get(s.id),former=krav(s,t.niveau);g.style.display=former.length?'':'none';if(!former.length)continue;
    const loeste=former.filter(f=>t.loest.has(noegle(s.id,f)));g.classList.toggle('faerdigt',loeste.length===former.length);
    g.setAttribute('aria-label',`${s.navn}. ${loeste.length} af ${former.length} former placeret${loeste.length?': '+loeste.map(f=>FORMER[f].navn).join(', '):''}.`);
    const svar=g.querySelector('.svar');svar.replaceChildren();
    const [x,y]=s.punkt,w=former.length>1?102:160,afstand=w+8,start=x-(former.length-1)*afstand/2;
    former.forEach((f,i)=>{
      const korrekt=t.loest.has(noegle(s.id,f)),cx=start+i*afstand;
      svar.append(svgEl('rect',{x:cx-w/2,y:y+28,width:w,height:36,rx:10,class:korrekt?'svar-rigtigt':'svar-tomt',...(korrekt?{fill:FORMER[f].farve}:{})}),svgEl('text',{x:cx,y:y+54,'text-anchor':'middle',class:'svartekst'},korrekt?FORMER[f].kort+' ✓':'?'));
    });
  }
  tegnGenveje();
}
function tegnGenveje(){
  $('steder').replaceChildren();
  for(const s of STEDER.filter(s=>krav(s,t.niveau).length)){
    const b=document.createElement('button');b.type='button';b.dataset.find=s.id;b.textContent=s.navn+(krav(s,t.niveau).every(f=>t.loest.has(noegle(s.id,f)))?' ✓':'');
    b.onclick=()=>visSted(s.id);$('steder').append(b);
  }
}
function tegnKort(){
  $('former').replaceChildren();
  for(const [id,f]of Object.entries(FORMER)){
    if(t.niveau==='C'&&f.niveau==='B')continue;
    const b=document.createElement('button');b.type='button';b.className='form-kort';b.dataset.form=id;b.style.setProperty('--formfarve',f.farve);b.setAttribute('aria-pressed',id===valgt);
    const navn=document.createElement('strong'),under=document.createElement('span');navn.textContent=f.navn;under.textContent=f.under;b.append(navn,under);
    b.onclick=()=>{if(ignorerKlik===b){ignorerKlik=null;return;}vaelg(id);};b.onpointerdown=e=>startTraek(e,id,b);$('former').append(b);
  }
}
function vaelg(id){
  valgt=id;for(const b of $('former').children)b.setAttribute('aria-pressed',b.dataset.form===id);
  besked(`${FORMER[id].navn} er valgt. Placér kortet på et element; du kan bruge det flere gange.`);
}
function status(){
  const p=fremskridt(t);$('fremskridt').textContent=`${t.niveau}-niveau · ${p.antal} af ${p.total} på plads`;
  $('faerdig').hidden=!p.faerdig;$('faerdig-titel').textContent=`${t.niveau}-modellen er bygget!`;
  $('faerdig-tekst').textContent=t.niveau==='C'?'Forklar, hvordan organisk kulstof bliver til CO₂. Fortsæt derefter til B-niveau, og undersøg flere opløste former i det samme havvand.':'Forklar forskellen på kulstoffet i havvand, organismer og fast kalk. Følg derefter kulstoffets vej med pilene.';
  $('fortsaet-b').hidden=t.niveau!=='C';$('hint').disabled=p.faerdig;
}
function skiftNiveau(n){
  t.niveau=n;if(valgt&&n==='C'&&FORMER[valgt].niveau==='B')valgt=null;
  for(const b of document.querySelectorAll('[data-niveau]'))b.setAttribute('aria-pressed',b.dataset.niveau===n);
  for(const e of document.querySelectorAll('[data-kun-b]'))e.hidden=n!=='B';
  hintTrin=0;hintSted=null;$('hint').textContent='Giv et hint';for(const g of grupper.values())g.classList.remove('hint');
  tegnKort();tegnSteder();status();visProces();gem();
  besked(n==='C'?'C-niveau: placér de tre bindingstyper i landskabet. Samme kort kan bruges flere steder.':'B-niveau: dine C-placeringer bliver stående. Havvandet skal nu have tre former, og floden får en ny plads.');
}
function saet(sted,form){
  const svar=placer(t,sted,form);if(svar.status==='ukendt')return;besked(svar.tekst,svar.status==='forkert'?'fejl':'korrekt');
  if(svar.status==='rigtig'){
    hintTrin=0;hintSted=null;$('hint').textContent='Giv et hint';for(const g of grupper.values())g.classList.remove('hint');tegnSteder();status();gem();
  }
}
function visSted(id){
  const g=grupper.get(id);g.focus({preventScroll:true});
  const r=g.querySelector('.navnefelt').getBoundingClientRect(),rum=$('landskabsrum').getBoundingClientRect();
  if(r.left<rum.left||r.right>rum.right)$('landskabsrum').scrollBy({left:(r.left+r.right-rum.left-rum.right)/2,behavior:'instant'});
  const toolbar=$('kort-bar').getBoundingClientRect();if(r.top<toolbar.bottom+8||r.bottom>innerHeight-20)window.scrollBy({top:r.top-toolbar.bottom-20,behavior:'instant'});
}
function startTraek(e,form,b){if(!e.isPrimary||e.button!==0)return;ignorerKlik=null;traek={form,x:e.clientX,y:e.clientY,id:e.pointerId,knap:b,aktiv:false};b.setPointerCapture(e.pointerId);}
function rydTraek(){$('traek-kort')?.remove();for(const g of grupper.values())g.classList.remove('over');traek=null;}
// Fælles pointerforløb giver samme træk på mus, pen og touch.
// Hit-test sker mod det faktiske element under kortet, også ved pointer capture.
document.addEventListener('pointermove',e=>{
  if(!traek||traek.id!==e.pointerId)return;
  if(!traek.aktiv&&Math.hypot(e.clientX-traek.x,e.clientY-traek.y)>6){
    traek.aktiv=true;valgt=traek.form;for(const b of $('former').children)b.setAttribute('aria-pressed',b.dataset.form===valgt);
    const ghost=document.createElement('div');ghost.id='traek-kort';ghost.textContent=FORMER[traek.form].navn;ghost.style.background=FORMER[traek.form].farve;document.body.append(ghost);
  }
  if(!traek.aktiv)return;
  e.preventDefault();const ghost=$('traek-kort');ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
  const under=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-sted]');for(const g of grupper.values())g.classList.toggle('over',g===under);
  const rum=$('landskabsrum'),r=rum.getBoundingClientRect();if(e.clientY>r.top&&e.clientY<r.bottom){if(e.clientX<r.left+25)rum.scrollLeft-=12;if(e.clientX>r.right-25)rum.scrollLeft+=12;}
},{passive:false});
document.addEventListener('pointerup',e=>{
  if(!traek||traek.id!==e.pointerId)return;
  if(traek.aktiv){ignorerKlik=traek.knap;e.preventDefault();const under=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-sted]');if(under)saet(under.dataset.sted,traek.form);else besked('Kortet blev ikke sat på et element. Vælg det og tryk på elementet, eller træk igen.');}
  rydTraek();
});
document.addEventListener('pointercancel',rydTraek);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){rydTraek();valgt=null;for(const b of $('former').children)b.setAttribute('aria-pressed','false');besked('Valget er fjernet.');}});
$('hint').onclick=()=>{
  const s=STEDER.find(s=>krav(s,t.niveau).some(f=>!t.loest.has(noegle(s.id,f))));if(!s)return;
  const form=krav(s,t.niveau).find(f=>!t.loest.has(noegle(s.id,f)));
  if(hintTrin&&hintSted===s.id){saet(s.id,form);return;}
  hintSted=s.id;hintTrin=1;$('hint').textContent='Vis svaret';grupper.get(s.id).classList.add('hint');visSted(s.id);besked(`Se på ${s.navn.toLowerCase()}. ${t.niveau==='B'&&s.tekstB?s.tekstB:s.tekst}`);
};
function visProces(){
  const vis=$('vis-processer').checked,id=$('proces-valg').value,p=PROCESSER.find(p=>p.id===id);pile.style.display=vis?'':'none';$('proces-valg-label').hidden=!vis;$('proces-forklaring').hidden=!vis||!p;
  for(const g of pile.children){g.classList.toggle('aktiv',g.dataset.proces===id);g.classList.toggle('daempet',Boolean(id)&&g.dataset.proces!==id);}
  if(p){$('proces-titel').textContent=p.navn;$('proces-tekst').textContent=t.niveau==='B'&&p.tekstB?p.tekstB:p.tekst;}
}
for(const b of document.querySelectorAll('[data-niveau]'))b.onclick=()=>skiftNiveau(b.dataset.niveau);
$('fortsaet-b').onclick=()=>{skiftNiveau('B');$('byg').scrollIntoView({block:'start',behavior:'instant'});};
$('vis-processer').onchange=visProces;$('proces-valg').onchange=visProces;
$('forfra').onclick=()=>{t.loest.clear();skiftNiveau(t.niveau);besked('Alle placeringer er ryddet. Byg landskabet igen.');};
$('fokus').onclick=()=>{const v=document.body.classList.toggle('fokus');$('fokus').setAttribute('aria-pressed',v);$('fokus').textContent=v?'Afslut fokus':'Fokus';};
$('zoom').onclick=()=>{const v=$('landskabsrum').classList.toggle('overblik');$('zoom').setAttribute('aria-pressed',v);$('zoom').textContent=v?'Vis stort landskab':'Vis overblik';};
if(window.top!==window.self){document.body.classList.add('fokus');$('fokus').setAttribute('aria-pressed','true');$('fokus').textContent='Afslut fokus';}
// De tidligere tre faners links viser nu det fælles landskab.
if(['#hurtig','#geologi','#mennesker'].includes(location.hash))history.replaceState(null,'','#landskab');
skiftNiveau(t.niveau);
