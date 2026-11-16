// Geometriske byggesten til dyrecellen i 3D.
// Alle flader er parametriske: f(u,v,ud) med u og v i [0,1]. Normalerne
// beregnes som differenskvotienter af f, så sømme, folder og afrundede
// kanter skygges glat uden trekantsartefakter.
import * as T from '../celle-3d/vendor/three.module.min.js';
export {T};
export const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export const TAU=Math.PI*2,GRAD=Math.PI/180;
export const klem=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const glat=(a,b,x)=>{const t=klem((x-a)/(b-a));return t*t*(3-2*t);};
// Deterministisk støj, så modellen ser ens ud ved hver indlæsning.
export function tilfældig(n){const f=Math.sin(n*127.1+311.7)*43758.5453;return f-Math.floor(f);}
// Afrundet kant: 0 ved kanten, 1 inde på fladen, kvartcirkelprofil imellem.
export const rundKant=(d,m)=>d>=m?1:d<=0?0:Math.sqrt(1-(1-d/m)**2);
// Kapselprofil med runde ender og næsten konstant tykkelse på midten.
export const superprofil=(t,p=2.6)=>Math.pow(Math.max(0,1-Math.abs(2*t-1)**p),1/p);
export function vinkelAfstand(a,b){let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return Math.abs(d);}

// Normal til en parametrisk flade i (u,v). Ved degenererede punkter (poler,
// kapselspidser) flyttes målingen en anelse ind på fladen.
export function fladeNormal(f,u,v,ud,h=5e-4){
 const a=V(),b=V(),c=V(),d=V();
 f(klem(u+h),v,a);f(klem(u-h),v,b);f(u,klem(v+h),c);f(u,klem(v-h),d);
 ud.crossVectors(a.sub(b),c.sub(d));
 if(ud.lengthSq()<1e-18){
  const u2=u<.5?u+6*h:u-6*h,v2=v<.5?v+6*h:v-6*h;
  f(klem(u2+h),v2,a);f(klem(u2-h),v2,b);f(u2,klem(v2+h),c);f(u2,klem(v2-h),d);
  ud.crossVectors(a.sub(b),c.sub(d));
 }
 return ud.normalize();
}

// Trekantsgitter over f. Forsiden vender mod df/du × df/dv; vend spejler.
export function gitter(f,Nu,Nv,{vend=false}={}){
 const n=(Nu+1)*(Nv+1),pos=new Float32Array(n*3),nor=new Float32Array(n*3);
 const ix=new (n>65000?Uint32Array:Uint16Array)(Nu*Nv*6);
 const p=V(),m=V();let k=0;
 for(let i=0;i<=Nu;i++)for(let j=0;j<=Nv;j++){
  const u=i/Nu,v=j/Nv;f(u,v,p);fladeNormal(f,u,v,m);if(vend)m.negate();
  pos[k]=p.x;pos[k+1]=p.y;pos[k+2]=p.z;nor[k]=m.x;nor[k+1]=m.y;nor[k+2]=m.z;k+=3;
 }
 let q=0;
 for(let i=0;i<Nu;i++)for(let j=0;j<Nv;j++){
  const a=i*(Nv+1)+j,b=a+Nv+1;
  if(vend){ix[q++]=a;ix[q++]=a+1;ix[q++]=b;ix[q++]=a+1;ix[q++]=b+1;ix[q++]=b;}
  else{ix[q++]=a;ix[q++]=b;ix[q++]=a+1;ix[q++]=a+1;ix[q++]=b;ix[q++]=b+1;}
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.BufferAttribute(pos,3));
 g.setAttribute('normal',new T.BufferAttribute(nor,3));
 g.setIndex(new T.BufferAttribute(ix,1));
 return g;
}

export function flet(geometrier){
 let n=0,m=0;for(const g of geometrier){n+=g.attributes.position.count;m+=g.index.count;}
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),ix=new (n>65000?Uint32Array:Uint16Array)(m);
 let vo=0,io=0;
 for(const g of geometrier){
  pos.set(g.attributes.position.array,vo*3);nor.set(g.attributes.normal.array,vo*3);
  const gi=g.index.array;for(let i=0;i<gi.length;i++)ix[io+i]=gi[i]+vo;
  vo+=g.attributes.position.count;io+=gi.length;g.dispose();
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.BufferAttribute(pos,3));
 g.setAttribute('normal',new T.BufferAttribute(nor,3));
 g.setIndex(new T.BufferAttribute(ix,1));
 return g;
}

// Pude: en lukket, tynd membransæk omkring midterfladen S. Over- og underside
// forskydes langs normalen med den halve tykkelse, ganget med w(u,v), som går
// mod 0 ved randen, så kanten bliver rund og sækken lukket.
export function pude({S,tyk,w,Nu,Nv}){
 const n=V();
 const t=typeof tyk==='function'?tyk:()=>tyk;
 const over=(u,v,ud)=>{S(u,v,ud);fladeNormal(S,u,v,n);return ud.addScaledVector(n,t(u,v)/2*w(u,v));};
 const under=(u,v,ud)=>{S(u,v,ud);fladeNormal(S,u,v,n);return ud.addScaledVector(n,-t(u,v)/2*w(u,v));};
 return flet([gitter(over,Nu,Nv),gitter(under,Nu,Nv,{vend:true})]);
}

export class FKurve extends T.Curve{constructor(f){super();this.f=f;}getPoint(t,ud=new T.Vector3()){return this.f(t,ud);}}
export function kurveRør(f,segmenter,radius,lukket=false,radial=8){return new T.TubeGeometry(new FKurve(f),segmenter,radius,radial,lukket);}
export function punktRør(punkter,radius,lukket=false,segmenter,radial=8){
 const k=new T.CatmullRomCurve3(punkter.map(p=>Array.isArray(p)?V(...p):p),lukket,'centripetal');
 return new T.TubeGeometry(k,segmenter||punkter.length*8,radius,radial,lukket);
}

// Ortonormal ramme omkring en akse. n1 er "op" projiceret vinkelret på aksen.
export function ramme(akse,op=[0,1,0]){
 const t=V(...akse).normalize(),n1=V(...op);
 n1.addScaledVector(t,-n1.dot(t));if(n1.lengthSq()<1e-6)n1.set(1,0,0).addScaledVector(t,-t.x);
 n1.normalize();const n2=V().crossVectors(t,n1);
 return {t,n1,n2};
}

// Let uregelmæssig kugle, så organeller ikke ligner billardkugler.
export function organiskKugle(r,styrke=.05,frø=0,Nu=40,Nv=28){
 return gitter((u,v,ud)=>{
  const θ=u*TAU,φ=v*Math.PI,s=Math.sin(φ);
  ud.set(s*Math.cos(θ),Math.cos(φ),s*Math.sin(θ));
  const n=1+styrke*(Math.sin(3*θ+frø)*s+.7*Math.sin(2*φ*2.3+frø*1.3+θ)+.5*Math.sin(5*θ-2*φ+frø));
  return ud.multiplyScalar(r*n);
 },Nu,Nv);
}

// Punkter jævnt fordelt på en kugleflade (Fibonacci-spiral).
export function kuglepunkter(n){
 const ud=[];for(let i=0;i<n;i++){const y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y),a=i*2.399963;ud.push(V(r*Math.cos(a),y,r*Math.sin(a)));}return ud;
}
