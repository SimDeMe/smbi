import {former, trin} from './indhold.js';
const $ = id => document.getElementById(id);
const lærred = $('scene'), ctx = lærred.getContext('2d');
const mindreBevægelse = matchMedia('(prefers-reduced-motion: reduce)');
const farve = {ink:'#25463f',pink:'#d6497c',hoved:'#eb87a7',hale:'#be8195',vand:'#eef6f2',cyto:'#fbeae5',blaa:'#168aa6',orange:'#ca7138',protein:'#7560a1',gul:'#e1a743'};
let aktueltTrin=0, tid=0, kører=false, sidst=0, W=1000, H=500, skala=1, offsetX=0, offsetY=0;
const varighed = () => aktueltTrin===1 ? 2.4 : 12;
const type = () => aktueltTrin===5 ? $('transport').value : ({2:'diffusion',3:'exo',4:'endo'}[aktueltTrin] || '');
const energi = () => !['pumpe','exo','endo'].includes(type()) || $('energi').checked;
const protein = () => !['kanal','baerer'].includes(type()) || $('protein').checked;
const clamp = (t,a=0,b=1) => Math.max(a,Math.min(b,t));
const glat = t => {t=clamp(t);return t*t*(3-2*t);};
const bland = (a,b,t) => a+(b-a)*t;
const tilfældig = n => {const x=Math.sin(n*78.233+43.12)*43758.5453;return x-Math.floor(x);};
function linje(punkter,farveStreg=farve.ink,bredde=2){ctx.beginPath();punkter.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=farveStreg;ctx.lineWidth=bredde;ctx.stroke();}
function cirkel(x,y,r,fyld,streg=farve.ink,bredde=1.5){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fyld;ctx.fill();if(streg){ctx.strokeStyle=streg;ctx.lineWidth=bredde;ctx.stroke();}}
function tekst(t,x,y,str=20,farveTekst=farve.ink,align='left'){ctx.font=`500 ${str}px Archivo, system-ui, sans-serif`;ctx.fillStyle=farveTekst;ctx.textAlign=align;ctx.fillText(t,x,y);}
function etiket(t,x,y,tx,ty){tekst(t,x,y,21);linje([[x,y+7],[tx,ty]],'#7f948c',1);cirkel(tx,ty,3,farve.ink,null);}
function pil(x1,y1,x2,y2,label){const a=Math.atan2(y2-y1,x2-x1);linje([[x1,y1],[x2,y2]],farve.ink,3);linje([[x2-12*Math.cos(a-.5),y2-12*Math.sin(a-.5)],[x2,y2],[x2-12*Math.cos(a+.5),y2-12*Math.sin(a+.5)]],farve.ink,3);if(label)tekst(label,(x1+x2)/2+18,(y1+y2)/2,18);}
function molekyle(x,y,art='o2',størrelse=1){ctx.save();ctx.translate(x,y);ctx.scale(størrelse,størrelse);
 if(art==='insulin'||art==='last'){for(let i=0;i<7;i++){const a=i*2.4;cirkel(Math.cos(a)*9,Math.sin(a)*7,5,art==='insulin'?'#b75c91':'#d9a145',farve.ink,1);} }
 else if(art==='ion'){cirkel(0,0,11,'#b6a5d8');tekst('+',0,6,19,farve.ink,'center');}
 else if(art==='glukose'){ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;const x=Math.cos(a)*13,y=Math.sin(a)*13;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fillStyle='#f2c65f';ctx.fill();ctx.strokeStyle=farve.ink;ctx.lineWidth=1.5;ctx.stroke();}
 else if(art==='vand'){cirkel(-6,5,4,'#fff',farve.blaa,1);cirkel(6,5,4,'#fff',farve.blaa,1);cirkel(0,0,7,'#70bfd0',farve.blaa,1);}
 else if(art==='co2'){cirkel(-10,0,6,'#e6a16e');cirkel(0,0,6,'#6f817b');cirkel(10,0,6,'#e6a16e');}
 else{cirkel(-5,0,7,'#63b7c6',farve.blaa,1.5);cirkel(5,0,7,'#63b7c6',farve.blaa,1.5);}ctx.restore();}
