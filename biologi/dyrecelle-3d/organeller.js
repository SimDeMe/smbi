// Organellerne i dyrecellen. Hver organel bygges som rigtige membranflader:
// cristae er folder i mitokondriets indre membran, cisterner er lukkede
// sække med afrundede rande, og kernehylsteret er to membraner med porer.
// Cellekerne og mitokondrier har et "låg", der kan løftes af for at se ind.
import {T,V,TAU,GRAD,glat,tilfældig,rundKant,superprofil,vinkelAfstand,fladeNormal,gitter,pude,kurveRør,punktRør,ramme,organiskKugle,kuglepunkter} from './geometri.js';

export const FARVER={
 kerneYdre:'#a08fcb',kerneSpalte:'#d6cdea',kerneIndre:'#b3a3d8',kerneplasma:'#ece7f6',kromatin:'#5a3e8d',kernelegeme:'#45296e',kerneKant:'#4b3777',pore:'#6b5894',
 ruER:'#4a8bcb',ribosom:'#3a4270',glatER:'#6cb9c4',
 golgi:'#86b656',golgiLys:'#a3c975',vesikel:'#cdd07a',
 mitoYdre:'#e0783d',mitoInderside:'#f3b184',mitoIndre:'#ee9d66',matrix:'#f8d2ad',mitoKant:'#7a2d0b',
 lysosom:'#d25e92',centriol:'#78899f',mikrotubulus:'#b9c5ce'
};

export const KERNECENTER=V(.2,.25,-.6);

