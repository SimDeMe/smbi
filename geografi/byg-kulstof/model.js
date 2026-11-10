// Puljer og overførsler i et skematisk kulstofkredsløb.
const PULJEPUNKTER = {
  luft:{punkt:[1430,180],boks:[1390,360]},
  skov:{punkt:[225,670],boks:[230,590]},
  jord:{punkt:[195,870],boks:[250,970]},
  hav:{punkt:[1370,915],boks:[1360,870]},
  plankton:{punkt:[1115,1000],boks:[1100,965]},
  skaller:{punkt:[1445,1080],boks:[1330,1030]},
  kul:{punkt:[190,1200],boks:[200,1250]},
  gas:{punkt:[655,1150],boks:[640,1060]},
  olie:{punkt:[650,1205],boks:[700,1260]},
  kalksten:{punkt:[1170,1200],boks:[1240,1295]},
};
export const PULJER = [
  ['hav','Havvand','Det åbne vand i havet.'],
  ['kul','Kul','Det mørke, faste lag i undergrunden.'],
  ['skov','Planter på land','De levende træer og deres rødder.'],
  ['luft','Atmosfæren','Luften over landskabet.'],
  ['kalksten','Kalksten','Det lyse bjergartslag med fossiler under havet.'],
  ['jord','Jordens organiske stof','Døde blade, humus og rester i det øverste jordlag.'],
  ['gas','Naturgas','Den øverste del af olie- og gasfælden.'],
  ['skaller','Kalkskaller','De aflejrede skaller på havbunden.'],
  ['olie','Olie','Den mørke del af fælden under naturgassen.'],
  ['plankton','Havets organismer','Tang og andre levende organismer i havet.']
].map(([id,navn,tekst])=>({id,navn,tekst,...PULJEPUNKTER[id]}));

