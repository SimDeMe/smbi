// Et interaktivt terræn af kortets eksisterende ETOPO-data. Canvas 2D tegner
// projicerede trekanter med dybdebuffer; intet WebGL eller nyt bibliotek.
import { lavTerraen } from './terraen.js';
import { lavRaster, pakFarve } from './raster.js';
import { lavSnit, tegnSnit } from './snit3d.js';
import { SNIT, KILDER } from './snitdata.js';
import { lavThingvellir, tegnThingvellir, tegnThingNavne, THINGVELLIR } from './thingvellir.js';

const canvas = document.querySelector('#landskab'), figur = canvas.closest('figure');
const fejltekst = document.querySelector('#hentestatus'), status = document.querySelector('#status');
const roligt = matchMedia('(prefers-reduced-motion: reduce)');
const kamera = { drej: -14, vip: 48, zoom: 1, x: 0, z: 0, faktor: 20 };
const tilstand = { sted: 0, havbund: true, geologi: true, faktor: 20, rundtur: false, klar: false, snit: null, dybdefaktor: 1.5, thingFaktor:15 };
const betjening=[...document.querySelectorAll('.vaerktoejer button,.landskabsknapper button,.destinationer button,#overdrivelse')].filter(b=>b.id!=='fokus'&&b.id!=='ommodel');
betjening.forEach(b=>{b.disabled=true;});
const steder = [
  { titel: 'En ø på en undersøisk ryg', geo: [-19, 64.95], drej: -14, vip: 48, zoom: 1,
    tekst: 'Island er den del af Den Midtatlantiske Ryg, der når over havet. Drej øen og følg landskabet videre ned på havbunden.',
    se: 'Slå havbunden fra og til. Hvor meget af landskabet skjuler havet?' },
  { titel: 'Her kommer ryggen i land', geo: [-22.25, 63.95], drej: -38, vip: 42, zoom: 2.8,
    tekst: 'På Reykjanes møder den undersøiske ryg Island. De lange omrids viser kortlagte sprækkesværme og vulkaner. Følg bæltet fra havet ind over land.',
    se: 'Følg de orange vulkansystemer. Hvordan ligger de i forhold til den røde pladegrænse?' },
  { titel: 'Vulkaner under en jøkel', geo: [-17.3, 64.55], drej: 18, vip: 40, zoom: 2.5,
    tekst: 'Bárðarbunga og Grímsvötn ligger under Vatnajökull. Se, hvordan vulkansystemerne hænger sammen med landskabet omkring jøklen.',
    se: 'Find de to vulkaner, og skær landskabet op for at se magmakamrene nedenunder.' },
  { titel: 'Bjergkæden fortsætter under havet', geo: [-24.3, 63.35], drej: -34, vip: 35, zoom: 2.1,
    tekst: 'Reykjanesryggen er en del af Den Midtatlantiske Ryg. Den hæver sig over den omgivende havbund og fortsætter mod Island. Vandet skjuler normalt dette landskab.',
    se: 'Slå «Vis havbund» fra og til. Følg ryggens retning mod Reykjanes.' },
  { titel:'Þingvellir: pladernes spor i landskabet',geo:THINGVELLIR.geo,drej:15,vip:50,zoom:1,
    tekst:'På Thingvallasletten ses pladebevægelsen i jordoverfladen. Ved Almannagjá brydes klippen op langs riftdalens vestlige kant. Hrafnagjá ligger på den modsatte side af dalen.',
    se:'Tryk på «Vis pladernes bevægelse». Se, hvordan området strækkes, og jorden mellem forkastningerne synker.' }
];
let ctx, terraen, data, flader, graenser = [], vulkanlinjer = [], navne = [], W = 0, H = 0, skala = 1;
let thingvellir,riftmaal=0,rift=0,farveFaktor=null;
// Over denne zoom erstatter Þingvellirs finmaskede udsnit øens grove trekanter.
const FIN_ZOOM=4;
const erThing=()=>tilstand.sted===4&&!tilstand.snit;
let raster, aktueltSnit=null, gemtKamera=null, snitOffset=null;
let ramme = 0, flyvning = 0, turTid = 0, revision = 0;
const rad = Math.PI / 180, klem = (v, a, b) => Math.max(a, Math.min(b, v));
const meddel = s => { status.textContent = s; };
const farve = (z, lys) => {
  const stop = z < 0
    ? [[-3000,[19,61,79]],[-1300,[34,91,111]],[-400,[60,123,135]],[0,[106,157,160]]]
    : [[0,[153,174,134]],[350,[137,156,116]],[700,[125,140,112]],[1100,[140,145,133]],[1500,[184,194,187]],[2000,[240,243,234]]];
  let a = stop[0], b = stop[stop.length - 1];
  for (let i = 1; i < stop.length; i++) if (z <= stop[i][0]) { a = stop[i - 1]; b = stop[i]; break; }
  const t = klem((z - a[0]) / (b[0] - a[0]), 0, 1);
  return `rgb(${a[1].map((v, i) => Math.round(klem((v + (b[1][i] - v) * t) * lys, 0, 255))).join(',')})`;
};
function fladeFarve(t,z,faktor=tilstand.faktor){
  const [a,b,c]=t,u=[b[0]-a[0],(b[1]-a[1])/1000*faktor,b[2]-a[2]],v=[c[0]-a[0],(c[1]-a[1])/1000*faktor,c[2]-a[2]];
  let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  if(n[1]<0)n=n.map(x=>-x);const l=Math.hypot(...n)||1;
  return pakFarve(farve(z,.66+.38*Math.max(0,(-.45*n[0]+.82*n[1]-.35*n[2])/l)));
}
function beregnFarver(){farveFaktor=kamera.faktor;flader=terraen.flader.map((ids,k)=>{const t=ids.map(i=>terraen.punkter[i]),z=t.reduce((s,q)=>s+q[1],0)/3;return{ids,z,k,farve:fladeFarve(t,z,farveFaktor)};});}
function projektion() {
  const a = kamera.drej * rad, b = kamera.vip * rad;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  return ([x, y, z], over = true) => {
    x -= kamera.x; z -= kamera.z;
    const h = tilstand.snit ? y/1000*(y>=0?20:tilstand.dybdefaktor)
      : (over && !tilstand.havbund ? Math.max(0, y) : y) / 1000 * kamera.faktor;
    const rx = x*ca + z*sa, rz = -x*sa + z*ca;
    return [(snitOffset?.x??W*.5) + rx*skala*kamera.zoom, (snitOffset?.y??H*.52) + (rz*sb-h*cb)*skala*kamera.zoom, rz*cb+h*sb];
  };
}
function sti(punkter, luk = false) {
  ctx.beginPath(); punkter.forEach((p, i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1])); if (luk) ctx.closePath();
}
function linjer(liste, p, farve, bredde, streg = []) {
  ctx.strokeStyle = farve; ctx.lineWidth = bredde; ctx.setLineDash(streg);
  ctx.beginPath();
  for (const linje of liste) {
    let startet = false;
    for (const punkt of linje) {
      if (!punkt || (!tilstand.havbund && punkt[1] < -10)) { startet = false; continue; }
      const q = p([punkt[0], (fin()&&punkt[3]!=null?punkt[3]:punkt[1]) + 35, punkt[2]]);
      if(!raster.synlig(q)){startet=false;continue;}
      if (startet) ctx.lineTo(q[0],q[1]); else { ctx.moveTo(q[0],q[1]); startet = true; }
    }
  }
  ctx.stroke(); ctx.setLineDash([]);
}
function tegn() {
  ramme = 0;
  if (!tilstand.klar || !W || !H) return;
  const p = projektion();
  ctx.clearRect(0,0,W,H);
  const bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,tilstand.snit?'#152d34':'#f0f1e6'); bg.addColorStop(.6,tilstand.snit?'#263e42':'#dde9e3'); bg.addColorStop(1,tilstand.snit?'#10282f':'#c3dad5');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  if(tilstand.snit){
    delete canvas.dataset.sted;delete canvas.dataset.rift;
    const terrænfarve=(t,z)=>{
      const [a,b,c]=t,hy=q=>q[1]/1000*(q[1]>=0?20:tilstand.dybdefaktor);
      const u=[b[0]-a[0],hy(b)-hy(a),b[2]-a[2]],v=[c[0]-a[0],hy(c)-hy(a),c[2]-a[2]];
      let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      if(n[1]<0)n=n.map(v=>-v);const l=Math.hypot(...n)||1;
      return pakFarve(farve(z,.68+.35*Math.max(0,(-.45*n[0]+.82*n[1]-.35*n[2])/l)));
    };
    const resultat=tegnSnit({ctx,raster,p,snit:aktueltSnit,terrænfarve,bredde:W,hoejde:H,terraen,farvenøgle:tilstand.dybdefaktor,tid:performance.now()/1000,spiller:tilstand.rundtur});
    canvas.dataset.snit=tilstand.snit;canvas.dataset.kamre=resultat.synligeKamre.join(',');
    canvas.dataset.revision=++revision;
    if(tilstand.rundtur)ramme=requestAnimationFrame(tegn);
    return;
  }
  delete canvas.dataset.snit;delete canvas.dataset.kamre;
  if(!flyvning&&farveFaktor!==kamera.faktor)beregnFarver();
  if(erThing()){const forskel=riftmaal-rift;rift=roligt.matches||Math.abs(forskel)<.002?riftmaal:rift+forskel*.13;}
  const medFin=fin();
  const [x0,z0,x1,z1] = terraen.graenser;
  const base = -5200, hj = [[x0,base,z0],[x1,base,z0],[x1,base,z1],[x0,base,z1]].map(q=>p(q,false));
  ctx.save();ctx.shadowColor='#16474650';ctx.shadowBlur=30;ctx.shadowOffsetY=20;ctx.fillStyle='#7aaba6';sti(hj,true);ctx.fill();ctx.restore();
  const punkter = terraen.punkter.map(q=>p(q));
  const kanter = [];
  const kant = ids => {
    for (let i=0;i<ids.length-1;i++) {
      const a=terraen.punkter[ids[i]],b=terraen.punkter[ids[i+1]];
      const ps=[punkter[ids[i]],punkter[ids[i+1]],p([b[0],base,b[2]],false),p([a[0],base,a[2]],false)];
      kanter.push({ps,dybde:ps.reduce((s,q)=>s+q[2],0)/4});
    }
  };
  const {nx,nz}=terraen;
  kant(Array.from({length:nx+1},(_,i)=>i)); kant(Array.from({length:nx+1},(_,i)=>nz*(nx+1)+i));
  kant(Array.from({length:nz+1},(_,i)=>i*(nx+1)));kant(Array.from({length:nz+1},(_,i)=>i*(nx+1)+nx));
  raster.nulstil();
  const sokkel=pakFarve('rgb(52,98,106)'),vand=pakFarve('rgb(53,119,137)');
  for (const {ps} of kanter) {
    raster.trekant(ps[0],ps[1],ps[2],sokkel);raster.trekant(ps[0],ps[2],ps[3],sokkel);
  }
  for (const f of flader) {
    if(medFin&&thingvellir.fjernet.has(f.k))continue;
    const [a,b,c]=f.ids;
    raster.trekant(punkter[a],punkter[b],punkter[c],!tilstand.havbund&&f.z<0?vand:f.farve);
  }
  if(medFin)tegnThingvellir({raster,p,model:thingvellir,farve:fladeFarve,faktor:farveFaktor,bevaegelse:erThing()?rift:0});
  raster.vis(ctx);
  linjer(terraen.kyst,p,'#d3e4c1',.85);
  if (tilstand.geologi&&!erThing()) {
    linjer(vulkanlinjer,p,'#713b24',3.6);linjer(vulkanlinjer,p,'#ffb36c',1.6);
    linjer(graenser,p,'#fff2d9bb',3);linjer(graenser,p,'#cf3942',1.5,[6,4]);
  }
  // En nordpil følger kameraets retning og holdes fast i figurens hjørne.
  const v=p([kamera.x,0,kamera.z-50]),m=p([kamera.x,0,kamera.z]);
  const l=Math.hypot(v[0]-m[0],v[1]-m[1]),dx=(v[0]-m[0])/l*24,dy=(v[1]-m[1])/l*24;
  const bx=W-32,by=48;ctx.strokeStyle='#31564d';ctx.lineWidth=1.6;sti([[bx,by],[bx+dx,by+dy]]);ctx.stroke();
  ctx.font='600 11px Archivo, sans-serif';ctx.fillStyle='#31564d';ctx.textAlign='center';ctx.fillText('N',bx+dx,by+dy-6);
  // Navne fra GVP, placeret på det målte terræn. Begrænset til fire uden overlap.
  const optaget=[[0,0,250,85],[W-155,H-110,W,H],[0,H-75,W*.6,H]];
  const kandidater=erThing()?[]:navne.filter(n=>kamera.zoom>1.3||['Hekla','Krafla','Snæfellsjökull','Grímsvötn'].includes(n.navn));
  ctx.font='600 12px Archivo, sans-serif';ctx.textAlign='left';
  let antal=0;
  for (const n of kandidater) {
    const q=p(n.punkt);const b=ctx.measureText(n.navn).width+16,x=q[0]+8,y=q[1]-28;
    if(x<8||y<88||x+b>W-8||y+24>H-75||optaget.some(r=>x<r[2]&&x+b>r[0]&&y<r[3]&&y+23>r[1]))continue;
    optaget.push([x,y,x+b,y+23]);
    ctx.fillStyle='#fffaf0ee';ctx.beginPath();ctx.roundRect(x,y,b,23,4);ctx.fill();
    ctx.fillStyle='#243e3a';ctx.fillText(n.navn,x+8,y+16);
    ctx.strokeStyle='#fffaf0';ctx.lineWidth=1;sti([[q[0],q[1]],[x+5,y+23]]);ctx.stroke();
    ctx.fillStyle='#f1a05d';ctx.beginPath();ctx.arc(q[0],q[1],3,0,Math.PI*2);ctx.fill();
    if(++antal>=(kamera.zoom>1.3?5:4))break;
  }
  if(erThing())tegnThingNavne({ctx,raster,p,model:thingvellir,bevaegelse:rift,bredde:W,hoejde:H,oversigt:kamera.zoom<8});
  // Synlig sammenligningslængde på terrænets vandrette plan (projektionen er vinkeltro).
  const a=p([kamera.x-.5,0,kamera.z]),b=p([kamera.x+.5,0,kamera.z]),prKm=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const km=[100,50,20,10,5,2,1].find(k=>k*prKm<=170)||1,px=km*prKm;
  ctx.font='500 10px "IBM Plex Mono", monospace';ctx.textAlign='left';ctx.fillStyle='#31564d';
  const ly=erThing()?H-105:H-76;ctx.fillText('ca. '+km+' km',18,ly-6);ctx.lineWidth=1.5;ctx.strokeStyle='#31564d';sti([[18,ly],[18+px,ly]]);ctx.stroke();
  if(erThing()){canvas.dataset.sted='thingvellir';canvas.dataset.rift=rift.toFixed(3);if(rift!==riftmaal&&!ramme)ramme=requestAnimationFrame(tegn);}
  else{delete canvas.dataset.sted;delete canvas.dataset.rift;}
  revision++;canvas.dataset.revision=revision;
}
const planlaeg = () => { if (!ramme) ramme=requestAnimationFrame(tegn); };
function stopTur() {
  if(ramme){cancelAnimationFrame(ramme);ramme=0;}
  clearTimeout(turTid);tilstand.rundtur=false;document.querySelector('#rundtur').setAttribute('aria-pressed','false');document.querySelector('#rundtur').textContent=tilstand.snit?'▷ Følg magma':'▷ Rundtur';document.querySelector('.flowstatus').hidden=true;stopFlyvning();
}
function stopFlyvning(){cancelAnimationFrame(flyvning);flyvning=0;}
function vaelgSted(i, anim=true) {
  if(!tilstand.klar)return;
  stopFlyvning();tilstand.sted=i;document.body.classList.toggle('thingaktiv',i===4);document.querySelector('#thingvellirscene').hidden=i!==4;if(i===4)saetRift(false);const s=steder[i], [x,z]=terraen.fraGeo(s.geo);
  document.querySelector('#betjening').textContent='Træk vandret for at dreje · pile drejer og vipper · +/− zoomer · Home nulstiller';
  const f=i===4?tilstand.thingFaktor:tilstand.faktor;document.querySelector('#overdrivelse').value=f;document.querySelector('#faktor').value='×'+f;
  snitOffset=null;
  canvas.setAttribute('aria-label',i===4?'Þingvellir i 3D: Almannagjá, Hrafnagjá og riftdalen':'Islands terræn i 3D');
  document.querySelector('#landskabstekst').textContent=i===4?'Þingvellir på øens 3D-landskab: Þingvallavatn og riftdalen mellem forkastningerne Almannagjá og Hrafnagjá. Pile viser pladernes bevægelse væk fra hinanden. Knappen udvider sprækkerne og sænker dalbunden. Zoom ud for at se stedet på hele øen.':'Islands landskab og havbund i 3D. Orange linjer viser aktive vulkansystemer.';
  document.querySelector('#stedsnummer').textContent=`0${i+1} / 05`;
  for(const id of ['stedsnavn','rejsetitel'])document.querySelector('#'+id).textContent=s.titel;
  document.querySelector('#rejsetekst').textContent=s.tekst;document.querySelector('#undersoeg').textContent=s.se;
  document.querySelectorAll('[data-sted]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.sted===i)));
  meddel(s.titel+'. '+s.tekst);
  const fra={...kamera},til={drej:s.drej,vip:s.vip,zoom:i===4?thingZoom():s.zoom,x:i===4?thingvellir.midte[0]:x,z:i===4?thingvellir.midte[2]:z,faktor:f};
  stoerrelse();
  fra.drej=til.drej+(((fra.drej-til.drej+180)%360+360)%360-180);
  if(!anim||roligt.matches){Object.assign(kamera,til);planlaeg();return;}
  // Zoom interpoleres logaritmisk, så flyvningen ned til Þingvellir føles jævn.
  const start=performance.now(),varighed=Math.abs(Math.log(til.zoom/fra.zoom))>2?1800:1000;
  const flyv=t=>{const u=klem((t-start)/varighed,0,1),f=u*u*(3-2*u);for(const k in til)kamera[k]=k==='zoom'?fra.zoom*(til.zoom/fra.zoom)**f:fra[k]+(til[k]-fra[k])*f;planlaeg();if(u<1)flyvning=requestAnimationFrame(flyv);else{flyvning=0;planlaeg();}};
  flyvning=requestAnimationFrame(flyv);
}
function manuel(){stopTur();stopFlyvning();}
document.querySelectorAll('[data-sted]').forEach(b=>b.addEventListener('click',()=>{stopTur();vaelgSted(+b.dataset.sted);}));
document.querySelector('#havbund').addEventListener('click',e=>{manuel();tilstand.havbund=!tilstand.havbund;e.currentTarget.setAttribute('aria-pressed',String(tilstand.havbund));planlaeg();meddel(tilstand.havbund?'Havbunden er synlig. Havniveauet er uændret.':'Havet dækker havbunden.');});
document.querySelector('#geologi').addEventListener('click',e=>{manuel();tilstand.geologi=!tilstand.geologi;e.currentTarget.setAttribute('aria-pressed',String(tilstand.geologi));planlaeg();meddel(tilstand.geologi?'Vulkansystemer og pladegrænse vises.':'Vulkansystemer og pladegrænse er skjult.');});
document.querySelector('#overdrivelse').addEventListener('input',e=>{manuel();if(tilstand.snit){tilstand.dybdefaktor=+e.target.value;document.querySelector('#faktor').value='×'+String(tilstand.dybdefaktor).replace('.',',');tilpasSnit();}else{kamera.faktor=+e.target.value;tilstand[erThing()?'thingFaktor':'faktor']=kamera.faktor;document.querySelector('#faktor').value='×'+kamera.faktor;if(tilstand.klar)beregnFarver();}planlaeg();});
document.querySelector('#rundtur').addEventListener('click',()=>{
  if(tilstand.rundtur){stopTur();meddel('Rundturen er sat på pause.');return;}
  if(tilstand.snit){tilstand.rundtur=true;document.querySelector('#rundtur').setAttribute('aria-pressed','true');document.querySelector('#rundtur').textContent='Ⅱ Pause';document.querySelector('.flowstatus').hidden=false;planlaeg();return;}
  tilstand.rundtur=true;document.querySelector('#rundtur').setAttribute('aria-pressed','true');document.querySelector('#rundtur').textContent='Ⅱ Pause';
  const naeste=()=>{if(!tilstand.rundtur)return;vaelgSted((tilstand.sted+1)%steder.length);turTid=setTimeout(naeste,8500);};naeste();
});
const drej=(a,b=0)=>{manuel();kamera.drej=((kamera.drej+a+180)%360+360)%360-180;kamera.vip=klem(kamera.vip+b,22,78);planlaeg();};
const zoom=d=>{manuel();kamera.zoom=klem(kamera.zoom*d,.65,erThing()?120:30);planlaeg();};
document.querySelectorAll('[data-drej]').forEach(b=>b.addEventListener('click',()=>drej(+b.dataset.drej)));
document.querySelector('#zoomind').addEventListener('click',()=>zoom(1.2));document.querySelector('#zoomud').addEventListener('click',()=>zoom(1/1.2));
document.querySelector('#nulstil').addEventListener('click',()=>{manuel();if(tilstand.snit)visSnit(tilstand.snit);else vaelgSted(erThing()?4:0);});
canvas.addEventListener('keydown',e=>{
  if(document.querySelector('#ommodellen').open)return;
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  const pile={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,5],ArrowDown:[0,-5]};
  if(pile[e.key]){e.preventDefault();drej(...pile[e.key]);}
  else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home'){manuel();if(tilstand.snit)visSnit(tilstand.snit);else vaelgSted(erThing()?4:0);}else zoom(e.key==='-'?1/1.2:1.2);}
});
let traek=null;
canvas.addEventListener('pointerdown',e=>{if(e.button>0||!tilstand.klar)return;manuel();traek={x:e.clientX,y:e.clientY,id:e.pointerId,type:e.pointerType,aktiv:false};});
canvas.addEventListener('pointermove',e=>{
  if(!traek||traek.id!==e.pointerId)return;
  const dx=e.clientX-traek.x,dy=e.clientY-traek.y;
  if(!traek.aktiv){if(Math.hypot(dx,dy)<5)return;if(traek.type==='touch'&&Math.abs(dy)>Math.abs(dx)){traek=null;return;}traek.aktiv=true;canvas.setPointerCapture(e.pointerId);canvas.classList.add('traekker');}
  kamera.drej+=dx*.35;if(traek.type!=='touch')kamera.vip=klem(kamera.vip+dy*.15,22,78);traek.x=e.clientX;traek.y=e.clientY;planlaeg();
});
const slip=()=>{traek=null;canvas.classList.remove('traekker');};canvas.addEventListener('pointerup',slip);canvas.addEventListener('pointercancel',slip);
canvas.addEventListener('wheel',e=>{if(document.activeElement!==canvas&&!e.ctrlKey)return;e.preventDefault();zoom(e.deltaY<0?1.1:1/1.1);},{passive:false});
document.querySelector('#fokus').addEventListener('click',e=>{const til=!document.body.classList.contains('fokus');document.body.classList.toggle('fokus',til);e.currentTarget.setAttribute('aria-pressed',String(til));});
document.addEventListener('keydown',e=>{if(document.querySelector('#ommodellen').open)return;if(e.key==='Escape'){stopTur();stopFlyvning();document.body.classList.remove('fokus');document.querySelector('#fokus').setAttribute('aria-pressed','false');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTur();stopFlyvning();}});
roligt.addEventListener('change',()=>{stopFlyvning();stopTur();planlaeg();});
// At sætte canvas.width tømmer canvas, selv med samme værdi. Derfor nulstilles
// kun ved en reel ændring, og så tegnes straks, så en tom figur aldrig står med
// en gammel revision (ResizeObserver kalder også én gang lige efter start).
function stoerrelse(){
  const b=figur.getBoundingClientRect();W=Math.round(b.width);H=Math.round(b.height);const d=Math.min(devicePixelRatio||1,2);
  const ny=canvas.width!==Math.round(W*d)||canvas.height!==Math.round(H*d)||!raster;
  if(ny){canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);raster=lavRaster(W,H);ctx.setTransform(d,0,0,d,0,0);}
  const [x0,z0,x1,z1]=terraen.graenser;skala=Math.min(W/((x1-x0)*1.15),H/((z1-z0)*.85+120))*.88;if(tilstand.snit)tilpasSnit();
  if(ny&&tilstand.klar){if(ramme)cancelAnimationFrame(ramme);tegn();}else planlaeg();
}
const fin=()=>!tilstand.snit&&thingvellir&&kamera.zoom>=FIN_ZOOM;
// Riftdalen, søen og fjeldene omkring (ca. 50 km i billedets bredde, 30 km på mobil) skal fylde figuren på alle skærme.
function thingZoom(){const b=figur.getBoundingClientRect(),[x0,z0,x1,z1]=terraen.graenser,s=Math.min(b.width/((x1-x0)*1.15),b.height/((z1-z0)*.85+120))*.88;return Math.min(b.width,b.height*2.2)/((b.width<500?30:50)*s);}
function saetRift(til){
  riftmaal=til?1:0;if(!til)rift=0;
  const knap=document.querySelector('#visrift');knap.setAttribute('aria-pressed',String(til));knap.textContent=til?'Saml landskabet igen':'Vis pladernes bevægelse';
  if(tilstand.klar)meddel(til?'Pladerne bevæger sig fra hinanden, og riftdalen synker.':'Landskabet er samlet igen.');
  planlaeg();
}
document.querySelector('#visrift').addEventListener('click',()=>{manuel();saetRift(!riftmaal);});
document.querySelector('#nulstilrift').addEventListener('click',()=>{manuel();saetRift(false);});
// Geografisk gennemskæring: et regionalt udsnit af samme terræn.
function tilpasSnit(){
  if(!aktueltSnit||!W||!H)return;
  const a=kamera.drej*rad,b=kamera.vip*rad,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
  const s=aktueltSnit,ramme=s.punkter.concat([-1,1].flatMap(k=>[s.world(k*s.valg.halv,s.bund,0),s.world(k*s.valg.halv,s.bund,-s.valg.bag)]));
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  for(const q of ramme){const x=q[0]-kamera.x,z=q[2]-kamera.z,h=q[1]/1000*(q[1]>=0?20:tilstand.dybdefaktor),rx=x*ca+z*sa,ry=(-x*sa+z*ca)*sb-h*cb;x0=Math.min(x0,rx);x1=Math.max(x1,rx);y0=Math.min(y0,ry);y1=Math.max(y1,ry);}
  skala=Math.min((W-40)/(x1-x0),(H-185)/(y1-y0))*.96;
  snitOffset={x:W/2-(x0+x1)/2*skala,y:92+(H-185)/2-(y0+y1)/2*skala};
}
function snitAdresse(id){const url=new URL(location.href);if(id)url.searchParams.set('snit',id);else url.searchParams.delete('snit');history.replaceState(null,'',url.pathname+url.search+url.hash);}
function visSnit(id){
  if(!tilstand.klar)return;
  manuel();document.body.classList.remove('thingaktiv');document.querySelector('#thingvellirscene').hidden=true;if(!tilstand.snit)gemtKamera={...kamera};
  document.querySelector('#betjening').textContent='Træk vandret for at dreje · pile drejer og vipper · +/− zoomer · Home nulstiller';
  aktueltSnit=lavSnit(terraen,id);tilstand.snit=aktueltSnit.valg.id;
  document.body.classList.add('snitaktiv');document.querySelector('#snitknap').setAttribute('aria-pressed','true');document.querySelector('#snitknap').textContent='Luk tværsnit';
  document.querySelector('.snitdestinationer').hidden=false;
  document.querySelectorAll('button[data-snit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.snit===tilstand.snit)));
  document.querySelector('#valgoverskrift').textContent='Vælg et geologisk snit';document.querySelector('.til-snit').textContent='Se hele landskabet →';
  document.querySelector('#stedsnummer').textContent='SNIT 0'+(SNIT.indexOf(aktueltSnit.valg)+1)+' / 03';
  for(const id of ['stedsnavn','rejsetitel'])document.querySelector('#'+id).textContent=aktueltSnit.valg.titel;
  document.querySelector('#rejsetekst').textContent=aktueltSnit.valg.tekst;document.querySelector('#undersoeg').textContent=aktueltSnit.valg.se;
  document.querySelector('#datastempel').textContent='ISLAND · TVÆRSNIT';document.querySelector('.snitmaerke').hidden=false;
  document.querySelector('#rundtur').textContent='▷ Følg magma';document.querySelector('.videre').textContent='Tilbage til landskabet →';
  const liste=document.querySelector('#kammerliste');liste.hidden=false;liste.replaceChildren(...aktueltSnit.kamre.map(k=>{
    const el=document.createElement('div');el.className='kammerkort';el.append(Object.assign(document.createElement('strong'),{textContent:k.navn}),Object.assign(document.createElement('span'),{textContent:k.label}));return el;
  }));
  const kilde=document.querySelector('#snitkilder');kilde.hidden=false;kilde.replaceChildren('Dybder fra: ',...aktueltSnit.valg.kilder.map(k=>Object.assign(document.createElement('a'),{href:KILDER[k].url,textContent:KILDER[k].titel})),Object.assign(document.createElement('span'),{textContent:'Se også kildegrundlaget nedenfor.'}));
  document.querySelector('#kammernoter').replaceChildren(...aktueltSnit.kamre.map(k=>{const p=document.createElement('p');p.textContent=k.navn+' — '+k.sikker+'. '+k.tekst;return p;}));
  const skyder=document.querySelector('#overdrivelse');skyder.min=.5;skyder.max=6;skyder.step=.25;skyder.value=tilstand.dybdefaktor;skyder.setAttribute('aria-label','Dybdernes lodrette overdrivelse');
  document.querySelector('#faktor').value='×'+String(tilstand.dybdefaktor).replace('.',',');document.querySelector('#faktornavn').textContent='Dybder';document.querySelector('#faktorbeskrivelse').textContent='Terræn over havet ×20';
  const beskrivelse=document.querySelector('#landskabstekst');beskrivelse.textContent='Geografisk tværsnit gennem '+aktueltSnit.valg.navn+'. Dybdeaksen regnes fra havniveau. '+aktueltSnit.kamre.map(k=>k.navn+': '+k.label+'.').join(' ');
  Object.assign(kamera,{drej:aktueltSnit.retning,vip:30,zoom:1,x:aktueltSnit.midte[0],z:aktueltSnit.midte[1]});
  tilpasSnit();snitAdresse(tilstand.snit);planlaeg();meddel(beskrivelse.textContent);
}
function lukSnit(){
  manuel();tilstand.snit=null;aktueltSnit=null;snitOffset=null;document.body.classList.remove('snitaktiv');
  document.querySelector('#snitknap').setAttribute('aria-pressed','false');document.querySelector('#snitknap').textContent='Tværsnit';document.querySelector('.snitdestinationer').hidden=true;
  document.querySelector('#valgoverskrift').textContent='Vælg din udsigt';document.querySelector('.til-snit').textContent='Skær landskabet op →';document.querySelector('#kammerliste').hidden=true;document.querySelector('#snitkilder').hidden=true;document.querySelector('.snitmaerke').hidden=true;
  document.querySelector('#datastempel').textContent='ISLAND · LANDSKAB';document.querySelector('#rundtur').textContent='▷ Rundtur';document.querySelector('.videre').textContent='Se inde i landskabet →';
  const skyder=document.querySelector('#overdrivelse');skyder.min=1;skyder.max=30;skyder.step=1;skyder.value=tilstand.faktor;skyder.setAttribute('aria-label','Lodret overdrivelse');document.querySelector('#faktor').value='×'+tilstand.faktor;document.querySelector('#faktornavn').textContent='Højder';document.querySelector('#faktorbeskrivelse').textContent='Lodret overdrivelse';
  document.querySelector('#landskabstekst').textContent='Islands landskab og havbund i 3D. Orange linjer viser aktive vulkansystemer.';
  const før=gemtKamera;vaelgSted(tilstand.sted,false);if(før)Object.assign(kamera,før);stoerrelse();snitAdresse(null);meddel('Viser landskabet igen.');
}
function skiftSnit(){if(tilstand.snit)lukSnit();else visSnit(tilstand.sted===1?'reykjanes':'vatnajokull');}
document.querySelector('#snitknap').addEventListener('click',skiftSnit);
document.querySelectorAll('button[data-snit]').forEach(b=>b.addEventListener('click',()=>visSnit(b.dataset.snit)));
for(const a of document.querySelectorAll('.til-snit,.videre'))a.addEventListener('click',e=>{if(!tilstand.klar)return;e.preventDefault();skiftSnit();});
try {
  // D3 er et lokalt defer-script; ES-moduler kører efter parseren i samme dokument.
  if(!globalThis.d3)throw new Error('Kortbiblioteket mangler');
  ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D mangler');
  const [meta,svar,pg]=await Promise.all([fetch('data/islandskort.json'),fetch('data/islandskort-hoejde.bin'),fetch('../data/pladegraenser.json').catch(()=>null)]);
  if(!meta.ok||!svar.ok)throw new Error('Terrændata mangler');
  data=await meta.json();terraen=lavTerraen(data,await svar.arrayBuffer(),d3);thingvellir=lavThingvellir(terraen);beregnFarver();
  const renderPunkt = lonlat => {const [x,z]=terraen.fraGeo(lonlat),y=terraen.modelHoejdeVed(x,z);return y==null?null:[x,y,z,thingvellir.overflade(x,z)];};
  const foelg = l => {
    const ud=[];
    for(let i=0;i<l.length;i++) {
      if(i) {
        const a=terraen.fraGeo(l[i-1]),b=terraen.fraGeo(l[i]),n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/2);
        for(let k=1;k<n;k++)ud.push(renderPunkt([l[i-1][0]+(l[i][0]-l[i-1][0])*k/n,l[i-1][1]+(l[i][1]-l[i-1][1])*k/n]));
      }
      ud.push(renderPunkt(l[i]));
    }
    return ud;
  };
  vulkanlinjer=data.vulkansystemer.filter(f=>f.properties.aktiv).flatMap(f=>f.geometry.coordinates.map(foelg));
  if(pg?.ok){try{const d=await pg.json();graenser=d.linjer.map(l=>{const q=[];for(let i=0;i<l[4].length;i+=2)q.push([l[4][i],l[4][i+1]]);return q.some(([lon,lat])=>lon>-28&&lon<-10&&lat>62&&lat<68)?foelg(q):[];}).filter(l=>l.some(Boolean));}catch{graenser=[];}}
  if(!graenser.length)document.querySelector('.pladelinje').parentElement.textContent='Pladegrænse kunne ikke hentes';
  navne=data.navne.map(n=>({...n,punkt:renderPunkt([n.lon,n.lat])})).filter(n=>n.punkt);
  tilstand.klar=true;betjening.forEach(b=>{b.disabled=false;});figur.classList.add('klar');fejltekst.hidden=true;
  new ResizeObserver(stoerrelse).observe(figur);stoerrelse();vaelgSted(0,false);
  const startparam=new URLSearchParams(location.search),startSnit=startparam.get('snit');if(startSnit)visSnit(startSnit);else if(startparam.get('sted')==='thingvellir')vaelgSted(4,false);
} catch(fejl) {
  stopTur();fejltekst.classList.add('fejl');fejltekst.replaceChildren('3D-landskabet kunne ikke vises. ',Object.assign(document.createElement('a'),{href:'kort.html',textContent:'Åbn kortet og forklaringen →'}));
  betjening.forEach(b=>{b.disabled=true;});
}
export const proeve={kamera,tilstand,terraen:()=>terraen,projektion:()=>projektion(),snit:()=>aktueltSnit,thingvellir:()=>thingvellir,steder};

// Supplerende dokumentation åbnes efter elevens eget valg.
const ommodel=document.querySelector('#ommodellen');
document.querySelector('#ommodel').addEventListener('click',()=>{stopTur();ommodel.showModal();});
document.querySelector('#lukommodel').addEventListener('click',()=>ommodel.close());
ommodel.addEventListener('close',()=>document.querySelector('#ommodel').focus({preventScroll:true}));
