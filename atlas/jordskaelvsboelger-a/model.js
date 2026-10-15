import { VP, VS, FAKTOR, stationer, ankomst, radius, signal } from './fysik.mjs';
const $ = s => document.querySelector(s);
const svgNS = 'http://www.w3.org/2000/svg';
function el(n, a={}, txt) {const e=document.createElementNS(svgNS,n);for(const [k,v]of Object.entries(a))e.setAttribute(k,v);if(txt!==undefined)e.textContent=txt;return e;}
const reduceret=matchMedia('(prefers-reduced-motion: reduce)').matches;
let kilde={x:365,y:240},dybde=0,tid=0,koerer=false,loest=false,sag=1,rum='kort',medium='fast',boelgepause=reduceret,fase=0;
let deltaer=[20,20,20],gaet={x:400,y:260};
const tal=(v,n=1)=>v.toLocaleString('da-DK',{minimumFractionDigits:n,maximumFractionDigits:n});
const maalinger=()=>stationer.map(s=>ankomst(kilde,s,dybde));
// Konturerne er rent skematiske og bruger ingen geografiske data.
for(let j=0;j<8;j++){
 let d='';for(let i=0;i<=100;i++){const a=i/100*2*Math.PI,r=36+j*22;const x=530+Math.cos(a)*(r*1.5+12*Math.sin(a*3)),y=280+Math.sin(a)*(r+8*Math.cos(a*4));d+=(i?'L':'M')+x+','+y;}d+='Z';$('#terraen').append(el('path',{d,fill:j===7?'#dbe4d6':'none',stroke:'#c2cebb','stroke-width':1,opacity:.65}));
}
// Reversér så den yderste fyldte kontur ligger bag de øvrige.
$('#terraen').prepend($('#terraen').lastChild);
for(const s of stationer){const g=el('g');g.append(el('path',{d:`M${s.x} ${s.y-13}l-12 23h24Z`,fill:s.farve,stroke:'#fff9ee','stroke-width':2}));g.append(el('text',{x:s.x+18,y:s.y+5,fill:s.farve,'font-family':'Archivo,sans-serif','font-size':26,'font-weight':700},s.navn));$('#stationer').append(g);}
$('#spor').innerHTML=stationer.map((s,i)=>`<div class="station" style="--farve:${s.farve}"><div class="stationhoved"><span class="stationsbogstav">${s.navn}</span><span>Seismogram · tid efter brud (s)</span><output id="afstand-${i}"></output></div><svg class="seismo" id="seismo-${i}" viewBox="0 0 430 52" preserveAspectRatio="none" role="img" aria-label="Seismogram for station ${s.navn}"></svg><div class="indstilling"><label for="delta-${i}">S−P <input id="delta-${i}" type="number" min="0" max="90" step="0.1" value="20" aria-label="S minus P i sekunder, station ${s.navn}"> s</label><input id="skyder-${i}" type="range" min="0" max="90" step="0.1" value="20" aria-label="S minus P i sekunder, station ${s.navn}"></div></div>`).join('');
stationer.forEach((s,i)=>{
 const ret=e=>{const v=Number(e.target.value);if(!Number.isFinite(v)||v<0||v>90)return;deltaer[i]=v;$(`#delta-${i}`).value=v;$(`#skyder-${i}`).value=v;tegnKort();};
 $(`#delta-${i}`).addEventListener('input',ret);$(`#skyder-${i}`).addEventListener('input',ret);
});
function tegnSpor(){
 const data=maalinger();data.forEach((m,i)=>{
 const svg=$(`#seismo-${i}`);svg.replaceChildren();
 for(let t=0;t<=180;t+=30){const x=12+t/180*406;svg.append(el('path',{d:`M${x} 2V36`,stroke:'#d8d9ce','stroke-width':.8}));svg.append(el('text',{x,y:50,'text-anchor':'middle',fill:'#506067','font-family':'IBM Plex Mono,monospace','font-size':11},t));}
 svg.append(el('path',{d:'M12 21H418',stroke:'#c6ccbf','stroke-width':.8}));
 let d='';for(let n=0;n<=1200;n++){const t=n/1200*180;d+=(n?'L':'M')+(12+t/180*406)+','+(21-15*signal(t,m.p,m.s));}svg.append(el('path',{d,fill:'none',stroke:'#172d39','stroke-width':1.1}));
 if($('#ankomster').checked||loest){for(const [v,navn,farve]of [[m.p,'P','#006e78'],[m.s,'S','#b3472d']]){let x=12+v/180*406;svg.append(el('path',{d:`M${x} 1V36`,stroke:farve,'stroke-width':1,'stroke-dasharray':'3 2'}));svg.append(el('text',{x:x+3,y:11,fill:farve,'font-family':'IBM Plex Mono,monospace','font-size':10},`${navn} ${tal(v)} s`));}}
 svg.setAttribute('aria-label',`Syntetisk seismogram, station ${stationer[i].navn}. `+(($('#ankomster').checked||loest)?`P ankommer ${tal(m.p)} s, S ${tal(m.s)} s.`:'Ankomsttider kan vises med knappen Vis ankomsttider.'));
 });tegnUr();
}
function tegnUr(){document.querySelectorAll('.ur').forEach(e=>e.remove());if(tid>0)stationer.forEach((_,i)=>$(`#seismo-${i}`).append(el('path',{class:'ur',d:`M${12+tid/180*406} 1V36`,stroke:'#3060a9','stroke-width':1.4})));}
function tegnKort(){
 const ringe=$('#ringe');ringe.replaceChildren();stationer.forEach((s,i)=>{const r=radius(deltaer[i],dybde);$(`#afstand-${i}`).textContent=r===null?'L < h':`${tal(r,0)} km`;if(r!==null)ringe.append(el('circle',{cx:s.x,cy:s.y,r,fill:s.farve,'fill-opacity':.035,stroke:s.farve,'stroke-width':2,'stroke-dasharray':i===1?'9 4':i===2?'3 4':'none'}));});
 const g=$('#markoerer');g.replaceChildren();
 g.append(el('path',{d:`M${gaet.x-9} ${gaet.y}h18M${gaet.x} ${gaet.y-9}v18`,stroke:'#172d39','stroke-width':2}));g.append(el('circle',{cx:gaet.x,cy:gaet.y,r:14,fill:'none',stroke:'#172d39','stroke-width':1}));
 if(loest){g.append(el('circle',{cx:kilde.x,cy:kilde.y,r:8,fill:'#f7cc68',stroke:'#172d39','stroke-width':2}));g.append(el('text',{x:kilde.x+13,y:kilde.y-12,fill:'#172d39','font-family':'Archivo,sans-serif','font-size':15,'font-weight':700},'Epicenter'));}
 tegnFronter();
 const m=maalinger()[0],sx=65,ex=230,sy=25,fy=sy+dybde*1.6;
 $('#snit').replaceChildren(el('path',{d:`M20 ${sy}H460M${sx} ${sy}L${ex} ${fy}V${sy}`,fill:'none',stroke:'#172d39','stroke-width':1.5}),el('circle',{cx:ex,cy:fy,r:4,fill:'#b3472d'}),el('text',{x:ex+8,y:sy-8,'font-size':12},'Epicenter'),el('text',{x:ex+8,y:fy+17,'font-size':12},`Fokus · h = ${dybde} km`),el('text',{x:sx-15,y:sy-8,'font-size':12},'Station A'),el('text',{x:115,y:fy+20,'font-size':12},`L = ${tal(m.vej,0)} km`));
}
function tegnFronter(){
 $('#fronter').replaceChildren();if(tid>0){for(const [v,c,d]of [[VP,'#006e78',''],[VS,'#b3472d','8 5']]){const r2=(v*tid)**2-dybde**2;if(r2>=0)$('#fronter').append(el('circle',{cx:kilde.x,cy:kilde.y,r:Math.sqrt(r2),fill:'none',stroke:c,'stroke-width':3,'stroke-dasharray':d,opacity:.8}));}}
 // Animation kan afsløre centrum; det er et bevidst, oplyst hjælpemiddel.
 const data=maalinger();$('#stationer').querySelectorAll('g').forEach((g,i)=>{g.querySelector('path').setAttribute('stroke',tid>=data[i].s?'#b3472d':tid>=data[i].p?'#006e78':'#fff9ee');g.querySelector('path').setAttribute('stroke-width',tid>=data[i].p?5:2);});
 $('#tid-tal').textContent=`${tal(tid,0)} s`;$('#tid').value=tid;tegnUr();
}
function stop(){koerer=false;$('#afspil').textContent='▶ Afspil skælvet';}
$('#afspil').onclick=()=>{if(koerer){stop();return;}if(tid>=180)tid=0;koerer=true;$('#afspil').textContent='Ⅱ Pause';$('#kortnote').textContent='Hjælp: bølgefronternes centrum afslører epicentret. P er fuldt optrukket; S er stiplet.';};
$('#tid').oninput=e=>{stop();tid=Number(e.target.value);tegnFronter();if(tid>0)$('#kortnote').textContent='Hjælp: bølgefronternes centrum afslører epicentret. Tid kan også indstilles uden animation.';};
function bud(x,y){gaet={x:Math.round(Math.max(0,Math.min(800,x))),y:Math.round(Math.max(0,Math.min(520,y)))};$('#gaet-x').value=gaet.x;$('#gaet-y').value=gaet.y;tegnKort();}
$('#kort').addEventListener('click',e=>{const p=new DOMPoint(e.clientX,e.clientY).matrixTransform($('#kort').getScreenCTM().inverse());bud(p.x,p.y);});
for(const akse of ['x','y'])$(`#gaet-${akse}`).oninput=e=>{if(e.target.value===''||!e.target.validity.valid)return;gaet[akse]=Number(e.target.value);tegnKort();};
$('#tjek').onclick=()=>{const fejl=Math.hypot(gaet.x-kilde.x,gaet.y-kilde.y);if(fejl<=15){$('#feedback').textContent=`Godt lokaliseret! Dit bud ligger ${tal(fejl,0)} km fra epicentret. En afrundet aflæsning giver et område, ikke et perfekt punkt.`;loest=true;tegnKort();tegnSpor();}else{$('#feedback').textContent=`Dit bud ligger ${tal(fejl,0)} km fra epicentret. Prøv igen: ligger det på alle tre cirkler? Vis evt. ankomsttiderne som hjælp.`;}};
$('#facit').onclick=()=>{loest=true;deltaer=maalinger().map(m=>m.delta);stationer.forEach((s,i)=>{$(`#delta-${i}`).value=deltaer[i].toFixed(1);$(`#skyder-${i}`).value=deltaer[i];});$('#feedback').textContent=`Løsning: (${kilde.x}, ${kilde.y}) km. Cirklerne viser nu de præcise beregnede afstande. Prøv et nyt skælv, og find det selv.`;tegnKort();tegnSpor();};
$('#ankomster').onchange=tegnSpor;
$('#ny').onclick=()=>{sag++;kilde={x:220+Math.round(Math.random()*340),y:170+Math.round(Math.random()*190)};loest=false;stop();tid=0;deltaer=[20,20,20];stationer.forEach((_,i)=>{$(`#delta-${i}`).value=20;$(`#skyder-${i}`).value=20;});$('#ankomster').checked=false;$('#sag').textContent=`SAG ${String(sag).padStart(2,'0')}`;$('#feedback').textContent='Et nyt, skjult skælv er klar. Aflæs signalerne, og find fællespunktet.';$('#kortnote').textContent='Tre ure, ét mysterium. Justér cirklerne, og markér deres fælles punkt.';bud(400,260);tegnSpor();};
$('#dybde').oninput=e=>{dybde=Number(e.target.value);$('#dybde-tal').textContent=`${dybde} km`;$('.beregning strong').innerHTML=dybde?`r = √((8,4 · Δt)² − ${dybde}²)<small>kendt fokusdybde ${dybde} km</small>`:'r = 8,4 · Δt <small>ved dybde 0 km</small>';stop();tid=0;if(loest)deltaer=maalinger().map(m=>m.delta);stationer.forEach((_,i)=>{$(`#delta-${i}`).value=deltaer[i].toFixed(1);$(`#skyder-${i}`).value=deltaer[i];});$('#feedback').textContent='Dybden er ændret. Signalerne er beregnet igen for samme epicenter; aflæs de nye tidsforskelle.';tegnKort();tegnSpor();};
function skift(n){rum=n;$('#kort-rum').hidden=n!=='kort';$('#boelger-rum').hidden=n!=='boelger';document.querySelectorAll('[data-rum]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.rum===n));if(n!=='kort')stop();}
document.querySelectorAll('[data-rum]').forEach(b=>b.onclick=()=>skift(b.dataset.rum));$('#til-mission').onclick=()=>{skift('kort');$('[data-rum="kort"]').focus();};
$('#forklaring').onclick=()=>$('#om').showModal();$('#luk').onclick=()=>$('#om').close();$('#om').addEventListener('click',e=>{if(e.target===$('#om')){const r=$('#om').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#om').close();}});
$('#fokus').onclick=()=>{const aktiv=document.body.classList.toggle('fokus');$('#fokus').setAttribute('aria-pressed',aktiv);$('#fokus').textContent=aktiv?'Afslut fokus ↙':'Fokus ↗';};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#om').open){document.body.classList.remove('fokus');$('#fokus').setAttribute('aria-pressed','false');$('#fokus').textContent='Fokus ↗';stop();}});
const partikler=$('#partikler');let prikker=[];
function bygBoelger(){partikler.replaceChildren();prikker=[];for(const [type,y,farve]of [['P',120,'#006e78'],['S',310,'#b3472d']]){
 partikler.append(el('text',{x:25,y:y-73,fill:farve,'font-family':'Source Serif 4,serif','font-weight':600,'font-size':24},`${type}-bølge`));partikler.append(el('text',{x:180,y:y-73,fill:'#506067','font-family':'Archivo,sans-serif','font-size':13},type==='P'?'Partikelbevægelse ↔':'Partikelbevægelse ↕'));
 partikler.append(el('path',{d:`M625 ${y-78}h120l-8-5m8 5-8 5`,fill:'none',stroke:farve,'stroke-width':2}));
 for(let row=-2;row<=2;row++)for(let col=0;col<38;col++){const x=40+col*19,yy=y+row*15,mark=row===0&&col===17;partikler.append(el('circle',{cx:x,cy:yy,r:mark?8:2.5,fill:'none',stroke:mark?'#172d39':'#bdc7bb','stroke-width':mark?1.2:.7}));const c=el('circle',{cx:x,cy:yy,r:mark?5:3.2,fill:mark?'#f2bd51':farve,stroke:mark?'#172d39':'none','stroke-width':1});partikler.append(c);prikker.push({c,x,y:yy,type,mark});}
 partikler.append(el('text',{x:25,y:y+75,fill:'#506067','font-family':'IBM Plex Mono,monospace','font-size':11},type==='P'?'Fortætning og fortynding →':'Forskydning på tværs →'));
 }
 partikler.append(el('text',{id:'vaesketekst',x:400,y:405,'text-anchor':'middle',fill:'#b3472d','font-family':'Archivo,sans-serif','font-size':15}));tegnPartikler();
}
function tegnPartikler(){for(const p of prikker){const aktiv=p.type==='P'||medium==='fast',v=p.type==='P'?VP:VS,amp=aktiv?Math.sin(p.x/55-fase*v*.7)*10:0;p.c.setAttribute('cx',p.x+(p.type==='P'?amp:0));p.c.setAttribute('cy',p.y+(p.type==='S'?amp:0));p.c.setAttribute('opacity',aktiv?1:.25);}$('#vaesketekst').textContent=medium==='vaeske'?'Ingen udbredelse af S-bølger i væske':'';}
document.querySelectorAll('[data-medium]').forEach(b=>b.onclick=()=>{medium=b.dataset.medium;document.querySelectorAll('[data-medium]').forEach(x=>x.setAttribute('aria-pressed',x===b));$('#medium-forklaring').textContent=medium==='fast'?'Fast stof kan modstå både kompression og forskydning. Derfor kan begge bølgetyper løbe gennem det.':'Væske kan komprimeres, men kan ikke opretholde forskydningsspænding i hvile. P-bølgen fortsætter; en S-bølge kan ikke udbredes. P-farten her er kun illustrativ.';$('#p-materiale').textContent=medium==='fast'?'vP = 6,0 km/s i vores bjergart':'P-farten i væsken er kun illustrativ';$('#s-materiale').textContent=medium==='fast'?'vS = 3,5 km/s i vores bjergart':'Ingen S-bølge i væsken';tegnPartikler();});
function pauseTekst(){$('#boelgepause').textContent=boelgepause?'▶ Afspil':'Ⅱ Pause';$('#boelgepause').setAttribute('aria-pressed',boelgepause);}
$('#boelgepause').onclick=()=>{boelgepause=!boelgepause;pauseTekst();};
let foer=0;function frame(n){const dt=Math.min((n-foer)/1000,.05);foer=n;if(!document.hidden){if(koerer&&rum==='kort'){tid=Math.min(180,tid+dt*10);tegnFronter();if(tid===180)stop();}if(!boelgepause&&rum==='boelger'){fase+=dt;tegnPartikler();}}requestAnimationFrame(frame);}
bygBoelger();pauseTekst();tegnSpor();tegnKort();requestAnimationFrame(frame);