function mitochondrie(x,y,rotation){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.beginPath();ctx.ellipse(0,0,45,23,0,0,Math.PI*2);ctx.fillStyle='#eabe77';ctx.fill();ctx.strokeStyle='#a16d31';ctx.lineWidth=3;ctx.stroke();linje([[-31,0],[-23,-12],[-12,12],[0,-12],[12,12],[23,-10],[32,2]],'#a16d31',3);ctx.restore();}
function dyrecelle(zoom=0){const cx=W/2,cy=250;ctx.save();ctx.translate(cx,85);ctx.scale(1+zoom*5,1+zoom*5);ctx.translate(-cx,-85);
 ctx.beginPath();ctx.ellipse(cx,cy,215,173,-.07,0,Math.PI*2);ctx.fillStyle=farve.cyto;ctx.fill();ctx.strokeStyle='#cb628a';ctx.lineWidth=11;ctx.stroke();ctx.strokeStyle='#f4b8c9';ctx.lineWidth=4;ctx.stroke();
 cirkel(cx-30,245,62,'#bdacd5','#796394',4);cirkel(cx-13,249,23,'#8e72ac','#796394',2);cirkel(cx-49,218,6,'#d7c7e6',null);
 // Endoplasmatisk retikulum omkring kernen, med ribosomer.
 for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(cx-118-j*6,190+j*26);ctx.bezierCurveTo(cx-95,163+j*29,cx-105,322+j*13,cx+12,332+j*9);ctx.strokeStyle='#a793c1';ctx.lineWidth=8;ctx.stroke();for(let i=0;i<4;i++)cirkel(cx-116+j*14+i*11,196+j*27+i*13,2.5,farve.ink,null);}
 mitochondrie(cx+115,197,.4);mitochondrie(cx+93,335,-.3);mitochondrie(cx-122,327,.5);
 for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(cx+103+j*4,260,30+j*5,10+j*6,.2,0,Math.PI);ctx.strokeStyle='#db8e6c';ctx.lineWidth=6;ctx.stroke();}
 [[155,280],[139,300],[-110,160],[32,140]].forEach(([x,y],i)=>cirkel(cx+x,y,10+i*2,'#e6c3a3','#b28a67',2));
 for(let i=0;i<20;i++){const a=i*2.4;cirkel(cx+Math.cos(a)*(135+25*tilfældig(i)),cy+Math.sin(a)*125,2.7,'#8e6b84',null);}
 ctx.restore();
 if(zoom===0){const petit=W<700;etiket('Cellekerne',cx-245,240,cx-60,237);etiket('Mitokondrie',cx+75,122,cx+115,182);etiket('Golgiapparat',cx+115,382,cx+115,286);if(!petit)etiket('Ru ER',cx-310,350,cx-115,291);
 ctx.setLineDash([6,5]);ctx.strokeStyle=farve.pink;ctx.lineWidth=2;ctx.strokeRect(cx-40,58,85,49);ctx.setLineDash([]);tekst('Cellemembran',cx+70,58,22);linje([[cx+66,64],[cx+43,78]],farve.pink,2);tekst('DYRECELLE',32,42,18,'#6a7771');}
}
// To rækker fosfolipider langs samme midterkurve. Haler vender ind mod midten.
function lipid(x,y,nx,ny,side){const hx=x+nx*side*16,hy=y+ny*side*16,tx=-ny,ty=nx;for(const d of [-2.8,2.8])linje([[hx+tx*d-nx*side*4,hy+ty*d-ny*side*4],[x+tx*(d+2)+nx*side*4,y+ty*(d+2)+ny*side*4],[x+tx*d+nx*side*1,y+ty*d+ny*side*1]],farve.hale,2);cirkel(hx,hy,5.8,farve.hoved,'#a95172',1);}
function lipider(punkter,lukket=false){let rest=0;const p=lukket?[...punkter,punkter[0]]:punkter;for(let i=1;i<p.length;i++){const [ax,ay]=p[i-1],[bx,by]=p[i],dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy);if(d===0)continue;let afstand=rest;for(;afstand<d;afstand+=15){const t=afstand/d,x=bland(ax,bx,t),y=bland(ay,by,t);lipid(x,y,-dy/d,dx/d,1);lipid(x,y,-dy/d,dx/d,-1);}rest=afstand-d;}}
function bezier(a,b,c,d){const p=[];for(let i=0;i<=36;i++){const t=i/36,u=1-t;p.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}return p;}
function membran(bud=0,åbning=15,proteinHul=false){const cx=W/2;let p;
 if(bud>1){const dybde=bud,halv=Math.max(åbning,60*clamp(bud/100));p=[[-20,250],[cx-åbning-25,250],...bezier([cx-åbning-25,250],[cx-åbning,250],[cx-åbning,265],[cx-halv,250+dybde*.5]),...bezier([cx-halv,250+dybde*.5],[cx-halv-25,250+dybde],[cx+halv+25,250+dybde],[cx+halv,250+dybde*.5]),...bezier([cx+halv,250+dybde*.5],[cx+åbning,265],[cx+åbning,250],[cx+åbning+25,250]),[W+20,250]];}
 else p=[[-20,250],[W+20,250]];
 ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(W+20,0);ctx.lineTo(W+20,250);for(let i=p.length-1;i>=0;i--)ctx.lineTo(...p[i]);ctx.closePath();ctx.fillStyle=farve.vand;ctx.fill();
 ctx.beginPath();ctx.moveTo(...p[0]);p.slice(1).forEach(pt=>ctx.lineTo(...pt));ctx.lineTo(W+20,H);ctx.lineTo(-20,H);ctx.closePath();ctx.fillStyle=farve.cyto;ctx.fill();
 if(proteinHul){lipider([[-20,250],[cx-39,250]]);lipider([[cx+39,250],[W+20,250]]);}else lipider(p);
 tekst('UDENFOR CELLEN',24,35,18,'#576e65');tekst('CYTOPLASMA',24,H-42,18,'#82665f');
}
function vesikel(x,y,r=65){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=farve.vand;ctx.fill();const p=[];for(let i=0;i<100;i++){const a=i*Math.PI*2/100;p.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}lipider(p,true);}
function indholdVesikel(x,y,art,spredning=1){for(let i=0;i<6;i++){const a=i*2.4; molekyle(x+Math.cos(a)*26*spredning,y+Math.sin(a)*23*spredning,art,.8);}}
function tegnProtein(art,åbent=true){const cx=W/2;ctx.save();ctx.translate(cx,250);const sving=Math.sin(tid*2)*3;
 if(art==='baerer'||art==='pumpe'){const fase=(tid%4)/4,retning=art==='pumpe'?-1:($('gradient').value==='ud'?-1:1),modsat=art!=='pumpe'&&($('gradient').value==='lige'?Math.floor(tid/4)%2===0:Math.floor(tid/4)%4===3),kildeTop=(modsat?-retning:retning)===1,vender=fase<.5?kildeTop:!kildeTop;ctx.beginPath();ctx.moveTo(-34,-49);ctx.bezierCurveTo(-68,-35,-58,35,-33,49);ctx.lineTo(33,49);ctx.bezierCurveTo(58,30,68,-35,34,-49);ctx.closePath();ctx.fillStyle=åbent?'#b3a2cf':'#d7d0df';ctx.fill();ctx.strokeStyle=farve.protein;ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.moveTo(0,vender?-51:51);ctx.quadraticCurveTo(vender?12:-12,vender?-20:20,0,0);ctx.strokeStyle=farve.vand;ctx.lineWidth=19;if(fase<.44||fase>.56)ctx.stroke();cirkel(0,0,13,farve.vand,null);}
 else{for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(s*(åbent?30:18),0,19,52+sving,0,0,Math.PI*2);ctx.fillStyle=åbent?'#b3a2cf':'#d7d0df';ctx.fill();ctx.strokeStyle=farve.protein;ctx.lineWidth=3;ctx.stroke();}if(!åbent)linje([[-22,0],[22,0]],farve.protein,14);}
 ctx.restore();}
