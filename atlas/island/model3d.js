// Et interaktivt terræn af kortets eksisterende ETOPO-data. Canvas 2D tegner
// projicerede trekanter med dybdebuffer; intet WebGL eller nyt bibliotek.
import { lavTerraen } from './terraen.js';
import { lavRaster, pakFarve } from './raster.js';

const canvas = document.querySelector('#landskab'), figur = canvas.closest('figure');
const fejltekst = document.querySelector('#hentestatus'), status = document.querySelector('#status');
const roligt = matchMedia('(prefers-reduced-motion: reduce)');
const kamera = { drej: -14, vip: 48, zoom: 1, x: 0, z: 0 };
const tilstand = { sted: 0, havbund: true, geologi: true, faktor: 20, rundtur: false, klar: false };
const betjening=[...document.querySelectorAll('.vaerktoejer button,.landskabsknapper button,.destinationer button,#overdrivelse')].filter(b=>b.id!=='fokus');
betjening.forEach(b=>{b.disabled=true;});
const steder = [
  { titel: 'En ø på en undersøisk ryg', geo: [-19, 64.95], drej: -14, vip: 48, zoom: 1,
    tekst: 'Island er den del af Den Midtatlantiske Ryg, der når over havet. Drej øen og følg landskabet videre ned på havbunden.',
    se: 'Slå havbunden fra og til. Hvor meget af landskabet skjuler havet?' },
  { titel: 'Her kommer ryggen i land', geo: [-22.25, 63.95], drej: -38, vip: 42, zoom: 2.8,
    tekst: 'På Reykjanes møder den undersøiske ryg Island. De lange omrids viser kortlagte sprækkesværme og vulkaner. Sprækkerne i selve terrænet er for små til dette højdegitter.',
    se: 'Følg de orange vulkansystemer. Hvordan ligger de i forhold til den røde pladegrænse?' },
  { titel: 'Vulkaner under en jøkel', geo: [-17.3, 64.55], drej: 18, vip: 40, zoom: 2.5,
    tekst: 'Ved Vatnajökull ligger blandt andet Bárðarbunga og Grímsvötn. Højdedataene viser her jøklens overflade. Vulkanernes kortlagte omrids er lagt oven på den.',
    se: 'Sammenlign landskab og vulkansystemer. Højdefarverne fortæller ikke i sig selv, hvor isen ligger.' },
  { titel: 'Bjergkæden fortsætter under havet', geo: [-24.3, 63.35], drej: -34, vip: 35, zoom: 2.1,
    tekst: 'Reykjanesryggen er en del af Den Midtatlantiske Ryg. Den hæver sig over den omgivende havbund og fortsætter mod Island. Vandet skjuler normalt dette landskab.',
    se: 'Slå «Vis havbund» fra og til. Følg ryggens retning mod Reykjanes.' }
];
let ctx, terraen, data, flader, graenser = [], vulkanlinjer = [], navne = [], W = 0, H = 0, skala = 1;
let raster;
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
function beregnFarver() {
  flader = terraen.flader.map(ids => {
    const [a,b,c] = ids.map(i => terraen.punkter[i]);
    const u = [b[0]-a[0], (b[1]-a[1])/1000*tilstand.faktor, b[2]-a[2]], v = [c[0]-a[0], (c[1]-a[1])/1000*tilstand.faktor, c[2]-a[2]];
    let n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
    if (n[1] < 0) n = n.map(x => -x);
    const l = Math.hypot(...n), lys = .66 + .38 * Math.max(0, (-.45*n[0]+.82*n[1]-.35*n[2])/l);
    const z = (a[1]+b[1]+c[1])/3;
    return { ids, z, farve: pakFarve(farve(z, lys)) };
  });
}
function projektion() {
  const a = kamera.drej * rad, b = kamera.vip * rad;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  return ([x, y, z], over = true) => {
    x -= kamera.x; z -= kamera.z;
    const h = (over && !tilstand.havbund ? Math.max(0, y) : y) / 1000 * tilstand.faktor;
    const rx = x*ca + z*sa, rz = -x*sa + z*ca;
    return [W*.5 + rx*skala*kamera.zoom, H*.52 + (rz*sb-h*cb)*skala*kamera.zoom, rz*cb+h*sb];
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
      const q = p([punkt[0], punkt[1] + 35, punkt[2]]);
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
  const bg = ctx.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#f0f1e6'); bg.addColorStop(.6,'#dde9e3'); bg.addColorStop(1,'#c3dad5');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
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
    const [a,b,c]=f.ids;
    raster.trekant(punkter[a],punkter[b],punkter[c],!tilstand.havbund&&f.z<0?vand:f.farve);
  }
  raster.vis(ctx);
  linjer(terraen.kyst,p,'#d3e4c1',.85);
  if (tilstand.geologi) {
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
  const kandidater=navne.filter(n=>kamera.zoom>1.3||['Hekla','Krafla','Snæfellsjökull','Grímsvötn'].includes(n.navn));
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
  // Synlig sammenligningslængde på terrænets vandrette plan (projektionen er vinkeltro).
  const a=p([kamera.x-50,0,kamera.z]),b=p([kamera.x+50,0,kamera.z]);
  const px=Math.hypot(b[0]-a[0],b[1]-a[1]);
  ctx.font='500 10px "IBM Plex Mono", monospace';ctx.textAlign='left';ctx.fillStyle='#31564d';
  ctx.fillText('ca. 100 km',18,H-82);ctx.lineWidth=1.5;ctx.strokeStyle='#31564d';sti([[18,H-76],[18+px,H-76]]);ctx.stroke();
  revision++;canvas.dataset.revision=revision;
}
const planlaeg = () => { if (!ramme) ramme=requestAnimationFrame(tegn); };
function stopTur() {
  clearTimeout(turTid);tilstand.rundtur=false;document.querySelector('#rundtur').setAttribute('aria-pressed','false');document.querySelector('#rundtur').textContent='▷ Rundtur';stopFlyvning();
}
function stopFlyvning(){cancelAnimationFrame(flyvning);flyvning=0;}
function vaelgSted(i, anim=true) {
  if(!tilstand.klar)return;
  stopFlyvning();tilstand.sted=i;const s=steder[i], [x,z]=terraen.fraGeo(s.geo);
  document.querySelector('#stedsnummer').textContent=`0${i+1} / 04`;
  for(const id of ['stedsnavn','rejsetitel'])document.querySelector('#'+id).textContent=s.titel;
  document.querySelector('#rejsetekst').textContent=s.tekst;document.querySelector('#undersoeg').textContent=s.se;
  document.querySelectorAll('[data-sted]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.sted===i)));
  meddel(s.titel+'. '+s.tekst);
  const fra={...kamera},til={drej:s.drej,vip:s.vip,zoom:s.zoom,x,z};
  fra.drej=til.drej+(((fra.drej-til.drej+180)%360+360)%360-180);
  if(!anim||roligt.matches){Object.assign(kamera,til);planlaeg();return;}
  const start=performance.now();
  const flyv=t=>{const u=klem((t-start)/1000,0,1),f=u*u*(3-2*u);for(const k in til)kamera[k]=fra[k]+(til[k]-fra[k])*f;planlaeg();if(u<1)flyvning=requestAnimationFrame(flyv);else flyvning=0;};
  flyvning=requestAnimationFrame(flyv);
}
function manuel(){stopTur();stopFlyvning();}
document.querySelectorAll('[data-sted]').forEach(b=>b.addEventListener('click',()=>{stopTur();vaelgSted(+b.dataset.sted);}));
document.querySelector('#havbund').addEventListener('click',e=>{manuel();tilstand.havbund=!tilstand.havbund;e.currentTarget.setAttribute('aria-pressed',String(tilstand.havbund));planlaeg();meddel(tilstand.havbund?'Havbunden er synlig. Havniveauet er uændret.':'Havet dækker havbunden.');});
document.querySelector('#geologi').addEventListener('click',e=>{manuel();tilstand.geologi=!tilstand.geologi;e.currentTarget.setAttribute('aria-pressed',String(tilstand.geologi));planlaeg();meddel(tilstand.geologi?'Vulkansystemer og pladegrænse vises.':'Vulkansystemer og pladegrænse er skjult.');});
document.querySelector('#overdrivelse').addEventListener('input',e=>{manuel();tilstand.faktor=+e.target.value;document.querySelector('#faktor').value='×'+tilstand.faktor;if(tilstand.klar)beregnFarver();planlaeg();});
document.querySelector('#rundtur').addEventListener('click',()=>{
  if(tilstand.rundtur){stopTur();meddel('Rundturen er sat på pause.');return;}
  tilstand.rundtur=true;document.querySelector('#rundtur').setAttribute('aria-pressed','true');document.querySelector('#rundtur').textContent='Ⅱ Pause';
  const naeste=()=>{if(!tilstand.rundtur)return;vaelgSted((tilstand.sted+1)%steder.length);turTid=setTimeout(naeste,8500);};naeste();
});
const drej=(a,b=0)=>{manuel();kamera.drej=((kamera.drej+a+180)%360+360)%360-180;kamera.vip=klem(kamera.vip+b,22,78);planlaeg();};
const zoom=d=>{manuel();kamera.zoom=klem(kamera.zoom*d,.65,5);planlaeg();};
document.querySelectorAll('[data-drej]').forEach(b=>b.addEventListener('click',()=>drej(+b.dataset.drej)));
document.querySelector('#zoomind').addEventListener('click',()=>zoom(1.2));document.querySelector('#zoomud').addEventListener('click',()=>zoom(1/1.2));
document.querySelector('#nulstil').addEventListener('click',()=>{manuel();vaelgSted(0);});
canvas.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  const pile={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,5],ArrowDown:[0,-5]};
  if(pile[e.key]){e.preventDefault();drej(...pile[e.key]);}
  else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home'){manuel();vaelgSted(0);}else zoom(e.key==='-'?1/1.2:1.2);}
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
document.addEventListener('keydown',e=>{if(e.key==='Escape'){stopTur();stopFlyvning();document.body.classList.remove('fokus');document.querySelector('#fokus').setAttribute('aria-pressed','false');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTur();stopFlyvning();}});
roligt.addEventListener('change',()=>{stopFlyvning();stopTur();planlaeg();});
function stoerrelse(){const b=figur.getBoundingClientRect();W=Math.round(b.width);H=Math.round(b.height);const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);raster=lavRaster(W,H);ctx.setTransform(d,0,0,d,0,0);const [x0,z0,x1,z1]=terraen.graenser;skala=Math.min(W/((x1-x0)*1.15),H/((z1-z0)*.85+120))*.88;planlaeg();}
try {
  // D3 er et lokalt defer-script; ES-moduler kører efter parseren i samme dokument.
  if(!globalThis.d3)throw new Error('Kortbiblioteket mangler');
  ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D mangler');
  const [meta,svar,pg]=await Promise.all([fetch('data/islandskort.json'),fetch('data/islandskort-hoejde.bin'),fetch('../data/pladegraenser.json').catch(()=>null)]);
  if(!meta.ok||!svar.ok)throw new Error('Terrændata mangler');
  data=await meta.json();terraen=lavTerraen(data,await svar.arrayBuffer(),d3);beregnFarver();
  const renderPunkt = lonlat => {const [x,z]=terraen.fraGeo(lonlat),y=terraen.modelHoejdeVed(x,z);return y==null?null:[x,y,z];};
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
} catch(fejl) {
  stopTur();fejltekst.classList.add('fejl');fejltekst.replaceChildren('3D-landskabet kunne ikke vises. ',Object.assign(document.createElement('a'),{href:'kort.html',textContent:'Åbn kortet og forklaringen →'}));
  betjening.forEach(b=>{b.disabled=true;});
}
export const proeve={kamera,tilstand,terraen:()=>terraen,projektion:()=>projektion(),steder};
