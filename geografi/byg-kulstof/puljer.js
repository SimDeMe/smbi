// Første trin bruger præcis samme motor og komponenter som vandets kredsløb.
import {Byg} from '../../byg-motor/motor.js';
import {PULJER,STEDER} from './model.js';
import {LANDSKAB,BREDDE,HOEJDE} from './landskab.js';

const bokse={luft:[1390,65],skov:[230,190],jord:[250,570],hav:[1360,470],plankton:[1100,565],skaller:[1390,630],kul:[200,850],gas:[640,660],olie:[700,940],kalksten:[1240,895]};
export const PULJEFIGUR={
  id:'puljer',navn:'Kulstofpuljerne',vb:[BREDDE,HOEJDE],boks:[310,48],mobilBredde:1000,
  lag:[{navn:'Puljerne',ord:PULJER.map(p=>p.id)}],
  dele:[{ord:null,svg:LANDSKAB.replace('id="landskabsbillede"','id="puljebillede"')}],
  pladser:PULJER.map(p=>{
    const s=STEDER.find(s=>s.id===p.id),[x,y]=bokse[p.id];
    return {ord:p.id,x,y,maal:s.punkt};
  })
};
const ORD=Object.fromEntries(PULJER.map(p=>[p.id,{ord:p.navn,tekst:`${p.hint} Her lagres kulstof. ${STEDER.find(s=>s.id===p.id).tekst}`} ]));

export function opretPuljer(t,gem,fortsaet){
  const $=id=>document.getElementById(id);
  // De fælles handlinger gemmes også ved delvist gennemførte puljer.
  class PuljeByg extends Byg{
    indsend(){super.indsend();husk();}
    hint(){super.hint();husk();}
    tegnPanel(){super.tegnPanel();$('pulje-fremskridt').textContent=`${this.loest.size} af ${PULJER.length} puljer navngivet`;}
  }
  const m=new PuljeByg(PULJEFIGUR,{
    svg:$('pulje-figur'),bakke:$('bakke'),besked:$('pulje-besked'),hint:$('pulje-hint'),indsend:$('pulje-indsend'),lagliste:$('pulje-lagliste'),opgTitel:$('pulje-titel'),opgTekst:$('pulje-opgave'),kort:$('pulje-faerdig'),sr:$('sr-status')
  },{svaer:()=>false,eneFigur:()=>true,faerdig:()=>{},naesteTekst:()=> 'Fortsæt til kulstoffets former',naeste:fortsaet},ORD);
  const husk=()=>{t.puljer=new Set(m.loest);gem();$('trin-former').disabled=m.loest.size!==PULJER.length;};
  m.loest=new Set(t.puljer);m.lagFaerdig=m.faerdig();
  $('pulje-hint').onclick=()=>m.hint();$('pulje-indsend').onclick=()=>m.indsend();
  return m;
}
