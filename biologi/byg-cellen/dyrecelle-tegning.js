// Fælles lagdelt illustration: skråt snit med dybde, ikke en målfast 3D-model.
// Bruges både af Byg cellen og af transport-simulatorens zoom.
import { boelge } from '../../byg-motor/tegn.js';
export const cellekontur = 'M207 323C194 229 271 142 396 91C510 45 641 72 721 141C791 201 834 292 805 369C775 449 667 500 552 531C420 567 309 527 252 456C220 417 211 369 207 323Z';
const gradient=(id,a,b)=>`<linearGradient id="dyr-${id}" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
export const definitioner=`<defs>
 ${gradient('cyto','#e1f7f4','#91d1dc')}${gradient('kant','#18bed0','#086a89')}
 ${gradient('er','#32c4d0','#087a96')}${gradient('er-side','#07899d','#064c66')}
 ${gradient('golgi','#ffc257','#e77716')}${gradient('golgi-side','#c47a19','#854116')}
 ${gradient('kerne','#a7b6ed','#5d68a1')}${gradient('kerne-snit','#e0def5','#9eaddb')}
 ${gradient('mito','#3caec3','#086681')}${gradient('mito-indre','#22728e','#123d60')}
 <radialGradient id="dyr-gul" cx=".3" cy=".25"><stop stop-color="#fff3a5"/><stop offset=".55" stop-color="#e8bd3d"/><stop offset="1" stop-color="#a87b15"/></radialGradient>
 <mask id="dyr-kantmaske" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="640"><rect width="1000" height="640" fill="white"/><path d="${cellekontur}" fill="black"/></mask>
 <clipPath id="dyr-kernesnit"><path d="M407 184C447 165 499 183 540 217C576 247 594 283 579 311C520 344 443 318 411 281C389 254 392 215 407 184Z"/></clipPath>
 </defs>`;
const kant=`<g mask="url(#dyr-kantmaske)"><path d="${cellekontur}" transform="translate(0 24)" fill="url(#dyr-kant)" stroke="#076e88" stroke-width="3"/></g>
 <path d="${cellekontur}" fill="none" stroke="#077f9c" stroke-width="10"/>
 <path d="${cellekontur}" fill="none" stroke="#58d4dc" stroke-width="5"/>
 <path d="M220 382C243 486 382 565 552 531C689 504 772 450 799 388" fill="none" stroke="#c0f3ef" stroke-width="3"/>`;
const cyto=`<path d="${cellekontur}" transform="translate(0 25)" fill="#0b728a"/>
 <path d="${cellekontur}" fill="url(#dyr-cyto)" stroke="#3fabbc" stroke-width="2"/>
 <path d="M236 302C258 204 341 145 414 123" fill="none" stroke="#effffc" stroke-width="15" opacity=".35"/>`;
function sæk(d,type='er',dy=22){return `<path d="${d}" transform="translate(0 ${dy})" fill="url(#dyr-${type}-side)" stroke="${type==='er'?'#096c83':'#a65d16'}" stroke-width="2"/>
 <path d="${d}" fill="url(#dyr-${type})" stroke="${type==='er'?'#5cdee0':'#ffda75'}" stroke-width="2.5" stroke-linejoin="round"/>`;}
// Samme foldede membranform, farver og dybde for begge ER-områder.
// På ru ER tilføjes ribosomer på membranens synlige overflade.
function erNet(medRibosomer=false) {
 const folder=Array.from({length:5},(_,i)=>{
  const x=i*11,y=i*22;
  const membran=sæk(`M${317+x} ${213+y}C${287+x} ${237+y} ${300+x} ${262+y} ${345+x} ${270+y}C${411+x} ${284+y} ${429+x} ${302+y} ${412+x} ${316+y}C${399+x} ${326+y} ${367+x} ${304+y} ${343+x} ${311+y}L${345+x} ${326+y}C${382+x} ${319+y} ${411+x} ${348+y} ${437+x} ${329+y}C${476+x} ${303+y} ${431+x} ${277+y} ${368+x} ${259+y}C${333+x} ${249+y} ${316+x} ${239+y} ${334+x} ${226+y}Z`,'er',21);
  const prikker=medRibosomer?[[320,240],[340,259],[371,274],[407,290],[424,310]].map(([px,py])=>
   `<circle cx="${px+x}" cy="${py+y+2}" r="4.2" fill="#375a66" opacity=".5"/><circle cx="${px+x}" cy="${py+y}" r="4" fill="url(#dyr-gul)"/>`).join(''):'';
  return membran+prikker;
 }).join('');
 return medRibosomer?`<g transform="translate(1040 -60) scale(-1 1)">${folder}</g>`:folder;
}
const ruER=erNet(true);
const glatER=erNet();
const golgi=Array.from({length:5},(_,i)=>{const x=i*8,y=i*17;return sæk(`M${591+x} ${319+y}C${624+x} ${340+y} ${699+x} ${327+y} ${718+x} ${299+y}C${742+x} ${287+y} ${750+x} ${301+y} ${729+x} ${322+y}C${692+x} ${357+y} ${615+x} ${369+y} ${578+x} ${344+y}C${561+x} ${330+y} ${572+x} ${314+y} ${591+x} ${319+y}Z`,'golgi',26);}).join('');
function mitochondrie(x,y,angle,l=116,h=51){const rx=l/2,ry=h/2;const crêtes=Array.from({length:7},(_,i)=>{const xx=-rx+14+i*(l-28)/6;return `<path d="M${xx} ${-ry+8}C${xx-9} ${-ry+20} ${xx+11} ${ry-20} ${xx} ${ry-8}" fill="none" stroke="#60c8d8" stroke-width="3"/>`;}).join('');return `<g transform="translate(${x} ${y}) rotate(${angle})"><ellipse cy="9" rx="${rx}" ry="${ry}" fill="#0a536e"/><ellipse rx="${rx}" ry="${ry}" fill="url(#dyr-mito)" stroke="#08718d" stroke-width="2.5"/><ellipse rx="${rx-6}" ry="${ry-6}" fill="url(#dyr-mito-indre)" stroke="#66d4dc" stroke-width="2"/>${crêtes}<path d="M${-rx+15} -4q15-15 27 3t29 1t25-1" fill="none" stroke="#b177a6" stroke-width="1.5" opacity=".7"/></g>`;}
const mitokondrier=mitochondrie(287,365,65,125,53)+mitochondrie(353,415,38,126,54)+mitochondrie(546,471,-9,152,58);
const kerne=`<ellipse cx="506" cy="244" rx="116" ry="109" fill="#58789f" opacity=".2" transform="translate(9 15)"/>
 <path d="M397 225C385 170 431 111 494 110C573 102 625 177 614 246C609 286 591 316 560 327C477 346 412 302 397 225Z" fill="url(#dyr-kerne)" stroke="#6173a6" stroke-width="3"/>
 <path d="M407 184C447 165 499 183 540 217C576 247 594 283 579 311C520 344 443 318 411 281C389 254 392 215 407 184Z" fill="url(#dyr-kerne-snit)" stroke="#acb8df" stroke-width="3"/>
 <g clip-path="url(#dyr-kernesnit)">${Array.from({length:9},(_,i)=>`<path d="${boelge(410+(i%3)*28,198+i*12,499+(i%3)*31,222+i*10,11,3)}" fill="none" stroke="${i%2?'#9a74b0':'#aa89b8'}" stroke-width="2.4" opacity=".75"/>`).join('')}</g>`;
const kernemembran=`<path d="M407 184C447 165 499 183 540 217C576 247 594 283 579 311C520 344 443 318 411 281C389 254 392 215 407 184Z" fill="none" stroke="#6479a8" stroke-width="6"/>
 <path d="M410 187C449 170 498 188 537 220C572 249 589 282 575 308" fill="none" stroke="#cad2ee" stroke-width="2"/>
 ${[[510,127],[548,144],[579,174],[595,208],[595,244],[585,274]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="4" ry="2.8" transform="rotate(45 ${x} ${y})" fill="#455d91" stroke="#a6b5de" stroke-width="1.5"/>`).join('')}`;
const ribosomer=[[273,301],[263,329],[379,482],[404,455],[438,492],[668,456],[701,436],[737,279],[555,400],[522,419]].map(([x,y])=>`<circle cx="${x+1}" cy="${y+3}" r="4.4" fill="#3e8598" opacity=".35"/><circle cx="${x}" cy="${y}" r="4.2" fill="url(#dyr-gul)"/>`).join('');
const vesikler=[[752,354,12],[748,407,11],[705,458,10]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#dyr-gul)" stroke="#b27a20" stroke-width="1.8"/><circle cx="${x-3}" cy="${y-3}" r="3" fill="#fff1bb" opacity=".8"/>`).join('');
export const illustration = [
 {ord:null,svg:definitioner}, {ord:'cytoplasma',svg:cyto},
 {ord:'ruER',svg:ruER}, {ord:'cellekerne',svg:kerne},
 {ord:'kernemembran',svg:kernemembran}, {ord:'glatER',svg:glatER},
 {ord:'golgi',svg:golgi}, {ord:'ribosom',svg:ribosomer},
 {ord:'mitokondrie',svg:mitokondrier},
 {ord:'vesikel',svg:vesikler}, {ord:'cellemembran',svg:kant}
];
// Fælles ankre og zoomudsnit i originalfigurens koordinater.
export const udsnit={x:500,y:78};
export const ankre={cellekerne:[464,245],mitokondrie:[353,415],golgi:[656,390],ruER:[678,217]};
