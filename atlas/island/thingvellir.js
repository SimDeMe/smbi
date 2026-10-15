// Regionalt trekantnet i ø-modellens verdenskoordinater (km, meter, km).
// ETOPO leverer det brede relief. Smalle forkastninger og søbred er
// didaktisk detaljering; kilder og geometrivalg står i Om modellen.
import { pakFarve } from './raster.js';
export const THINGVELLIR={geo:[-21.125,64.2581]};

export function lavThingvellir(terraen) {
  const [ox,oz]=terraen.fraGeo(THINGVELLIR.geo),a=25*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  const world=(u,y,v)=>[ox+u*c+v*s,y,oz+u*s-v*c];
  const so=(u,v)=>((u-2.8)/3.6)**2+((v+6)/5.4)**2<1;
  const hoejde=(u,v,del)=>{
    const [x,,z]=world(u,0,v),maal=terraen.hoejdeVed(x,z);
    const detalje=.9*Math.sin(u*13+v*4)*Math.cos(v*9-u*3)+.6*Math.sin(u*29-v*17);
    const y=maal+detalje+(del===0?16:del===1?-38:4);
    return so(u,v)?40:y;
  };
  const dele=[[-5,-.035],[.035,4.965],[5.035,10]].map(([u0,u1],del)=>{
    const nu=42,nv=112,punkter=[],flader=[];
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
      const u=u0+(u1-u0)*i/nu,v=-11+20*j/nv;
      // Samme let bugtede forkastningsretning på begge sider af sprækken.
      punkter.push(world(u+.065*Math.sin(v*.85),hoejde(u,v,del),v));
    }
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
      const k=j*(nu+1)+i;
      for(const ids of [[k,k+nu+1,k+1],[k+1,k+nu+1,k+nu+2]]){
        flader.push(ids);
      }
    }
    const kanter=[Array.from({length:nu+1},(_,i)=>i),Array.from({length:nu+1},(_,i)=>nv*(nu+1)+i),Array.from({length:nv+1},(_,i)=>i*(nu+1)),Array.from({length:nv+1},(_,i)=>i*(nu+1)+nu)];
    return {punkter,flader,kanter,del};
  });
  const ankre=[{navn:'Almannagjá',u:0,v:2,del:0},{navn:'Hrafnagjá',u:5,v:3,del:2},{navn:'Riftdalen',u:2.4,v:5,del:1},{navn:'Þingvallavatn',u:2.8,v:-5,del:1}].map(n=>({...n,punkt:world(n.u,(n.navn==='Þingvallavatn'?100:hoejde(n.u,n.v,n.del))+8,n.v)}));
  // Ét lukket vandvolumen: søbundens terræn tegnes aldrig som en ekstra
  // vandflade. Volumenet går ned under søbunden i alle tre terrændele.
  const soeflader=[],antal=120;
  for(let i=0;i<antal;i++){
    const a=2+2*i,b=2+2*((i+1)%antal);
    soeflader.push([0,a,b],[1,b+1,a+1],[a,a+1,b+1],[a,b+1,b]);
  }
  const soepunkter=bevaegelse=>{
    const overflade=100-18*bevaegelse,punkter=[world(2.8,overflade,-6),world(2.8,20,-6)];
    for(let i=0;i<antal;i++){
      const a=i*Math.PI*2/antal,u=2.8+3.6*Math.cos(a),v=Math.max(-11,-6+5.4*Math.sin(a));
      punkter.push(world(u,overflade,v),world(u,20,v));
    }
    return punkter;
  };
  return {dele,ankre,world,hoejde,soeflader,soepunkter,midte:world(2.5,0,-1),punkter:dele.flatMap(d=>d.punkter)};
}