export function bygOrganeller({rod,materiale,mesh,indeICelle,iKile}){
 const grupper={},ankre={},låg={kerne:[],mito:[]},snit={kerne:[],mito:[]},former=[];
 const gruppe=(id,pos)=>{const g=new T.Group();g.name=id;g.userData.id=id;if(pos)g.position.set(...pos);rod.add(g);grupper[id]=g;return g;};
 const KC=KERNECENTER;
 const modulo=x=>((x%1)+1)%1;
 const instanser=(geo,mat,matricer,mål)=>{const im=new T.InstancedMesh(geo,mat,matricer.length);matricer.forEach((m,i)=>im.setMatrixAt(i,m));im.castShadow=true;im.receiveShadow=true;mål.add(im);return im;};

 // ---------- Cellekerne ----------
 {
  const g=gruppe('kerne',KC.toArray());
  const R=[1.75,1.62,1.7],spalte=.075,θc=90*GRAD,halv=55*GRAD;
  const ydre=(u,v,ud)=>{
   const θ=u*TAU,φ=v*Math.PI,s=Math.sin(φ);
   ud.set(s*Math.cos(θ),Math.cos(φ),s*Math.sin(θ));
   const n=1+.018*Math.sin(3*θ+1.3)*s+.012*Math.sin(4.6*φ+2*θ);
   ud.x*=R[0]*n;ud.y*=R[1]*n;ud.z*=R[2]*n;return ud;
  };
  const nI=V();
  const indre=(u,v,ud)=>{ydre(u,v,ud);fladeNormal(ydre,u,v,nI);return ud.addScaledVector(nI,-spalte);};
  const del=(f,θ0,θ1,φ0,φ1)=>(u,v,ud)=>f(modulo((θ0+u*(θ1-θ0))/TAU),(φ0+v*(φ1-φ0))/Math.PI,ud);
  const matY=materiale(FARVER.kerneYdre,{roughness:.5}),matYind=materiale(FARVER.kerneSpalte,{side:T.BackSide,roughness:.6});
  const matI=materiale(FARVER.kerneIndre,{roughness:.5}),matIind=materiale(FARVER.kerneplasma,{side:T.BackSide,roughness:.75});
  const lågG=new T.Group();g.add(lågG);
  const lågMats=[matY.clone(),matYind.clone(),matI.clone(),matIind.clone()];
  for(const [θ0,θ1,φ0,φ1,Nu,Nv,erLåg] of [
   [θc+halv,θc+TAU-halv,0,Math.PI,150,72,false],
   [θc-halv,θc+halv,Math.PI/2,Math.PI,50,36,false],
   [θc-halv,θc+halv,0,Math.PI/2,50,36,true]]){
   const gy=gitter(del(ydre,θ0,θ1,φ0,φ1),Nu,Nv),gi=gitter(del(indre,θ0,θ1,φ0,φ1),Nu,Nv);
   const [a,b,c,d]=erLåg?lågMats:[matY,matYind,matI,matIind],mål=erLåg?lågG:g;
   mesh(gy,a,mål);mesh(gy,b,mål);mesh(gi,c,mål);mesh(gi,d,mål);
  }
  // Snitkanten: ned ad den ene meridian, langs ækvator, op ad den anden.
  const kantKurve=f=>(t,ud)=>{
   const s=t*3;let θ,φ;
   if(s<1){θ=θc-halv;φ=s*Math.PI/2;}else if(s<2){θ=θc-halv+(s-1)*2*halv;φ=Math.PI/2;}else{θ=θc+halv;φ=(3-s)*Math.PI/2;}
   return f(modulo(θ/TAU),φ/Math.PI,ud);
  };
  const kantMat=materiale(FARVER.kerneKant,{roughness:.6});
  for(const [f,r] of [[ydre,.024],[indre,.02]]){const m=mesh(kurveRør(kantKurve(f),180,r,true),kantMat,g);m.visible=false;snit.kerne.push(m);}
  // Kerneporer: ringe, hvor ydre og indre membran mødes.
  const poreGeo=new T.TorusGeometry(.075,.022,8,18),poreMat=materiale(FARVER.pore,{roughness:.55});
  const lågP=[],kropP=[],n=V(),p=V(),q=new T.Quaternion(),z=V(0,0,1),en=V(1,1,1);
  for(const d of kuglepunkter(120)){
   const θ=Math.atan2(d.z,d.x),φ=Math.acos(d.y),u=modulo(θ/TAU),v=φ/Math.PI;
   ydre(u,v,p);fladeNormal(ydre,u,v,n);q.setFromUnitVectors(z,n);
   const iLåg=φ<Math.PI/2&&vinkelAfstand(θ,θc)<halv;
   (iLåg?lågP:kropP).push(new T.Matrix4().compose(p,q,en));
  }
  instanser(poreGeo,poreMat,kropP,g);
  const lågPoreMat=poreMat.clone();instanser(poreGeo,lågPoreMat,lågP,lågG);lågMats.push(lågPoreMat);
  // Kromatin som løse tråde og et kernelegeme.
  const nukleolus=V(.5,.3,.55);
  mesh(organiskKugle(.46,.06,3),materiale(FARVER.kernelegeme,{roughness:.75}),g,nukleolus.toArray());
  const kromMat=materiale(FARVER.kromatin,{roughness:.7});
  for(let j=0;j<11;j++){
   const pts=[],antal=7+Math.floor(tilfældig(j)*3);let i=j*31;
   while(pts.length<antal){
    const c=V((tilfældig(i)-.5)*2.7,(tilfældig(i+1)-.5)*2.4,(tilfældig(i+2)-.5)*2.6);i+=97;
    if(c.length()<1.36&&c.distanceTo(nukleolus)>.62)pts.push(c);
   }
   mesh(punktRør(pts,.022,true,antal*18,6),kromMat,g);
  }
  låg.kerne.push({gruppe:lågG,løft:V(0,1,1).normalize().multiplyScalar(1.4),materialer:lågMats});
  ankre.kerne=KC.clone().add(V(-.45,.85,.55).normalize().multiplyScalar(1.72));
  former.push({c:KC,r:1.95});
 }

 // ---------- Ru ER: stablede, bølgede cisterner omkring kernen med ribosomer ----------
 const ark=[],ruERmat=materiale(FARVER.ruER,{roughness:.48});
 {
  const g=gruppe('ruER');
  const α0=-28*GRAD,α1=58*GRAD,ρ0=2.05,tyk=.13;
  const riboMat=materiale(FARVER.ribosom,{roughness:.6}),riboM=[],n=V(),p=V();
  for(let k=0;k<4;k++){
   const yk=-.78+k*.42,frø=k*7.3,ρ1=3.35-.15*Math.abs(k-1.5);
   const S=(u,v,ud)=>{
    const α=α0+u*(α1-α0)+.02*Math.sin(v*4+frø);
    const r1=ρ1+.12*Math.sin(u*7+frø)+.06*Math.sin(u*13+k),ρ=ρ0+v*(r1-ρ0);
    const y=yk+.3*(ρ-2.7)+.09*Math.sin(u*8+ρ*3+frø)+.05*Math.sin(u*15-ρ*4+k);
    return ud.set(KC.x+ρ*Math.cos(α),KC.y+y,KC.z+ρ*Math.sin(α));
   };
   const w=(u,v)=>rundKant(Math.min(Math.min(u,1-u)*2.7*(α1-α0),Math.min(v,1-v)*(ρ1-ρ0)),.07);
   mesh(pude({S,tyk,w,Nu:120,Nv:56}),ruERmat,g);
   ark.push(S);
   for(let i=0;i<130;i++){
    const u=.04+.92*tilfældig(i*5+k*997),v=.05+.9*tilfældig(i*5+k*997+1),side=i%2?1:-1;
    S(u,v,p);fladeNormal(S,u,v,n);p.addScaledVector(n,side*(tyk/2*w(u,v)+.028));
    riboM.push(new T.Matrix4().setPosition(p));
   }
   // Hver cisterne hænger sammen med kernehylsterets ydre membran.
   const a=V();S(.25+.15*k,0,a);const yk2=Math.max(-1.3,Math.min(1.3,a.y-KC.y)),β=Math.acos(yk2/1.62),α=α0+(.25+.15*k)*(α1-α0);
   const b=V(Math.sin(β)*Math.cos(α)*1.72,Math.cos(β)*1.6,Math.sin(β)*Math.sin(α)*1.68).add(KC);
   mesh(punktRør([b,b.clone().lerp(a,.5),a],.06,false,16),ruERmat,g);
  }
  instanser(new T.SphereGeometry(.04,8,6),riboMat,riboM,g);
  // Forbindelser mellem cisternerne ved randen.
  for(let k=0;k<3;k++)for(const [u,v] of [[.12,.85],[.55,.97],[.9,.7]]){
   const a=V(),b=V();ark[k](u,v,a);ark[k+1](u+.03,v,b);
   mesh(punktRør([a,a.clone().lerp(b,.5).add(V(.06,0,.04)),b],.055,false,16),ruERmat,g);
  }
  ankre.ruER=V();ark[3](.45,.55,ankre.ruER);
  former.push({skal:true,c:KC,r0:1.95,r1:3.6,α0:α0-.08,α1:α1+.08});
 }

 // ---------- Glat ER: forgrenet, organisk rørnetværk uden ribosomer ----------
 {
  const g=gruppe('glatER');
  const c=V(2.95,-.05,2.3),ud=V(.95,.5,.8),mat=materiale(FARVER.glatER,{roughness:.42}),r=.072;
  const noder=[];
  for(let i=0;noder.length<22&&i<6000;i++){
   const p=V(c.x+(tilfældig(i*3+11)-.5)*2*ud.x,c.y+(tilfældig(i*3+12)-.5)*2*ud.y,c.z+(tilfældig(i*3+13)-.5)*2*ud.z);
   if(noder.every(q=>q.distanceTo(p)>.42)&&indeICelle(p,.3))noder.push(p);
  }
  const kanter=new Set(),nøgle=(a,b)=>a<b?a+'-'+b:b+'-'+a;
  noder.forEach((p,i)=>{
   const nær=noder.map((q,j)=>[p.distanceTo(q),j]).filter(([,j])=>j!==i).sort((a,b)=>a[0]-b[0]);
   for(const [,j] of nær.slice(0,2+(tilfældig(i+77)<.4?1:0)))kanter.add(nøgle(i,j));
  });
  // Sørg for at netværket hænger sammen.
  const komp=noder.map((_,i)=>i),find=i=>komp[i]===i?i:(komp[i]=find(komp[i]));
  for(const k of kanter){const [a,b]=k.split('-').map(Number);komp[find(a)]=find(b);}
  for(;;){
   let bedst=null;
   noder.forEach((p,i)=>noder.forEach((q,j)=>{if(j>i&&find(i)!==find(j)){const d=p.distanceTo(q);if(!bedst||d<bedst[0])bedst=[d,i,j];}}));
   if(!bedst)break;kanter.add(nøgle(bedst[1],bedst[2]));komp[find(bedst[1])]=find(bedst[2]);
  }
  const kuglen=new T.SphereGeometry(r,14,10);
  for(const k of kanter){
   const [a,b]=k.split('-').map(Number),p=noder[a],q=noder[b],d=q.clone().sub(p),m=p.clone().lerp(q,.5);
   const s=V(-d.z,d.y*.3,d.x).normalize().multiplyScalar(.14*(tilfældig(a*31+b)-.5)*2).add(V(0,.12*(tilfældig(a+b*17)-.5),0));
   mesh(punktRør([p,m.add(s),q],r,false,20,7),mat,g);
  }
  for(const p of noder)mesh(kuglen,mat,g,p.toArray());
  // Overgang fra en ru cisterne til det glatte netværk.
  const start=V();ark[1](.96,.6,start);
  const slut=noder.reduce((b,p)=>p.distanceTo(start)<b.distanceTo(start)?p:b);
  mesh(punktRør([start,start.clone().lerp(slut,.5).add(V(0,.08,.06)),slut],r,false,20),mat,g);
  mesh(kuglen,mat,g,start.toArray());
  ankre.glatER=noder.reduce((b,p)=>p.x+p.z>b.x+b.z?p:b).clone();
  former.push({c,r:1.4});
 }

 // ---------- Golgiapparat: hældende stabel af buede, flade sække med fortykkede rande ----------
 const golgiVesikler=[];
 {
  const pos=V(-2.3,.3,.95),{t,n1,n2}=ramme([-.55,.72,.42]);
  const g=gruppe('golgi',pos.toArray());
  const former6=[];
  for(let k=0;k<6;k++){
   const d=(k-2.5)*.21,Rk=.92-.045*Math.abs(k-2.2),κ=.1+.07*k,frø=k*11+3;
   const S=(u,v,ud)=>{
    const a=u*TAU,ξ=1+.07*Math.sin(3*a+frø)+.045*Math.sin(5*a+2*frø)+.03*Math.sin(2*a+1),r=v*Rk*ξ;
    const h=d+κ*r*r+.02*Math.sin(2*a+frø)*v;
    return ud.copy(n1).multiplyScalar(r*Math.cos(a)).addScaledVector(n2,r*Math.sin(a)).addScaledVector(t,h);
   };
   const tyk=(u,v)=>.085+.1*glat(.72,1,v)*(1+.25*Math.sin(4*u*TAU+frø));
   const w=(u,v)=>rundKant((1-v)*Rk,.095);
   mesh(pude({S,tyk,w,Nu:72,Nv:24}),materiale(k%2?FARVER.golgi:FARVER.golgiLys,{roughness:.5}),g);
   former6.push(S);
  }
  // Vesikler, der snører af ved randene: transportvesikler ved cis-siden, sekretvesikler ved trans.
  const p=V();
  for(const [k,u,ud,r] of [[5,.1,.2,.1],[5,.4,.22,.09],[5,.7,.18,.11],[5,.9,.2,.08],[0,.3,-.2,.08],[0,.65,-.22,.09],[2,.55,.2,.07]]){
   former6[k](u,1,p);p.multiplyScalar(1+.12/p.length()).addScaledVector(t,ud).add(pos);golgiVesikler.push([p.toArray(),r]);
  }
  ankre.golgi=pos.clone().add(V(-.3,.9,.2));
  former.push({c:pos,r:1.3});
 }

 // ---------- Mitokondrier: ydre membran, indre membran foldet til cristae ----------
 {
  const g=gruppe('mito');
  const liste=[
   {p:[-3.9,-.2,-.25],akse:[.15,0,1],l:2.3,r:.5,bøj:.18},
   {p:[1.45,-.35,2.85],akse:[1,0,-.25],l:2.1,r:.48,bøj:.14},
   {p:[-1.6,-.1,3.0],akse:[1,.1,.35],l:1.9,r:.45,bøj:.12},
   {p:[4.2,.1,.4],akse:[.2,.1,1],l:1.8,r:.4,bøj:.1},
   {p:[-3.4,.5,2.6],akse:[1,.15,.4],l:1.9,r:.44,bøj:.15}
  ];
  const matY=materiale(FARVER.mitoYdre,{roughness:.5}),matYind=materiale(FARVER.mitoInderside,{side:T.BackSide,roughness:.6});
  const matI=materiale(FARVER.mitoIndre,{roughness:.5}),matIind=materiale(FARVER.matrix,{side:T.BackSide,roughness:.72});
  const kantMat=materiale(FARVER.mitoKant,{roughness:.6});
  liste.forEach((m,idx)=>{
   const h=new T.Group();h.position.set(...m.p);g.add(h);
   const {t,n1,n2}=ramme(m.akse,[0,1,.55]);
   const L=m.l,R=m.r,spalte=.06,frø=idx*13;
   const akse=(s,ud)=>ud.copy(t).multiplyScalar(L*(s-.5)).addScaledVector(n2,m.bøj*Math.sin(Math.PI*s));
   const radial=(θ,ud)=>ud.copy(n1).multiplyScalar(Math.cos(θ)).addScaledVector(n2,Math.sin(θ));
   const tmp=V(),nY=V(),rad=V();
   // u = vinkel om aksen (0 = op mod låget), v = position langs aksen.
   const ydre=(u,v,ud)=>{akse(v,ud);radial(u*TAU,tmp);return ud.addScaledVector(tmp,R*superprofil(v));};
   const antal=Math.round(L/.2),cr=[];
   for(let k=0;k<antal;k++)cr.push({
    s:.13+(k+.5)/antal*.74+(tilfældig(frø+k)-.5)*.03,w:.055/L,d:.6+.28*tilfældig(frø+k+40),
    θ:Math.PI+(tilfældig(frø+k+80)-.5)*70*GRAD,hw:(75+55*tilfældig(frø+k+120))*GRAD});
   const fold=(θ,s)=>{let D=0;for(const c of cr){const x=(s-c.s)/c.w;if(Math.abs(x)>3)continue;D+=c.d*Math.exp(-x*x)*(1-glat(c.hw-.25,c.hw+.25,vinkelAfstand(θ,c.θ)));}return Math.min(D,.9);};
   const indre=(u,v,ud)=>{
    ydre(u,v,ud);fladeNormal(ydre,u,v,nY);ud.addScaledVector(nY,-spalte);
    const rIn=Math.max(0,R*superprofil(v)-spalte);if(rIn<=.05)return ud;
    radial(u*TAU,rad);return ud.addScaledVector(rad,-fold(u*TAU,v)*(rIn-.05));
   };
   const del=(f,θ0,θ1)=>(u,v,ud)=>f(modulo((θ0+u*(θ1-θ0))/TAU),v,ud);
   const lågG=new T.Group();h.add(lågG);
   const lågMats=[matY.clone(),matYind.clone(),matI.clone(),matIind.clone()];
   for(const [θ0,θ1,erLåg] of [[75*GRAD,285*GRAD,false],[-75*GRAD,75*GRAD,true]]){
    const gy=gitter(del(ydre,θ0,θ1),erLåg?26:40,Math.round(L/.03)),gi=gitter(del(indre,θ0,θ1),erLåg?30:48,Math.round(L/.011));
    const [a,b,c,d]=erLåg?lågMats:[matY,matYind,matI,matIind],mål=erLåg?lågG:h;
    mesh(gy,a,mål);mesh(gy,b,mål);mesh(gi,c,mål);mesh(gi,d,mål);
   }
   for(const θ of [75*GRAD,285*GRAD]){
    const u=θ/TAU;
    for(const [f,r,N] of [[ydre,.014,80],[indre,.012,Math.round(L/.008)]]){
     const mm=mesh(kurveRør((s,ud)=>f(u,s,ud),N,r,false,6),kantMat,h);mm.visible=false;snit.mito.push(mm);
    }
   }
   låg.mito.push({gruppe:lågG,løft:n1.clone().multiplyScalar(.9),materialer:lågMats});
   former.push({kapsel:true,a:akse(0,V()).add(h.position),b:akse(1,V()).add(h.position),r:R+.12});
   if(idx===1){ankre.mito=V();ydre(0,.5,ankre.mito);ankre.mito.add(h.position);}
  });
 }

 // ---------- Lysosomer ----------
 {
  const g=gruppe('lysosom'),mat=materiale(FARVER.lysosom,{roughness:.55});
  [[[-4.4,-.15,1.2],.3],[[0,-.3,3.6],.27],[[-.9,.7,2.2],.24]].forEach(([p,r],i)=>{mesh(organiskKugle(r,.06,i*5),mat,g,p);former.push({c:V(...p),r:r+.1});});
  ankre.lysosom=V(-4.4,.15,1.2);
 }

 // ---------- Centrioler ----------
 const centrosom=V(-1.05,.95,1.35);
 {
  const g=gruppe('centriol',centrosom.toArray()),mat=materiale(FARVER.centriol,{roughness:.5});
  const cyl=new T.CylinderGeometry(.026,.026,.52,8),midte=new T.CylinderGeometry(.045,.045,.5,10);
  for(const [rot,off] of [[[0,0,Math.PI/2],[0,0,0]],[[Math.PI/2,0,0],[.3,0,.32]]]){
   const c=new T.Group();c.rotation.set(...rot);c.position.set(...off);g.add(c);
   for(let i=0;i<9;i++){const a=i/9*TAU;mesh(cyl,mat,c,[.11*Math.cos(a),0,.11*Math.sin(a)]);}
   mesh(midte,mat,c);
  }
  ankre.centriol=centrosom.clone().add(V(.15,.2,.15));
  former.push({c:centrosom,r:.6});
 }

 // ---------- Cytoskelet: mikrotubuli ud fra centrosomet ----------
 {
  const g=gruppe('cytoskelet'),mat=materiale(FARVER.mikrotubulus,{roughness:.6});
  const retninger=[[-1,.15,.4],[-.6,.25,1],[.25,.1,1],[.9,.45,.6],[.4,.5,-.8],[-.9,.4,-.5],[.1,.9,.3],[-.7,-.35,.7]];
  retninger.forEach((d,i)=>{
   const r=V(...d).normalize(),l=1.7+1.5*tilfældig(i+800),s=V(-r.z,.3,r.x).normalize().multiplyScalar(.45*(tilfældig(i+900)-.5));
   const pts=[centrosom.clone().addScaledVector(r,.3),centrosom.clone().addScaledVector(r,l*.5).add(s),centrosom.clone().addScaledVector(r,l)];
   if(!indeICelle(pts[2],.3))pts[2].copy(centrosom).addScaledVector(r,l*.7);
   if(pts.some(q=>q.distanceTo(KC)<1.9))return;
   mesh(punktRør(pts,.015,false,30,5),mat,g);
  });
  ankre.cytoskelet=centrosom.clone().addScaledVector(V(.2,.1,1).normalize(),2.6);
 }

 // ---------- Vesikler ----------
 {
  const g=gruppe('vesikel'),mat=materiale(FARVER.vesikel,{roughness:.5});
  [...golgiVesikler,[[.9,.4,3.9],.15],[[2.5,.3,3.35],.12],[[-3.9,.3,0],.11],[[-4.6,.5,-.4],.1],[[-1.6,-.1,2.1],.09]]
   .forEach(([p,r],i)=>{mesh(organiskKugle(r,.04,i*3,20,14),mat,g,p);former.push({c:V(...p),r:r+.08});});
  ankre.vesikel=V(.9,.55,3.9);
 }

 // ---------- Frie ribosomer ----------
 {
  const g=gruppe('ribosom'),mat=materiale(FARVER.ribosom,{roughness:.6}),m=[];
  for(let i=0;m.length<210&&i<6000;i++){
   const p=V(-5.2+10.4*tilfældig(i*3+1),-.85+2.3*tilfældig(i*3+2),-2.4+6.6*tilfældig(i*3+3));
   if(!indeICelle(p,.3)||!iKile(p)||udelukket(p))continue;
   m.push(new T.Matrix4().setPosition(p));
  }
  instanser(new T.SphereGeometry(.034,8,6),mat,m,g);
  ankre.ribosom=V(2.2,.6,1.9);
 }

 function udelukket(p){
  for(const f of former){
   if(f.kapsel){const ab=f.b.clone().sub(f.a),t=Math.max(0,Math.min(1,p.clone().sub(f.a).dot(ab)/ab.lengthSq()));if(p.distanceTo(f.a.clone().addScaledVector(ab,t))<f.r)return true;}
   else if(f.skal){const d=p.clone().sub(f.c),r=d.length(),α=Math.atan2(d.z,d.x);if(r>f.r0&&r<f.r1&&α>f.α0&&α<f.α1)return true;}
   else if(p.distanceTo(f.c)<f.r)return true;
  }
  return false;
 }

 function åbn(id,v){
  for(const l of låg[id]){
   l.gruppe.position.copy(l.løft).multiplyScalar(v);l.gruppe.visible=v<.995;
   for(const m of l.materialer){m.opacity=1-v;m.transparent=v>.001;m.depthWrite=v<.5;}
  }
  const o=glat(.1,.7,v);
  for(const s of snit[id]){s.visible=o>.01;s.material.opacity=o;s.material.transparent=o<.999;}
 }
 return {grupper,ankre,åbn};
}
