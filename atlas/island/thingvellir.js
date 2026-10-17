// Þingvellir som en finmasket del af øens eget trekantnet. Et udsnit omkring
// riftdalen (56 × 54 km) erstatter de grove trekanter, og en randzone syr det
// sammen med resten af øen. ETOPO leverer relieffet og søens flade (ca. 100 m).
// Forkastningernes klippekanter, deres udstrækning og bevægelsen er didaktisk
// detaljering; kilder og geometrivalg står i Om modellen.
import { pakFarve } from './raster.js';
export const THINGVELLIR={geo:[-21.125,64.2581]};
// Udsnittet i et lokalt (u,v)-net: u mod østsydøst på tværs af dalen, v mod
// nordnordøst langs forkastningerne. Lögberg ved Almannagjá er (0,0).
const U0=-26,U1=30,V0=-30,V1=24,TRIN=.4,SOE=100.5;
const glat=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// Forkastningerne dør ud mod enderne; under søen fortsætter de usynligt.
const spor=(v,a,b)=>glat(a,a+2,v)*(1-glat(b-2,b,v));
const TA=v=>spor(v,-5,8),TB=v=>spor(v,-5,10);
const bugt=v=>.065*Math.sin(v*.85);

export function lavThingvellir(terraen) {
  const [ox,oz]=terraen.fraGeo(THINGVELLIR.geo),a=25*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  const world=(u,y,v)=>[ox+u*c+v*s,y,oz+u*s-v*c];
  const tilUV=(x,z)=>{const dx=x-ox,dz=z-oz;return [dx*c+dz*s,dx*s-dz*c];};
  const kant=(u,v)=>glat(0,4,Math.min(u-U0,U1-u,v-V0,V1-v));
  const maalt=(u,v)=>{const [x,,z]=world(u+bugt(v),0,v);return terraen.hoejdeVed(x,z);};
  const land=m=>glat(101,108,m);
  // Dalbundens nedsynkning mellem de to forkastninger (0–1).
  const dal=(u,v)=>(1-u/5)*TA(v)+u/5*TB(v);
  // Det målte relief er udglattet over ca. 1,6 km. Klippekanterne lægges oven
  // i: Almannagjá løfter vestsiden, dalbunden sænkes, Hrafnagjá er lavere.
  const spring=(u,v,del)=>del===0?16*TA(v):del===2?4*TB(v):-38*dal(u,v);
  const hoejde=(u,v,del,b=0)=>{
    const m=maalt(u,v),k=kant(u,v),w=k*land(m);
    const detalje=.9*Math.sin(u*13+v*4)*Math.cos(v*9-u*3)+.6*Math.sin(u*29-v*17);
    return m-25*(1-land(m))*k+w*(spring(u,v,del)+detalje-(del===1?18*b*dal(u,v):0));
  };
  // Vandret bevægelse: siderne trækkes ud, mest ved forkastningerne og intet
  // ved udsnittets rand, så resten af øen ligger stille.
  const plads=(u,v,del,b=0)=>{
    const du=del===0?-.32*b*TA(v)*glat(U0,0,u):del===2?.32*b*TB(v)*(1-glat(5,U1,u)):0;
    return world(u+bugt(v)+du,hoejde(u,v,del,b),v);
  };
  const nv=Math.round((V1-V0)/TRIN);
  // Søen: ETOPO's flade på 96–103 m, der hænger sammen med Þingvallavatn.
  // Udløbet (Sog), havet i Hvalfjörður og andre lavninger hører ikke med.
  const nu=Math.round((U1-U0)/TRIN),bassin=new Uint8Array((nu+1)*(nv+1)),ko=[];
  const celle=(u,v)=>Math.round((v-V0)/TRIN)*(nu+1)+Math.round((u-U0)/TRIN);
  for(ko.push(celle(3,-8));ko.length;){
    const k=ko.pop(),i=k%(nu+1),j=(k-i)/(nu+1);
    const h=maalt(U0+i*TRIN,V0+j*TRIN);if(bassin[k]||h<96||h>103)continue;
    bassin[k]=1;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]])if(i+di>=0&&i+di<=nu&&j+dj>=0&&j+dj<=nv)ko.push(k+di+dj*(nu+1));
  }
  // Bredden udvides ca. 1,5 km ind over land over søniveau, som kan oversvømmes,
  // når dalbunden synker.
  for(let gang=2;gang<6;gang++)for(let k=0;k<bassin.length;k++){
    if(bassin[k])continue;const i=k%(nu+1);
    if(![1,-1,nu+1,-nu-1].some(d=>bassin[k+d]===gang-1&&(Math.abs(d)>1||Math.floor((k+d)/(nu+1))===Math.floor(k/(nu+1)))))continue;
    if(maalt(U0+i*TRIN,V0+(k-i)/(nu+1)*TRIN)>=100)bassin[k]=gang;
  }
  const iBassin=(u,v)=>bassin[celle(Math.max(U0,Math.min(U1,u)),v)]>0;
  const dele=[[U0,0],[0,5],[5,U1]].map(([u0,u1],del)=>{
    const nu=Math.round((u1-u0)/TRIN),uv=[],flader=[],soe=[];
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)uv.push([u0+(u1-u0)*i/nu,V0+(V1-V0)*j/nv]);
    const iSoe=uv.map(([u,v])=>iBassin(u,v));
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
      const k=j*(nu+1)+i;
      for(const ids of [[k,k+nu+1,k+1],[k+1,k+nu+1,k+nu+2]]){
        flader.push(ids);
        // Kun lavninger ved søen kan fyldes med vand, når dalen synker.
        if(ids.some(i=>iSoe[i]))soe.push(flader.length-1);
      }
    }
    return {del,nu,uv,flader,soe,punkter:uv.map(([u,v])=>plads(u,v,del))};
  });
  const ved=(d,i,j)=>j*(d.nu+1)+i;
  // Udsnittets ydre rand i rækkefølge rundt; den ligger stille under bevægelsen.
  const [W,M,E]=dele,ring=[];
  for(let j=0;j<=nv;j++)ring.push(W.punkter[ved(W,0,j)]);
  for(const d of dele)for(let i=1;i<=d.nu;i++)ring.push(d.punkter[ved(d,i,nv)]);
  for(let j=nv-1;j>=0;j--)ring.push(E.punkter[ved(E,E.nu,j)]);
  for(const d of [E,M,W])for(let i=d===E?d.nu-1:d.nu;i>=1;i--)ring.push(d.punkter[ved(d,i,0)]);

  // Øens grove trekanter, der rører udsnittet, tages ud af tegningen.
  const iUdsnit=(x,z,m=.3)=>{const [u,v]=tilUV(x,z);return u>U0-m&&u<U1+m&&v>V0-m&&v<V1+m;};
  const hjoerner=[[U0,V0],[U1,V0],[U1,V1],[U0,V1]].map(([u,v])=>world(u,0,v));
  const indeni=(q,t)=>{const d=(a,b)=>(b[0]-a[0])*(q[2]-a[2])-(b[2]-a[2])*(q[0]-a[0]);const x=d(t[0],t[1]),y=d(t[1],t[2]),z=d(t[2],t[0]);return (x>=0&&y>=0&&z>=0)||(x<=0&&y<=0&&z<=0);};
  const fjernet=new Set(),kanter=new Map();
  terraen.flader.forEach((ids,k)=>{
    const t=ids.map(i=>terraen.punkter[i]);
    let ramt=hjoerner.some(q=>indeni(q,t));
    for(let e=0;e<3&&!ramt;e++)for(let n=0;n<=8&&!ramt;n++){const A=t[e],B=t[(e+1)%3];ramt=iUdsnit(A[0]+(B[0]-A[0])*n/8,A[2]+(B[2]-A[2])*n/8);}
    if(!ramt)return;
    fjernet.add(k);
    for(let e=0;e<3;e++)kanter.set(ids[e]+','+ids[(e+1)%3],[ids[e],ids[(e+1)%3]]);
  });
  // Hullets rand: kanter uden en modsat rettet nabo blandt de fjernede trekanter.
  const naeste=new Map();
  for(const [a,b] of kanter.values())if(!kanter.has(b+','+a))naeste.set(a,b);
  const hul=[];for(let i=naeste.keys().next().value;hul.length<=naeste.size&&!hul.includes(i);i=naeste.get(i))hul.push(i);
  if(hul.length!==naeste.size)throw new Error('Þingvellir-udsnittets rand er ikke én lukket kurve');

  // Randzonen syes som en lynlås efter positionen langs udsnittets omkreds
  // (nærmeste punkt på rektanglet i (u,v)), mod uret.
  const BU=U1-U0,BV=V1-V0,P=2*(BU+BV);
  const omkreds=q=>{
    const [u,v]=tilUV(q[0],q[2]),cu=Math.max(U0,Math.min(U1,u)),cv=Math.max(V0,Math.min(V1,v));
    const d=[cv-V0,U1-cu,V1-cv,cu-U0],k=d.indexOf(Math.min(...d));
    return [cu-U0,BU+cv-V0,BU+BV+U1-cu,2*BU+BV+V1-cv][k]%P;
  };
  const sorter=liste=>{
    let r=liste.map(q=>({q,t:omkreds(q)}));
    const uv=liste.map(q=>tilUV(q[0],q[2])),areal=uv.reduce((s,a,i)=>{const b=uv[(i+1)%uv.length];return s+a[0]*b[1]-b[0]*a[1];},0);
    if(areal<0)r.reverse();
    const start=r.reduce((m,a,i)=>a.t<r[m].t?i:m,0);r=r.slice(start).concat(r.slice(0,start));
    // Hullets trappekant kan gå en anelse tilbage; lynlåsen kræver en voksende rækkefølge.
    for(let i=1;i<r.length;i++)r[i].t=Math.max(r[i].t,r[i-1].t);
    return r;
  };
  const A=sorter(hul.map(i=>terraen.punkter[i])),B=sorter(ring),rand=[];
  const vinkel=(L,k)=>k<L.length?L[k].t:L[k-L.length].t+P;
  for(let i=0,j=0;i<A.length||j<B.length;){
    if(j>=B.length||(i<A.length&&vinkel(A,i+1)<=vinkel(B,j+1))){rand.push([A[i].q,A[(i+1)%A.length].q,B[j%B.length].q]);i++;}
    else{rand.push([A[i%A.length].q,B[j].q,B[(j+1)%B.length].q]);j++;}
  }

  // Højden af den tegnede overflade (uden bevægelse) til linjer oven på terrænet.
  const overflade=(x,z)=>{
    const [u,v]=tilUV(x,z);
    if(u>=U0&&u<=U1&&v>=V0&&v<=V1)return hoejde(u,v,u<0?0:u<5?1:2);
    const q=[x,0,z];
    for(const t of rand)if(indeni(q,t)){
      const d=(a,b,p)=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]),hel=d(t[0],t[1],t[2]);
      if(!hel)continue;
      const w0=d(t[1],t[2],q)/hel,w1=d(t[2],t[0],q)/hel;return w0*t[0][1]+w1*t[1][1]+(1-w0-w1)*t[2][1];
    }
    return null;
  };
  const ankre=[{navn:'Almannagjá',u:-.3,v:2,del:0},{navn:'Hrafnagjá',u:5.3,v:4,del:2},{navn:'Riftdalen',u:2.5,v:2.5,del:1},{navn:'Þingvallavatn',u:3,v:-8,del:1,soe:true}];
  const iSoe=(x,z)=>{const [u,v]=tilUV(x,z);return u>=U0&&u<=U1&&v>=V0&&v<=V1&&iBassin(u,v);};
  return {dele,ankre,world,tilUV,plads,hoejde,rand,ring,fjernet,overflade,iSoe,midte:world(2.5,0,1.5),
    punkter:dele.flatMap(d=>d.punkter),cache:{}};
}