export function tegnThingvellir({ctx,raster,p,model,farve,faktor,bevaegelse,bredde,hoejde}) {
  const flyt=(q,del)=>{const a=model.world((del-1)*bevaegelse*.32,del===1?-18*bevaegelse:0,0),o=model.world(0,0,0);return[q[0]+a[0]-o[0],q[1]+a[1],q[2]+a[2]-o[2]];};
  if(model.faktor!==faktor){
    for(const d of model.dele)d.farver=d.flader.map(ids=>{const t=ids.map(k=>d.punkter[k]);return farve(t,t.reduce((s,q)=>s+q[1],0)/3,faktor);});
    model.faktor=faktor;
  }
  raster.nulstil();
  const sokkel=pakFarve('rgb(52,98,106)'),klippe=pakFarve('rgb(55,70,65)'),vand=pakFarve('rgb(53,119,137)');
  for(const d of model.dele){
    const ps=d.punkter.map(q=>p(flyt(q,d.del)));
    for(const kant of d.kanter)for(let i=0;i<kant.length-1;i++){
      const a=kant[i],b=kant[i+1],qa=flyt(d.punkter[a],d.del),qb=flyt(d.punkter[b],d.del);
      const A=ps[a],B=ps[b],C=p([qb[0],-90,qb[2]]),D=p([qa[0],-90,qa[2]]);
      const E=p([qb[0],qb[1]-60,qb[2]]),F=p([qa[0],qa[1]-60,qa[2]]);
      raster.trekant(A,B,E,klippe);raster.trekant(A,E,F,klippe);
      raster.trekant(F,E,C,sokkel);raster.trekant(F,C,D,sokkel);
    }
    for(let i=0;i<d.flader.length;i++){
      const ids=d.flader[i];
      raster.trekant(...ids.map(k=>ps[k]),d.farver[i]);
    }

  }
  // Samme vandstand på tværs af alle brud; lukkede sider fylder ned til
  // søbunden, også når terrænet trækkes fra hinanden og sænkes.
  const soe=model.soepunkter(bevaegelse).map(punkt=>p(punkt));
  for(const ids of model.soeflader)raster.trekant(...ids.map(i=>soe[i]),vand);
  raster.vis(ctx);
  ctx.font='600 12px Archivo, sans-serif';ctx.textAlign='left';
  const optaget=[];
  for(const n of model.ankre){
    const q=p(flyt(n.punkt,n.del)),w=ctx.measureText(n.navn).width+16;
    let x=Math.max(10,Math.min(bredde-w-10,q[0]+(n.navn==='Almannagjá'?-w-15:9))),y=Math.max(90,Math.min(hoejde-105,q[1]-(n.navn==='Riftdalen'?57:29)));
    while(optaget.some(b=>x<b[2]&&x+w>b[0]&&y<b[3]&&y+24>b[1]))y-=27;
    if(q[0]<0||q[0]>bredde||q[1]<75||q[1]>hoejde-75||y<85)continue;
    optaget.push([x,y,x+w,y+24]);
    ctx.strokeStyle='#fff9eebb';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(x+6,y+24);ctx.stroke();
    ctx.fillStyle='#fffaf0ee';ctx.beginPath();ctx.roundRect(x,y,w,24,4);ctx.fill();ctx.fillStyle='#243e3a';ctx.fillText(n.navn,x+8,y+16);
  }
  const A=p(model.world(0,0,0)),B=p(model.world(5,0,0)),laengde=Math.hypot(B[0]-A[0],B[1]-A[1]);
  ctx.strokeStyle='#31564d';ctx.fillStyle='#31564d';ctx.lineWidth=1.5;ctx.font='500 10px "IBM Plex Mono",monospace';ctx.fillText('ca. 5 km',18,hoejde-111);ctx.beginPath();ctx.moveTo(18,hoejde-105);ctx.lineTo(18+laengde,hoejde-105);ctx.stroke();
  // Pile i samme 3D-projektion som terrænet.
  for(const [u,retning,del] of [[-2.6,-1,0],[7.5,1,2]]){
    const v=1,y=model.hoejde(u,v,del)+35,A=p(flyt(model.world(u,y,v),del)),B=p(flyt(model.world(u+retning*1.7,y,v),del));
    const a=Math.atan2(B[1]-A[1],B[0]-A[0]);ctx.strokeStyle='#ffe0a0';ctx.fillStyle='#ffe0a0';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(...A.slice(0,2));ctx.lineTo(...B.slice(0,2));ctx.stroke();ctx.beginPath();ctx.moveTo(B[0],B[1]);ctx.lineTo(B[0]-12*Math.cos(a-.45),B[1]-12*Math.sin(a-.45));ctx.lineTo(B[0]-12*Math.cos(a+.45),B[1]-12*Math.sin(a+.45));ctx.closePath();ctx.fill();
  }
}
