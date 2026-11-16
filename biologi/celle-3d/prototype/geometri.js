// Organiske geometrier i 3D-værkstedet. Ingen afhængighed til undervisningssidernes model.
import * as T from '../vendor/three.module.min.js';
export {T};
export const V=(x,y,z)=>new T.Vector3(x,y,z);
export const tilfældig=n=>{const f=Math.sin(n*77.13+19.3)*43758.5453;return f-Math.floor(f);};

// Glat værdistøj i 3D: bruges til cellens buler og organellernes uregelmæssighed.
const glat=t=>t*t*(3-2*t);
const hjørne=(x,y,z)=>tilfældig(x*127.1+y*311.7+z*74.7);
export function støj(x,y,z){
 const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),u=glat(x-xi),v=glat(y-yi),w=glat(z-zi);
 const l=(a,b,t)=>a+(b-a)*t;
 const k=(dx,dy,dz)=>hjørne(xi+dx,yi+dy,zi+dz);
 return l(l(l(k(0,0,0),k(1,0,0),u),l(k(0,1,0),k(1,1,0),u),v),l(l(k(0,0,1),k(1,0,1),u),l(k(0,1,1),k(1,1,1),u),v),w)*2-1;
}

export function rør(punkter,r=.03,lukket=false,segmenter){
 const kurve=punkter instanceof T.Curve?punkter:new T.CatmullRomCurve3(punkter.map(p=>Array.isArray(p)?V(...p):p),lukket,'centripetal');
 return new T.TubeGeometry(kurve,segmenter||Math.max(40,punkter.length*5),r,8,lukket);
}

// Et blødt, uregelmæssigt legeme. thetaStart/-længde giver halvdele, der kan løftes af.
export function organiskKrop(rx,ry,rz,styrke=.035,thetaStart=0,thetaLængde=Math.PI,frø=0){
 const geo=new T.SphereGeometry(1,72,44,0,Math.PI*2,thetaStart,thetaLængde),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),b=1+styrke*støj(x*2.2+frø,y*2.2+frø*.7,z*2.2-frø);
  p.setXYZ(i,x*rx*b,y*ry*b,z*rz*b);
 }
 geo.computeVertexNormals();return geo;
}

// Cellemembranen: en hel, bulet kugle som i lærebogsanimationer – ikke en plade i snit.
export const CELLERADIUS=4.7;
export function celleRadius(x,y,z){
 const b=1+.075*støj(x*1.25+3,y*1.25,z*1.25-2)+.03*støj(x*2.9,y*2.9+5,z*2.9);
 return CELLERADIUS*b;
}
export function celleSkal(skala=1){
 const geo=new T.SphereGeometry(1,180,130),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=celleRadius(x,y,z)*skala;p.setXYZ(i,x*r,y*r,z*r);}
 geo.computeVertexNormals();return geo;
}

// Lukket, rundet cisterna omkring en bugtet midterlinje. Bruges af ru ER.
export function cisterna(kurve,{højde=1.5,fase=0,bund=-.65,tykkelse=.07,ujævnhed=1,afrunding=0}={}){
 const N=180,M=12,pos=[],ix=[];
 function punkt(i,j,side){
  const t=i/N,v=j/M,p=kurve.getPointAt(t),tangent=kurve.getTangentAt(t),normal=V(-tangent.z,0,tangent.x).normalize();
  const top=højde+ujævnhed*(.17*Math.sin(t*21+fase)+.09*Math.sin(t*39+fase*.6));
  const bundY=bund+ujævnhed*.14*Math.sin(t*17+fase*.9);
  const blødEnde=.28+.72*Math.sin(Math.PI*t)**.35;
  const profil=afrunding?Math.min(1,Math.sqrt(Math.max(0,1-((Math.max(0,afrunding-t,t-(1-afrunding)))/afrunding)**2))):1;
  const y=(top+bundY)/2+(v-.5)*(top-bundY)*profil;
  const bule=ujævnhed*.14*Math.sin(t*29+v*4+fase)*Math.sin(Math.PI*v);
  return p.add(normal.multiplyScalar((side-.5)*tykkelse*blødEnde+bule)).setY(y);
 }
 for(let s=0;s<2;s++)for(let i=0;i<=N;i++)for(let j=0;j<=M;j++)pos.push(...punkt(i,j,s).toArray());
 const L=(N+1)*(M+1),id=(s,i,j)=>s*L+i*(M+1)+j;
 for(let s=0;s<2;s++)for(let i=0;i<N;i++)for(let j=0;j<M;j++){
  const a=id(s,i,j),b=id(s,i+1,j),c=id(s,i+1,j+1),d=id(s,i,j+1);if(s===0)ix.push(a,d,b,b,d,c);else ix.push(a,b,d,b,c,d);
 }
 for(let i=0;i<N;i++)for(const j of[0,M]){const a=id(0,i,j),b=id(0,i+1,j),c=id(1,i+1,j),d=id(1,i,j);ix.push(a,b,d,b,c,d);}
 for(const i of[0,N])for(let j=0;j<M;j++){const a=id(0,i,j),b=id(0,i,j+1),c=id(1,i,j+1),d=id(1,i,j);ix.push(a,b,d,b,c,d);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(ix);geo.computeVertexNormals();
 return {geo,punkt,N,M};
}

// Mitokondrie: aflang kapsel. Den øverste halvdel kan løftes af som et snit.
export function mitoPunkt(t,a,l=1.4){
 const x=(t-.5)*l*2,r=Math.sin(Math.PI*t)**.5;
 return V(x,.44*r*Math.cos(a),.48*r*Math.sin(a));
}
export function mitoSkal(l=1.4,øverst=false){
 const pos=[],ix=[],N=64,M=28,start=øverst?-Math.PI/2:Math.PI/2;
 for(let i=0;i<=N;i++)for(let j=0;j<=M;j++)pos.push(...mitoPunkt(i/N,start+j/M*Math.PI,l).toArray());
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;ix.push(a,a+1,b,b,a+1,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(ix);geo.computeVertexNormals();
 return geo;
}
// En tværgående membranfold (crista), der går ind fra den indre membran.
export function crista(t,l,fase){
 const pos=[],ix=[],N=22,M=10,r=Math.sin(Math.PI*t)**.5;
 for(let i=0;i<=N;i++)for(let j=0;j<=M;j++){
  const u=i/N,v=j/M,a=u*Math.PI*2;
  const dybde=.62+.22*Math.sin(fase+a*2);
  const rr=.43*r*(1-v*dybde);
  pos.push((t-.5)*l*2+.045*Math.sin(v*Math.PI+fase)*(1-v),rr*Math.cos(a),rr*Math.sin(a)*1.08);
 }
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;ix.push(a,a+1,b,b,a+1,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(ix);geo.computeVertexNormals();return geo;
}

// Golgi-sæk: flad, let skålformet skive med fortykket rand.
export function golgiSæk(rx,rz,tyk=.07,bøj=.35,frø=0){
 const geo=new T.SphereGeometry(1,56,20),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),ρ=Math.min(1,Math.hypot(x,z));
  const kant=1+.08*støj(x*3+frø,z*3,frø);
  const tykkelse=tyk*(1+1.6*ρ**6);
  p.setXYZ(i,x*rx*kant,y*tykkelse+bøj*ρ*ρ,z*rz*kant);
 }
 geo.computeVertexNormals();return geo;
}