// Lægger udsnittet, randzonen, klippekanter og sø i øens dybdebuffer.
export function tegnThingvellir({raster,p,model,farve,faktor,bevaegelse:b}) {
  if(model.faktor!==faktor){
    const fv=t=>farve(t,t.reduce((s,q)=>s+q[1],0)/3,faktor);
    for(const d of model.dele)d.farver=d.flader.map(ids=>fv(ids.map(k=>d.punkter[k])));
    model.randfarver=model.rand.map(fv);model.faktor=faktor;
  }
  if(model.cache.b!==b){
    model.cache={b,punkter:model.dele.map(d=>b?d.uv.map(([u,v])=>model.plads(u,v,d.del,b)):d.punkter)};
  }
  const klippe=pakFarve('rgb(62,74,66)'),bund=pakFarve('rgb(38,47,44)'),vand=pakFarve('rgb(53,119,137)');
  const P=model.cache.punkter.map(liste=>liste.map(q=>p(q)));
  model.rand.forEach((t,i)=>raster.trekant(p(t[0]),p(t[1]),p(t[2]),model.randfarver[i]));
  model.dele.forEach((d,n)=>{
    const ps=P[n];
    for(let i=0;i<d.flader.length;i++){const [x,y,z]=d.flader[i];raster.trekant(ps[x],ps[y],ps[z],d.farver[i]);}
    const q=model.cache.punkter[n];
    for(const i of d.soe){const ids=d.flader[i];raster.trekant(...ids.map(k=>p([q[k][0],SOE,q[k][2]])),vand);}
  });
  // Klippevægge og sprækkebund mellem nabodelene langs hver forkastning.
  for(const [v,o] of [[0,1],[1,2]]){
    const dv=model.dele[v],dO=model.dele[o],qv=model.cache.punkter[v],qo=model.cache.punkter[o];
    const vest=j=>qv[j*(dv.nu+1)+dv.nu],oest=j=>qo[j*(dO.nu+1)];
    for(let j=0;j<dv.uv.length/(dv.nu+1)-1;j++){
      const a=vest(j),b2=vest(j+1),c=oest(j),d=oest(j+1);
      if(Math.abs(a[1]-c[1])<.5&&Math.abs(b2[1]-d[1])<.5&&Math.abs(a[0]-c[0])<.001&&Math.abs(b2[0]-d[0])<.001)continue;
      const lav=Math.min(a[1],b2[1],c[1],d[1])-30,ned=q=>p([q[0],lav,q[2]]);
      const A=p(a),B=p(b2),Cc=p(c),D=p(d),A2=ned(a),B2=ned(b2),C2=ned(c),D2=ned(d);
      raster.trekant(A,B,B2,klippe);raster.trekant(A,B2,A2,klippe);
      raster.trekant(Cc,D,D2,klippe);raster.trekant(Cc,D2,C2,klippe);
      raster.trekant(A2,B2,D2,bund);raster.trekant(A2,D2,C2,bund);
    }
  }
}

