// Alle tre lag bruger samme motor og komponenter som vandets kredsløb.
import {Byg} from '../../byg-motor/motor.js';
import {PULJER,PROCESSER,LAG,ALLE,FORBINDELSER} from './model.js';
import {LANDSKAB,BREDDE,HOEJDE} from './landskab.js';
import {forbindBokse} from './pile.js';
export const KULSTOFFIGUR={
 id:'kulstof',navn:'Kulstofkredsløbet',vb:[BREDDE,HOEJDE],boks:[340,48],mobilBredde:1000,
 lag:LAG,
 dele:[{ord:null,svg:LANDSKAB},...PROCESSER.map(p=>({ord:p.id,svg:''}))],
 pladser:[...PULJER.map(p=>({ord:p.id,x:p.boks[0],y:p.boks[1],maal:p.punkt})),...PROCESSER.map(p=>({ord:p.id,x:p.boks[0],y:p.boks[1]}))]
};
const ruter=new Map();
function rute(a,b,bokse){
 const key=bokse.map(p=>p.ord).join(',')+':'+a.ord+':'+b.ord;
 if(!ruter.has(key))ruter.set(key,forbindBokse(a,b,bokse,a.ord==='pumpe'&&b.ord==='hav'?[1,1]:[]));
 return ruter.get(key);
}
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
    const tekst=g.querySelector('.ordtekst');if(tekst.textContent.length>24)tekst.style.fontSize='23px';
   });
   this.ui.svg.querySelectorAll('.del[data-ord]').forEach(g=>{g.classList.toggle('tidligere-pil',this.ordLag[g.dataset.ord]<this.lag);});
   this.opdaterPile();
   $('fig-intro').textContent=LAG[this.lag].intro;
   $('tidligere-kontrol').hidden=this.lag===0;
  }
  opdaterPile(){
   const svg=this.ui.svg;
   const bokse=this.fig.pladser.filter((p,i)=>{const g=this.pladsEl[i];return g&&getComputedStyle(g).display!=='none';});
   const find=id=>bokse.find(p=>p.ord===id);
   svg.querySelectorAll('.del[data-ord]').forEach(g=>{
    const id=g.dataset.ord,p=PROCESSER.find(p=>p.id===id);
    const synlig=p.lag===this.lag||document.body.classList.contains('vis-tidligere');
    g.style.display=synlig?'':'none';
    if(!synlig){g.innerHTML='';return;}
    g.innerHTML=FORBINDELSER[id].filter(([a,b])=>find(a)&&find(b)).map(([a,b])=>
     `<path class="kulstof-pil" data-fra="${a}" data-til="${b}" d="${rute(find(a),find(b),bokse)}" fill="none" stroke="#000" stroke-width="6" stroke-linejoin="round" marker-end="url(#pilspids)"${p.dobbelt?' marker-start="url(#pilspids)"':''}/>`).join('');
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
