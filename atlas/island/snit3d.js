// Gennemskåret blok af SAMME terræn som landskabet. Magmaområdernes dybder
// er kildeankre, men konturer og gange er en illustrativ rekonstruktion.
import { pakFarve } from './raster.js';
import { SNIT } from './snitdata.js';

export function lavSnit(terraen, id) {
  const valg=SNIT.find(s=>s.id===id)||SNIT[0];
  const a=terraen.fraGeo(valg.ankre[0]),b=terraen.fraGeo(valg.ankre[1]);
  const l=Math.hypot(b[0]-a[0],b[1]-a[1]),u=[(b[0]-a[0])/l,(b[1]-a[1])/l],v=[-u[1],u[0]];
  const midte=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const world=(s,y,t=0)=>[midte[0]+s*u[0]+t*v[0],y,midte[1]+s*u[1]+t*v[1]];
  const lokal=geo=>{const [x,z]=terraen.fraGeo(geo);return [(x-midte[0])*u[0]+(z-midte[1])*u[1],(x-midte[0])*v[0]+(z-midte[1])*v[1]];};
  const hoejde=(s,t=0)=>{const [x,,z]=world(s,0,t);return terraen.modelHoejdeVed(x,z);};
  const overflade=(s,t=0)=>{const h=hoejde(s,t);if(h==null)throw new Error('Snit uden for terræn');return world(s,h,t);};
  const punkter=[],top=[],klipper=[],forvæg=[],nx=110,nz=40;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)punkter.push(overflade(-valg.halv+2*valg.halv*i/nx,-valg.bag*j/nz));
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1;top.push([punkter[a],punkter[c],punkter[b]],[punkter[b],punkter[c],punkter[c+1]]);}
  const bund=-valg.bund*1000;
  function væg(s1,t1,s2,t2,antal,front=false){
    let før;
    for(let i=0;i<=antal;i++){
      const f=i/antal,s=s1+(s2-s1)*f,t=t1+(t2-t1)*f,h=hoejde(s,t),søjle=[];
      for(let j=0;j<=32;j++)søjle.push(world(s,h+(bund-h)*j/32,t));
      if(før)for(let j=0;j<32;j++){
        const dybde=-(søjle[j][1]+søjle[j+1][1])/2000;
        const stribe=j%4===0?4:0,støj=Math.sin(i*73+j*31)*2;
        const farve=dybde<.6?[104,111,100]:[35+dybde*.55+stribe+støj,49+dybde*.28+stribe,49+dybde*.15+stribe];
        const f=pakFarve(`rgb(${farve.map(x=>Math.round(x)).join(',')})`);
        const r={a:før[j],b:søjle[j],c:søjle[j+1],farve:f},q={a:før[j],b:søjle[j+1],c:før[j+1],farve:f};
        klipper.push(r,q);if(front)forvæg.push(r,q);
      }
      før=søjle;
    }
  }
  væg(-valg.halv,0,valg.halv,0,nx,true);væg(-valg.halv,-valg.bag,valg.halv,-valg.bag,nx);
  væg(-valg.halv,0,-valg.halv,-valg.bag,nz);væg(valg.halv,0,valg.halv,-valg.bag,nz);
  const kamre=valg.kamre.map(k=>{const [s,afstand]=lokal(k.geo),terræn=hoejde(s);const y=(k.datum==='hav'?0:terræn)-k.dybde*1000;return {...k,s,y,afstand,punkt:world(s,y,.12),terræn};});
  const find=id=>kamre.find(k=>k.id===id);
  const gange=valg.gange.map((g,i)=>{
    const fra=Array.isArray(g.fra)?[g.fra[0],-g.fra[1]*1000]:[find(g.fra).s,find(g.fra).y];
    const til=g.til==='overflade'?[find(g.fra).s,find(g.fra).terræn]:[find(g.til).s,find(g.til).y];
    const punkter=[];
    for(let j=0;j<=60;j++){
      const f=j/60,bue=Math.sin(f*Math.PI)*(g.slags==='ud'?1.8:3)*(i%2?1:-1);
      punkter.push(world(fra[0]+(til[0]-fra[0])*f+bue,fra[1]+(til[1]-fra[1])*f,.18));
    }
    return {punkter,slags:g.slags};
  });
  const bredde=valg.halv*2;
  return {valg,world,lokal,overflade,hoejde,punkter,top,klipper,forvæg,kamre,gange,bund,bredde,
    retning:Math.atan2(u[1],u[0])*180/Math.PI-12,midte,normal:v,
    // Endepunkter i lon/lat til tekst/kort og uafhængig geometritest.
    endepunkter:[-valg.halv,valg.halv].map(s=>{const [x,,z]=world(s,0);return terraen.tilGeo(x,z);})};
}