function vesikelProces(art){const cx=W/2,p=clamp(tid/12),exo=art==='exo',e=energi();let q=exo?p:1-p;if(!e)q=exo?0:1;
 if(q<.3){membran();const vy=bland(407,337,glat(q/.3));vesikel(cx,vy);indholdVesikel(cx,vy,exo?'insulin':'last');}
 else if(q<.78){const f=glat((q-.3)/.48),dybde=bland(148,0,f),åbning=bland(14,75,f);membran(dybde,åbning);const cy=bland(340,150,glat(f/.65));indholdVesikel(cx,cy,exo?'insulin':'last',1+glat((f-.55)/.45)*1.8);}
 else{membran();const f=glat((q-.78)/.22);indholdVesikel(cx,bland(150,100,f),exo?'insulin':'last',2.8+f*2);}
 const label=exo?'Insulin · protein':'Materiale + væske';tekst(label,cx+105,exo&&q<.3?400:135,21);if(q<.3)tekst('Vesikel',cx+110,357,20);if(q>=.3&&q<.78)tekst(exo?'Membranerne fusionerer':'Membranen danner en indbugtning',cx,65,22,farve.ink,'center');
 if(!e)tekst('Ingen energi → processen standser',cx,H-60,21,'#9a3156','center');
}
function statiskeMolekyler(art,grad,osmose=false){for(let side=0;side<2;side++){const høj=grad==='lige'?false:(grad==='ind'?side===0:side===1),antal=grad==='lige'?9:høj?16:5;for(let i=0;i<antal;i++){let x=50+tilfældig(i+side*63)*(W-100),y=side===0?75+tilfældig(i+20)*95:335+tilfældig(i+70)*90;if(Math.abs(x-W/2)<65)x+=95;const r=tid*.6+i;molekyle(x+Math.sin(r)*3,y+Math.cos(r)*3,osmose?'glukose':art,osmose?.85:.8);}}
}
function transportProces(){const art=type(),intro=aktueltTrin===2,grad=aktueltTrin===5?$('gradient').value:'ind',cx=W/2;
 const osmose=art==='osmose',pumpe=art==='pumpe',harProtein=['kanal','baerer','osmose','pumpe'].includes(art),åben=protein()&&energi();
 membran(0,0,harProtein);if(harProtein)tegnProtein(art,åben);
 let molekyleArt=art==='diffusion'?'o2':art==='baerer'?'glukose':osmose?'vand':'ion';
 statiskeMolekyler(molekyleArt,pumpe?'ind':grad,osmose);
 if(intro){for(let i=0;i<7;i++)molekyle(60+tilfældig(i+99)*(W-120),340+tilfældig(i+88)*80,'co2',.8);}
 // Faste, modsatrettede spor illustrerer tilfældig bevægelse og nettotransport.
 // Antal og koncentrationer er skematiske og genopfyldes, ikke en partikelsimulering.
 const retning=pumpe?-1:(grad==='ud'?-1:1)*(osmose?-1:1);
 const bærer=art==='baerer'||pumpe,antal=bærer?1:harProtein?8:14;
 for(let i=0;i<antal;i++){
  const spor=bærer?Math.floor(tid/4):i,modsat=!pumpe&&(grad==='lige'?spor%2===0:bærer?spor%4===3:spor%4===0),dir=modsat?-retning:retning;
  let f=(tid/4+i/antal)%1;if(bærer)f=f<.3?bland(0,.5,f/.3):f<.65?.5:bland(.5,1,(f-.65)/.35);if(!åben)f=Math.min(f,.28);
  let x=harProtein?cx:(60+(i+.5)/antal*(W-120));const y=dir===1?bland(100,410,f):bland(410,100,f);
  if(bærer)x+=Math.sin(f*Math.PI*2)*6;
  molekyle(x,y,molekyleArt,.9);
 }
 if(intro){for(let i=0;i<8;i++){const dir=i%4===0?1:-1,f=(tid/4+i/8)%1;molekyle(90+i*(W-180)/8,dir===1?bland(100,410,f):bland(410,100,f),'co2',.8);}molekyle(W-167,65,'o2');tekst('O₂',W-143,72,20);molekyle(W-91,65,'co2');tekst('CO₂',W-66,72,20);pil(W-75,180,W-75,305);tekst('O₂ netto ind',W-210,345,18);pil(75,305,75,180);tekst('CO₂ netto ud',30,152,18);}
 else if(!åben){tekst(pumpe?'ATP mangler → pumpen standser':'Ingen passage gennem proteinet',cx,65,21,'#9a3156','center');}
 else if(grad==='lige'&&!pumpe){tekst('Begge veje · ingen nettotransport',cx,65,21,farve.ink,'center');pil(W-95,170,W-95,320);pil(W-60,320,W-60,170);}
 else{const px=W-75;pil(px,retning===1?175:325,px,retning===1?325:175);tekst(osmose?'Vand netto':pumpe?'Ioner mod højere koncentration':'Nettotransport',W-22,365,18,farve.ink,'right');}
 if(pumpe){tekst(energi()?'ATP → ADP + Pᵢ':'ATP slået fra',cx+82,300,20,energi()?'#77521a':'#9a3156');tekst('Flere ioner',30,80,18);tekst('Færre ioner',30,395,18);}
 else if(osmose){tekst('Opløste stoffer passerer ikke',cx,460,18,farve.ink,'center');molekyle(W-95,65,'vand');tekst('H₂O',W-76,72,20);}
 else if(harProtein)tekst(art==='baerer'?'Bærerprotein': 'Kanalprotein',cx+65,300,20);
}
function tegn(){const r=lærred.getBoundingClientRect();if(!r.width||!ctx)return;const dpr=Math.min(devicePixelRatio||1,2);if(lærred.width!==Math.round(r.width*dpr)||lærred.height!==Math.round(r.height*dpr)){lærred.width=Math.round(r.width*dpr);lærred.height=Math.round(r.height*dpr);}W=Math.max(600,r.width/r.height*500);H=500;skala=Math.min(r.width/W,r.height/H);offsetX=(r.width-W*skala)/2;offsetY=(r.height-H*skala)/2;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#f4f8f5';ctx.fillRect(0,0,r.width,r.height);ctx.translate(offsetX,offsetY);ctx.scale(skala,skala);
 if(aktueltTrin===0)dyrecelle();
 else if(aktueltTrin===1){const z=glat(tid/1.8);if(z<1){dyrecelle(z);ctx.globalAlpha=glat((z-.45)/.55);}membran();ctx.globalAlpha=1;const cx=W/2;if(z>.8){etiket('Hydrofile hoveder',cx-230,165,cx-160,234);etiket('Hydrofobe haler',cx+25,350,cx+70,251);tekst('Vand udenfor',W-30,110,21,farve.ink,'right');tekst('Vand i cytoplasmaet',W-30,400,21,farve.ink,'right');}}
 else if(['exo','endo'].includes(type()))vesikelProces(type());else transportProces();
}
function faseTekst(){const t=type();if(aktueltTrin===0)return 'Vælg “Zoom ind på membranen” for at begynde.';if(aktueltTrin===1)return tid<1.8?'Vi zoomer ind på cellens ydre grænse.':'Hovederne vender mod vandet. Halerne vender mod hinanden.';
 if(!energi())return 'Energien er slået fra. Den energikrævende transport er standset.';
 if(!protein())return 'Transportproteinet er utilgængeligt. Molekylerne kan ikke passere lipidlaget direkte.';
 if(t==='exo')return tid<3.6?'En membranvesikel med insulin nærmer sig cellemembranen.':tid<9.36?'Vesiklen åbner sig mod ydersiden. Insulinet frigives gennem åbningen.':'Insulinet er frigivet. Vesiklens membran er blevet en del af cellemembranen.';
 if(t==='endo')return tid<2.64?'Materialet befinder sig udenfor cellen.':tid<8.4?'Membranen omslutter materialet. Vesiklens hals bliver smallere.':'Vesiklen er afsnøret. Materialet er inde i cellen, omsluttet af membran.';
 if(t==='pumpe')return 'ATP driver transport fra få ioner indenfor til flere ioner udenfor.';
 const g=aktueltTrin===5?$('gradient').value:'ind';if(g==='lige')return 'Molekyler passerer stadig begge veje. Lige store strømme giver ingen nettotransport.';
 if(t==='osmose')return `Vand bevæger sig netto ${g==='ind'?'ud af':'ind i'} cellen, mod flest opløste stoffer.`;
 if(aktueltTrin===2)return 'O₂ bevæger sig netto ind. CO₂ bevæger sig netto ud. Begge passerer også den modsatte vej.';
 return `Nettotransport ${g==='ind'?'ind i':'ud af'} cellen. Der passerer også molekyler den modsatte vej.`;
}
function status(){const s=faseTekst();if($('status').textContent!==s)$('status').textContent=s;$('afspil').textContent=kører?'Pause':tid>=varighed()?'Afspil igen':'Afspil';}
function indstilIndhold(){document.body.dataset.visning=String(aktueltTrin);const data=aktueltTrin===5?former[type()]:trin[aktueltTrin];$('kategori').textContent=data.kategori;$('overskrift').textContent=data.titel;$('forklaring').textContent=data.tekst;$('spoergsmaal').textContent=data.spoerg;
 $('teori-tekst').textContent=data.tekst;$('transport-teori').hidden=aktueltTrin!==5;$('valg').hidden=aktueltTrin!==5;const aktiv=['pumpe','exo','endo'].includes(type());$('gradient-felt').hidden=aktiv;$('energi-felt').hidden=!aktiv;$('protein-felt').hidden=!['kanal','baerer'].includes(type());$('protein-navn').textContent=type()==='baerer'?'Bærerprotein til stede':'Ionkanal åben';$('stof').textContent=data.stof||'O₂';
 lærred.setAttribute('aria-label',aktueltTrin===0?'Dyrecelle med cellekerne og organeller':data.titel+'. '+data.tekst);
 document.querySelectorAll('[data-trin]').forEach(b=>{if(Number(b.dataset.trin)===aktueltTrin)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 $('forrige').disabled=aktueltTrin===0;$('naeste').disabled=aktueltTrin===5;$('naeste').textContent=aktueltTrin===0?'Zoom ind på membranen →':aktueltTrin===4?'Undersøg selv →':'Næste →';$('afspil').disabled=aktueltTrin===0;$('deltrin').disabled=aktueltTrin===0;status();tegn();}
function vælgTrin(n){aktueltTrin=n;tid=0;$('energi').checked=true;$('protein').checked=true;kører=n>0&&!mindreBevægelse.matches;indstilIndhold();}
function ændring(){tid=0;kører=!mindreBevægelse.matches;indstilIndhold();}
function frame(nu){const dt=sidst?Math.min((nu-sidst)/1000,.08):0;sidst=nu;if(kører){if(energi())tid=Math.min(tid+dt,varighed());if(tid>=varighed())kører=false;tegn();status();}requestAnimationFrame(frame);}
 document.querySelectorAll('[data-trin]').forEach(b=>b.addEventListener('click',()=>vælgTrin(Number(b.dataset.trin))));
 $('naeste').addEventListener('click',()=>vælgTrin(Math.min(5,aktueltTrin+1)));$('forrige').addEventListener('click',()=>vælgTrin(Math.max(0,aktueltTrin-1)));
 $('transport').addEventListener('change',()=>{$('energi').checked=true;$('protein').checked=true;ændring();});$('gradient').addEventListener('change',ændring);
 $('energi').addEventListener('change',()=>{status();tegn();});$('protein').addEventListener('change',()=>{status();tegn();});
 $('afspil').addEventListener('click',()=>{if(tid>=varighed())tid=0;kører=!kører;status();tegn();});$('gentag').addEventListener('click',()=>{tid=0;kører=aktueltTrin>0&&!mindreBevægelse.matches;status();tegn();});$('deltrin').addEventListener('click',()=>{kører=false;if(energi())tid=Math.min(tid+varighed()/8,varighed());status();tegn();});
 function fokus(til){document.body.classList.toggle('fokus',til);$('fokus').setAttribute('aria-pressed',String(til));requestAnimationFrame(tegn);} $('fokus').addEventListener('click',()=>fokus(!document.body.classList.contains('fokus')));document.addEventListener('keydown',e=>{if(e.key==='Escape')fokus(false);});
 mindreBevægelse.addEventListener('change',()=>{if(mindreBevægelse.matches){kører=false;status();}});
 new ResizeObserver(tegn).observe(lærred);document.fonts.ready.then(tegn);indstilIndhold();requestAnimationFrame(frame);
