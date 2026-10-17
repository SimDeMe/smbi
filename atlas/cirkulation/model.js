// All coordinates and velocities are in degrees; speeds are illustrative.
const rad = Math.PI / 180;
export const months = ['Januar','Februar','Marts','April','Maj','Juni','Juli','August','September','Oktober','November','December'];
export const colors = {trade:'#7ce1c1',west:'#f0b97a',polar:'#a9bdeb',itk:'#f6d977'};
export const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
function bump(lon,center,width){let d=((lon-center+540)%360)-180;return Math.exp(-.5*(d/width)**2);}
export function itk(lon,month,continents=true){
  const season=Math.cos(2*Math.PI*(month-7.5)/12);
  const mean=4+6*season;
  if(!continents)return mean;
  // Broad continental lobes, deliberately schematic rather than a land mask.
  const india=bump(lon,80,25),africa=bump(lon,22,23),australia=bump(lon,135,18);
  return mean+india*(4+11*season)+africa*(-1+9*season)+australia*(-4+9*season);
}
export function wind(lon,lat,state){
  const center=itk(lon,state.month,state.continents);
  const shift=(center-4)*.5;
  const north=lat>=center?1:-1;
  const distance=Math.abs(lat-center);
  const edge30=30+Math.sign(lat)*shift,edge60=60+Math.sign(lat)*shift;
  if(state.rotation<.01)return {u:0,v:clamp((center-lat)*.065,-2.8,2.8),kind:'trade'};
  let v,kind;
  if(Math.abs(lat)<edge30){v=-north*1.8*Math.min(1,distance/4);kind='trade';}
  else if(Math.abs(lat)<edge60){v=north*1.5;kind='west';}
  else{v=-north*1.1;kind='polar';}
  // Horizontal Coriolis deflection has opposite sign across the equator.
  // Cross-equatorial flow consequently becomes SW monsoon north of 0°.
  const u=v*Math.sin(lat*rad)*2.4*state.rotation;
  return {u,v,kind};
}
export function advance(p,state,dt){
  const w=wind(p[0],p[1],state);
  return [((p[0]+w.u*dt/Math.max(.22,Math.cos(p[1]*rad))+540)%360)-180,clamp(p[1]+w.v*dt,-89,89)];
}
export const steps=[
 ['Solen sætter luften i gang','Solen varmer mest ved ækvator. Den varme luft stiger, og luft fra nord og syd strømmer ind for at tage dens plads.'],
 ['ITK: her mødes vindene','Ved det gule bælte stiger varm, fugtig luft. Den køles af, danner høje skyer og giver kraftig regn. Ved jorden er der lavtryk (L).'],
 ['30°: luften synker','Luften strømmer ud i højden og synker omkring 30°. Her er højtryk (H), tørt vejr og mange ørkener. Kredsløbet hedder Hadleycellen.'],
 ['Jorden drejer. Vinden bøjer.','Coriolis afbøjer til højre i nord og til venstre i syd. Prøv at stoppe Jorden: vinden retter sig ud og går direkte mod lavtrykket.'],
 ['Tre celler på hver halvkugle','Hadley, Ferrel og polar. Ferrelcellen løber modsat de to andre. Dens vestenvind bringer skiftende vejr til Danmark.'],
 ['Regnbæltet følger sommeren','ITK følger solvarmen med lidt forsinkelse. Kontinenter varmes hurtigere op end havet, så bæltet flytter sig længere over land. Prøv januar og juli.'],
 ['Monsun: vinden vender','I juli strømmer fugtig luft fra havet mod Indien som sydvestmonsun. Om vinteren vender vinden og kommer fra land som tør nordøstmonsun.']
];