export function tegnSnit({ctx,raster,p,snit,terrænfarve,bredde:W,hoejde:H,terraen,farvenøgle=0,tid=0,spiller=false}) {
  raster.nulstil();
  for(const t of snit.klipper)raster.trekant(p(t.a,false),p(t.b,false),p(t.c,false),t.farve);
  if(snit.farvenøgle!==farvenøgle){snit.topfarver=snit.top.map(t=>terrænfarve(t,t.reduce((s,q)=>s+q[1],0)/3));snit.farvenøgle=farvenøgle;}
  snit.top.forEach((t,i)=>raster.trekant(...t.map(q=>p(q,false)),snit.topfarver[i]));
  raster.vis(ctx);
  const synlig=q=>raster.synlig(p(q,false));
  const tegnLinje=(punkter,farve,bredde,skygge=0)=>{
    ctx.beginPath();let startet=false;
    for(const q of punkter){const v=p(q,false);if(!synlig(q)){startet=false;continue;}if(startet)ctx.lineTo(v[0],v[1]);else{ctx.moveTo(v[0],v[1]);startet=true;}}
    ctx.strokeStyle=farve;ctx.lineWidth=bredde;ctx.lineCap='round';ctx.shadowColor='#ff652c';ctx.shadowBlur=skygge;ctx.stroke();ctx.shadowBlur=0;
  };
  // En varm kontur langs snittets faktiske overkant gør koblingen til landskabet tydelig.
  const kant=Array.from({length:180},(_,i)=>snit.overflade(-snit.valg.halv+snit.bredde*i/179));
  tegnLinje(kant,'#f1ca91',1.2,3);
  for(const g of snit.gange){
    tegnLinje(g.punkter,'#7e331e',7,12);tegnLinje(g.punkter,'#ef7736',3.8);tegnLinje(g.punkter,'#ffd88b',1.1);
    if(spiller)for(let i=0;i<4;i++){
      const f=(tid*.13+i/4)%1,k=Math.floor(f*(g.punkter.length-1)),q=g.punkter[k];if(!synlig(q))continue;
      const v=p(q,false);ctx.shadowColor='#ffcf74';ctx.shadowBlur=10;ctx.fillStyle='#fff5cf';ctx.beginPath();ctx.arc(v[0],v[1],2.1,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }
  }
  const etiketter=[];
  for(const k of snit.kamre){
    if(!synlig(k.punkt))continue;
    const punkter=[];
    for(let i=0;i<64;i++){const a=i/64*Math.PI*2,r=1+.1*Math.sin(a*5+k.s);punkter.push(p(snit.world(k.s+Math.cos(a)*k.rx*1.4*r,k.y+Math.sin(a)*k.ry*1200*r,.22),false));}
    ctx.save();ctx.beginPath();punkter.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();
    const midt=p(k.punkt,false),g=ctx.createRadialGradient(midt[0],midt[1],0,midt[0],midt[1],Math.max(12,Math.abs(punkter[0][0]-midt[0])*1.3));
    g.addColorStop(0,'#ffe6a2');g.addColorStop(.4,'#ffa53f');g.addColorStop(1,'#c64a26');ctx.fillStyle=g;ctx.shadowColor='#ff762e';ctx.shadowBlur=22;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ffb45b';ctx.lineWidth=1.4;ctx.stroke();
    // Mørke krystaller i den lyse smelte: kamrene er ikke tomme huler af ren væske.
    ctx.clip();ctx.fillStyle='#5c3f2bb5';
    const xs=punkter.map(q=>q[0]),ys=punkter.map(q=>q[1]),xmin=Math.min(...xs),ymin=Math.min(...ys),xmax=Math.max(...xs),ymax=Math.max(...ys);
    for(let i=0;i<18;i++){const x=xmin+((i*37%101)/101)*(xmax-xmin),y=ymin+((i*61%97)/97)*(ymax-ymin);ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x+1,y-3);ctx.lineTo(x+3,y+2);ctx.closePath();ctx.fill();}ctx.restore();
    etiketter.push({k,x:midt[0],y:midt[1],højre:Math.max(...xs),venstre:Math.min(...xs)});
  }
  // En fast skala ved snitkanten bruger havniveau som fælles reference.
  const skalaS=snit.valg.halv-2;
  ctx.font='500 10px "IBM Plex Mono",monospace';ctx.textAlign='left';
  for(const d of [0,5,10,15,20,25]){
    const q=snit.world(skalaS,-d*1000,.25);if(!synlig(q))continue;const v=p(q,false);
    ctx.strokeStyle='#b8bcb066';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(v[0]-5,v[1]);ctx.lineTo(v[0]+3,v[1]);ctx.stroke();ctx.fillStyle='#d7daca';ctx.fillText(d+' km',v[0]-40,v[1]+3);
  }
  // Labels med korte linjer; selve dybden står også i det almindelige HTML-panel.
  ctx.font='600 12px Archivo,sans-serif';ctx.textAlign='left';
  const optaget=etiketter.map(e=>[e.venstre-6,e.y-13,e.højre+6,e.y+13]);
  for(const e of etiketter){
    const bredde=Math.max(ctx.measureText(e.k.navn).width,ctx.measureText(e.k.label).width)+20;
    const kandidater=[[e.højre+12,e.y-20],[e.venstre-bredde-12,e.y-20],[e.x-bredde/2,e.y+25],[e.x-bredde/2,e.y-65]];
    const pos=kandidater.find(([x,y])=>x>10&&x+bredde<W-10&&y>87&&y+42<H-85&&!optaget.some(r=>x<r[2]&&x+bredde>r[0]&&y<r[3]&&y+42>r[1]));
    if(!pos)continue;const [x,y]=pos;optaget.push([x,y,x+bredde,y+42]);
    ctx.strokeStyle='#ffc27a99';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(Math.max(x,Math.min(x+bredde,e.x)),y+20);ctx.stroke();
    ctx.fillStyle='#14282be8';ctx.beginPath();ctx.roundRect(x,y,bredde,42,5);ctx.fill();ctx.fillStyle='#fff2d7';ctx.font='600 12px Archivo,sans-serif';ctx.fillText(e.k.navn,x+9,y+16);ctx.fillStyle='#f5b878';ctx.font='500 10px "IBM Plex Mono",monospace';ctx.fillText(e.k.label,x+9,y+32);ctx.font='600 12px Archivo,sans-serif';
  }
  // Et lille nordvendt oversigtskort forbinder det regionale snit til hele Island.
  if(terraen){
    const [x0,z0,x1,z1]=terraen.graenser,bw=W<600?112:140,bh=bw*(z1-z0)/(x1-x0),bx=W-bw-16,by=17;
    const kort=q=>[bx+(q[0]-x0)/(x1-x0)*bw,by+(q[2]-z0)/(z1-z0)*bh];
    ctx.save();ctx.fillStyle='#10282fbb';ctx.beginPath();ctx.roundRect(bx-6,by-6,bw+12,bh+24,5);ctx.fill();ctx.strokeStyle='#a2c2b3';ctx.lineWidth=.8;ctx.beginPath();
    for(const l of terraen.kyst){const a=kort(l[0]),b=kort(l[1]);ctx.moveTo(...a);ctx.lineTo(...b);}ctx.stroke();
    const ramme=[snit.world(-snit.valg.halv,0,0),snit.world(snit.valg.halv,0,0),snit.world(snit.valg.halv,0,-snit.valg.bag),snit.world(-snit.valg.halv,0,-snit.valg.bag)].map(kort);
    ctx.fillStyle='#e6a24b30';ctx.beginPath();ramme.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();
    ctx.strokeStyle='#ffcf7d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...ramme[0]);ctx.lineTo(...ramme[1]);ctx.stroke();
    ctx.font='500 9px "IBM Plex Mono",monospace';ctx.fillStyle='#d9dfce';ctx.textAlign='left';ctx.fillText('SNITTETS PLACERING',bx,by+bh+12);ctx.restore();
  }
  return {synligeKamre:etiketter.map(e=>e.k.id)};
}