// Pilene går mellem tekstbokse med procesnavnet som mellemstation.
// Landhævning forbindes med næste proces, fordi blotlægning ikke frigiver CO₂.
export const FORBINDELSER = {
 foto:[['luft','foto'],['foto','skov'],['hav','plankton']],
 resp:[['jord','resp'],['skov','resp'],['resp','luft']],
 udveksling:[['luft','udveksling'],['udveksling','hav']],
 pumpe:[['plankton','pumpe'],['pumpe','hav']],
 brand:[['kul','brand'],['olie','brand'],['gas','brand'],['brand','luft']],
 forvitring:[['luft','forvitring'],['forvitring','hav']],
 kalk:[['skaller','kalk'],['kalk','kalksten']],
 dybet:[['kalksten','dybet'],['dybet','luft']],
 haevning:[['kalksten','haevning'],['haevning','forvitring']],
 fossil:[['jord','fossil'],['plankton','fossil'],['fossil','kul'],['fossil','olie'],['fossil','gas']],
 cement:[['kalksten','cement'],['cement','luft']]
};
export const PROCESSER = [
 {id:'foto',navn:'Fotosyntese',lag:1,boks:[850,220],tekst:'Planter og planteplankton optager CO₂ og bygger organisk stof ved hjælp af lysenergi. På land kommer kulstoffet fra luften; i havet fra vandet.'},
 {id:'resp',navn:'Respiration og nedbrydning',lag:1,boks:[600,400],tekst:'Pilene forbinder planter og jordens organiske stof med atmosfæren. Planter, dyr og nedbrydere omsætter organisk stof og afgiver CO₂ ved respiration. Også levende planter har respiration. Nedbrydning kan flytte kulstof fra jordens organiske stof tilbage til atmosfæren.'},
 {id:'udveksling',navn:'Hav–luft-udveksling',lag:1,boks:[1330,620],dobbelt:true,tekst:'CO₂ udveksles begge veje mellem havoverfladen og atmosfæren. Nettoretningen afhænger blandt andet af temperatur og forskellen i CO₂-partialtryk.'},
 {id:'pumpe',navn:'Biologisk pumpe',lag:1,boks:[1330,1195],tekst:'Dødt plankton og andre organiske partikler synker mod dybhav og havbund. Det meste nedbrydes; en lille del aflejres og begraves. Den biologiske pumpe flytter kulstof ned fra havets øvre lag.'},
 {id:'brand',navn:'Forbrænding',lag:1,boks:[600,730],tekst:'Forbrænding af kul, olie og naturgas flytter kulstof fra geologiske lagre til atmosfæren som CO₂. Det sker langt hurtigere, end de fossile brændsler dannes.'},
 {id:'forvitring',navn:'Forvitring og flodtransport',lag:2,boks:[840,610],tekst:'CO₂ opløst i vand reagerer med silikatmineraler under kemisk forvitring. Floder fører opløste stoffer videre til havet. Mekanisk sønderdeling af sten optager ikke i sig selv CO₂.'},
 {id:'kalk',navn:'Aflejring af kalk',lag:2,boks:[1030,1130],tekst:'Kalkskaller kan aflejres på havbunden, begraves og med tiden blive til kalksten. Kulstoffet lagres i bjergarten. Selve dannelsen af kalk frigiver også CO₂; sammen med silikatforvitring kan forløbet give netto lagring.'},
 {id:'dybet',navn:'Vulkansk afgasning',lag:2,boks:[1330,100],tekst:'Kulstofholdige bjergarter kan føres i dybet. Ved opvarmning og reaktioner kan CO₂ frigives og senere afgasses gennem vulkaner. Den samlede pil forenkler transporten i dybet; fuldstændig opsmeltning er ikke en forudsætning.'},
 {id:'haevning',navn:'Landhævning og erosion',lag:2,boks:[640,490],tekst:'Landhævning og erosion blotlægger bjergarter, så de igen kan udsættes for forvitring. Hævningen flytter kulstofholdige bjergarter, men optager ikke i sig selv CO₂.'},
 {id:'fossil',navn:'Fossildannelse',lag:2,boks:[380,1110],tekst:'En lille del af det organiske stof undgår fuldstændig nedbrydning og begraves. Over millioner af år kan landplanter under særlige forhold danne kul; især marint organisk stof kan danne olie og naturgas. Pilene samler begravelse og senere omdannelse.'},
 {id:'cement',navn:'Cementproduktion',lag:2,boks:[720,820],tekst:'Når kalksten opvarmes ved cementproduktion, kan CO₂ frigives fra selve kalken. Brændslet til ovnen giver desuden udledning, som hører til forbrænding.'}
];
export const LAG = [
 {navn:'Puljerne',ord:PULJER.map(p=>p.id),intro:'En pulje er et lager for kulstof. Sæt navnene på puljerne i landskabet.'},
 {navn:'De hurtige processer',ord:PROCESSER.filter(p=>p.lag===1).map(p=>p.id),intro:'Sæt navn på de fem processer: biologisk omsætning, havudveksling og forbrænding.'},
 {navn:'De geologiske processer',ord:PROCESSER.filter(p=>p.lag===2).map(p=>p.id),intro:'Sæt navn på de seks geologiske og industrielle processer. Følg blandt andet kulstoffet gennem forvitring, floder og bjergarter.'}
];
export const ALLE = [...PULJER,...PROCESSER];
export function hentData(d){
 const gamlePuljer=Array.isArray(d?.puljer)?d.puljer:[];
 const gemte=d?.version===4&&Array.isArray(d?.loest)?d.loest:gamlePuljer;
 const loest=new Set(gemte.filter(id=>ALLE.some(p=>p.id===id)));
 // Senere lag må ikke få genveje fra ugyldige eller ældre kemisvar.
 let lag=Number.isInteger(d?.lag)&&d.version===4?Math.max(0,Math.min(2,d.lag)):0;
 for(let i=0;i<lag;i++)if(!LAG[i].ord.every(id=>loest.has(id))){lag=i;break;}
 for(let i=lag+1;i<LAG.length;i++)for(const id of LAG[i].ord)loest.delete(id);
 const forsoeg=LAG.map((_,i)=>({fejl:Math.max(0,Number(d?.forsoeg?.[i]?.fejl)||0),hint:Math.max(0,Number(d?.forsoeg?.[i]?.hint)||0)}));
 return {lag,loest,forsoeg,stjerner:LAG.map((_,i)=>d?.version===4&&d?.stjerner?.[i]===true&&LAG[i].ord.every(id=>loest.has(id)))};
}
export function gemData(m){return {version:4,lag:m.lag,loest:[...m.loest],forsoeg:m.forsoeg,stjerner:m.stjerner};}