// Navne, pile og målestok i samme 3D-projektion som terrænet.
export function tegnThingNavne({ctx,raster,p,model,bevaegelse:b,bredde,hoejde,oversigt}) {
  if(oversigt){
    // Langt ude: ét skilt, der viser, hvor på øen nærvisningen ligger.
    ctx.font='600 12px Archivo, sans-serif';ctx.textAlign='left';
    const q=p(model.plads(0,0,0,b)),w=ctx.measureText('Þingvellir').width+16;
    ctx.fillStyle='#fffaf0ee';ctx.beginPath();ctx.roundRect(q[0]+8,q[1]-28,w,23,4);ctx.fill();
    ctx.fillStyle='#243e3a';ctx.fillText('Þingvellir',q[0]+16,q[1]-12);
    ctx.strokeStyle='#fffaf0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(q[0]+13,q[1]-5);ctx.stroke();
    ctx.fillStyle='#f1a05d';ctx.beginPath();ctx.arc(q[0],q[1],3,0,Math.PI*2);ctx.fill();
    return;
  }
  // Forkastningernes øvre kant tegnes som en mørk linje, så begge kan aflæses,
  // også når klippevæggen vender væk fra beskueren.
  ctx.strokeStyle='#1d2a26';ctx.lineWidth=2.2;ctx.lineJoin='round';
  for(const [del,i,T] of [[0,'sidst',TA],[2,0,TB]]){
    const d=model.dele[del],q=model.cache.punkter?.[del]||d.punkter,kol=i==='sidst'?d.nu:0;
    ctx.beginPath();let i0=false;
    for(let j=0;j<d.uv.length/(d.nu+1);j++){
      const k=j*(d.nu+1)+kol,v=d.uv[k][1],pt=p([q[k][0],q[k][1]+3,q[k][2]]);
      if(T(v)<.2||q[k][1]<SOE+2||!raster.synlig(pt)){i0=false;continue;}
      if(i0)ctx.lineTo(pt[0],pt[1]);else{ctx.moveTo(pt[0],pt[1]);i0=true;}
    }
    ctx.stroke();
  }
  for(const [u,retning,del] of [[-4.5,-1,0],[9.5,1,2]]){
    const v=1,y=model.hoejde(u,v,del,b)+35,q1=model.plads(u,v,del,b),q0=model.plads(u,v,del,0),dx=q1[0]-q0[0],dz=q1[2]-q0[2];
    const a0=model.world(u,y,v),a1=model.world(u+retning*1.7,y,v),A=p([a0[0]+dx,y,a0[2]+dz]),B=p([a1[0]+dx,y,a1[2]+dz]);
    const a=Math.atan2(B[1]-A[1],B[0]-A[0]);ctx.strokeStyle='#ffe0a0';ctx.fillStyle='#ffe0a0';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();ctx.beginPath();ctx.moveTo(B[0],B[1]);ctx.lineTo(B[0]-12*Math.cos(a-.45),B[1]-12*Math.sin(a-.45));ctx.lineTo(B[0]-12*Math.cos(a+.45),B[1]-12*Math.sin(a+.45));ctx.closePath();ctx.fill();
  }
  ctx.font='600 12px Archivo, sans-serif';ctx.textAlign='left';
  const optaget=[];
  for(const n of model.ankre){
    const q=p(n.soe?model.world(n.u,SOE,n.v):model.plads(n.u,n.v,n.del,b).map((x,i)=>i===1?x+8:x)),w=ctx.measureText(n.navn).width+16;
    let x=Math.max(10,Math.min(bredde-w-10,q[0]+(n.navn==='Almannagjá'?-w-15:9))),y=Math.max(90,Math.min(hoejde-105,q[1]-29));
    while(optaget.some(r=>x<r[2]&&x+w>r[0]&&y<r[3]&&y+24>r[1]))y-=27;
    if(q[0]<0||q[0]>bredde||q[1]<75||q[1]>hoejde-75||y<85)continue;
    optaget.push([x,y,x+w,y+24]);
    ctx.strokeStyle='#fff9eebb';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(x+6,y+24);ctx.stroke();
    ctx.fillStyle='#fffaf0ee';ctx.beginPath();ctx.roundRect(x,y,w,24,4);ctx.fill();ctx.fillStyle='#243e3a';ctx.fillText(n.navn,x+8,y+16);
  }
}
