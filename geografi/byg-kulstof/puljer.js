// Alle tre lag bruger samme motor og komponenter som vandets kredsløb.
import {Byg} from '../../byg-motor/motor.js';
import {PULJER,PROCESSER,LAG,ALLE,FORBINDELSER,PILE,STEDER} from './model.js';
import {LANDSKAB,BREDDE,HOEJDE} from './landskab.js';
export const KULSTOFFIGUR={
 id:'kulstof',navn:'Kulstofkredsløbet',vb:[BREDDE,HOEJDE],boks:[340,48],mobilBredde:1000,
 lag:LAG,
 dele:[{ord:null,svg:LANDSKAB},...PROCESSER.map(p=>({ord:p.id,svg:''}))],
 pladser:[...PULJER.map(p=>({ord:p.id,x:p.boks[0],y:p.boks[1],maal:p.punkt})),...PROCESSER.map(p=>({ord:p.id,x:p.boks[0],y:p.boks[1]}))]
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
    g.classList.toggle('tidligere-navn',this.ordLag[this.fig.pladser[+g.dataset.i].ord]>0&&this.ordLag[this.fig.pladser[+g.dataset.i].ord]<this.lag);
    g.classList.toggle('procesnavn',this.ordLag[this.fig.pladser[+g.dataset.i].ord]>0);
    const tekst=g.querySelector('.ordtekst');if(tekst.textContent.length>24)tekst.style.fontSize='23px';
   });
   this.ui.svg.querySelectorAll('.del[data-ord]').forEach(g=>{g.classList.toggle('tidligere-pil',this.ordLag[g.dataset.ord]<this.lag);});
   this.opdaterPile();
   $('fig-intro').textContent=LAG[this.lag].intro;
   $('tidligere-kontrol').hidden=this.lag===0;
  }
  opdaterPile(){
   const svg=this.ui.svg;
   svg.querySelectorAll('.stednavne').forEach(g=>g.remove());
   const ns='http://www.w3.org/2000/svg',steder=document.createElementNS(ns,'g');steder.setAttribute('class','stednavne');
   for(const p of STEDER.filter(p=>p.lag===this.lag||p.lag<this.lag&&document.body.classList.contains('vis-tidligere'))){
    const [x,y]=p.boks;steder.innerHTML+=`<g data-sted="${p.id}"><rect class="sted-boks" x="${x-170}" y="${y-24}" width="340" height="48" rx="11"/><text class="ordtekst" x="${x}" y="${y+7}" text-anchor="middle">${p.navn}</text></g>`;
   }
   svg.append(steder);
   svg.querySelectorAll('.del[data-ord]').forEach(g=>{
    const id=g.dataset.ord,p=PROCESSER.find(p=>p.id===id);
    const synlig=p.lag===this.lag||document.body.classList.contains('vis-tidligere');
    g.style.display=synlig?'':'none';
    const [fra,til]=FORBINDELSER[id][0];
    g.innerHTML=synlig?`<path class="pil-underlag" d="${PILE[id]}" fill="none" stroke="#fff9ee" stroke-width="12" stroke-linejoin="round"/><path class="kulstof-pil" data-fra="${fra}" data-til="${til}" d="${PILE[id]}" fill="none" stroke="#000" stroke-width="6" stroke-linejoin="round" marker-end="url(#pilspids)"${p.dobbelt?' marker-start="url(#pilspids)"':''}/>`:'';
   });
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
