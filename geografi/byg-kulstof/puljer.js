// Alle tre lag bruger samme motor og komponenter som vandets kredsløb.
import {Byg} from '../../byg-motor/motor.js';
import {PULJER,PROCESSER,LAG,ALLE} from './model.js';
import {LANDSKAB,BREDDE,HOEJDE} from './landskab.js';
const pil=p=>p.stier.map(sti=>`<path class="kulstof-pil" d="${sti}" fill="none" stroke="#000" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#pilspids)"${p.dobbelt?' marker-start="url(#pilspids)"':''}/>`).join('');
export const KULSTOFFIGUR={
 id:'kulstof',navn:'Kulstofkredsløbet',vb:[BREDDE,HOEJDE],boks:[340,48],mobilBredde:1000,
 lag:LAG,
 dele:[{ord:null,svg:LANDSKAB},...PROCESSER.map(p=>({ord:p.id,svg:pil(p)}))],
 pladser:[...PULJER.map(p=>({ord:p.id,x:p.boks[0],y:p.boks[1],maal:p.punkt})),...PROCESSER.map(p=>({ord:p.id,x:p.boks[0],y:p.boks[1],maal:p.maal}))]
};
const ORD=Object.fromEntries(ALLE.map(p=>[p.id,{ord:p.navn,tekst:p.tekst}]));

export function opretKredslob(t,gem){
 const $=id=>document.getElementById(id);
 class KulstofByg extends Byg{
  tegn(){super.tegn();if(this.gem)this.gem(this);}
  tegnFigur(){
   super.tegnFigur();
   this.ui.svg.setAttribute('data-lag',this.lag);
   this.ui.svg.querySelectorAll('.plads').forEach(g=>{
    g.classList.toggle('tidligere-navn',this.ordLag[this.fig.pladser[+g.dataset.i].ord]<this.lag);
    const tekst=g.querySelector('.ordtekst');if(tekst.textContent.length>24)tekst.style.fontSize='23px';
   });
   this.ui.svg.querySelectorAll('.del[data-ord]').forEach(g=>{g.classList.toggle('tidligere-pil',this.ordLag[g.dataset.ord]<this.lag);});
   this.opdaterPile();
   $('fig-intro').textContent=LAG[this.lag].intro;
   $('tidligere-kontrol').hidden=this.lag===0;
  }
  opdaterPile(){
   // En frizone følger de faktisk synlige bokse, også efter et lag- eller
   // visningsskift. Kun procespile og pilespidser klippes; figuren bevares.
   const ns='http://www.w3.org/2000/svg',svg=this.ui.svg,padding=16;
   svg.querySelector('#pil-frizoner')?.remove();
   const mask=document.createElementNS(ns,'mask');mask.id='pil-frizoner';
   for(const [k,v]of Object.entries({maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:0,y:0,width:BREDDE,height:HOEJDE}))mask.setAttribute(k,v);
   const baggrund=document.createElementNS(ns,'rect');
   for(const [k,v]of Object.entries({width:BREDDE,height:HOEJDE,fill:'white'}))baggrund.setAttribute(k,v);mask.append(baggrund);
   svg.querySelectorAll('.plads').forEach(g=>{
    if(getComputedStyle(g).display==='none')return;
    const b=g.querySelector('.boks'),hul=document.createElementNS(ns,'rect');
    for(const [k,v]of Object.entries({x:+b.getAttribute('x')-padding,y:+b.getAttribute('y')-padding,width:+b.getAttribute('width')+2*padding,height:+b.getAttribute('height')+2*padding,fill:'black'}))hul.setAttribute(k,v);
    hul.dataset.plads=g.dataset.i;mask.append(hul);
   });
   svg.querySelector('defs').append(mask);
   svg.querySelectorAll('.del[data-ord]').forEach(g=>g.setAttribute('mask','url(#pil-frizoner)'));
  }
  tegnPanel(){
   super.tegnPanel();
   const ord=LAG[this.lag].ord;
   $('fremskridt').textContent=`${ord.filter(id=>this.loest.has(id)).length} af ${ord.length} på plads i laget`;
   if(this.faerdig()){
    const slut=document.createElement('p');slut.className='slut';slut.textContent='Forklar kulstoffets vej fra atmosfæren gennem en levende organisme og videre til en geologisk pulje. Brug pilenes retning.';
    this.ui.kort.querySelector('.slut')?.replaceWith(slut);
   }
  }
 }
 const m=new KulstofByg(KULSTOFFIGUR,{
  svg:$('figur'),bakke:$('bakke'),besked:$('besked'),hint:$('hint'),indsend:$('indsend'),lagliste:$('lagliste'),opgTitel:$('opg-titel'),opgTekst:$('opg-tekst'),kort:$('faerdig-kort'),sr:$('sr-status')
 },{svaer:()=>false,eneFigur:()=>true,faerdig:()=>{},naesteTekst:()=>null,naeste:()=>{}},ORD);
 Object.assign(m,t);m.lagFaerdig=m.lagLoest();m.blandBakke();m.gem=gem;
 $('hint').onclick=()=>m.hint();$('indsend').onclick=()=>m.indsend();
 return m;
}
