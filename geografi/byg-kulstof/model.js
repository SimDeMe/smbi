// Puljer og overførsler i et skematisk kulstofkredsløb.
const PULJEPUNKTER = {
  luft:{punkt:[1430, 95],boks:[1390, 65]},
  skov:{punkt:[225, 270],boks:[230, 190]},
  jord:{punkt:[195, 470],boks:[250, 570]},
  hav:{punkt:[1370, 515],boks:[1360, 470]},
  plankton:{punkt:[1115, 600],boks:[1100, 565]},
  skaller:{punkt:[1445, 680],boks:[1390, 630]},
  kul:{punkt:[190, 800],boks:[200, 850]},
  gas:{punkt:[655, 750],boks:[640, 660]},
  olie:{punkt:[650, 805],boks:[700, 940]},
  kalksten:{punkt:[1170, 800],boks:[1240, 895]},
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

// Hver proces har én navneplads. Flere stier kan vise samme proces.
export const PROCESSER = [
 {id:'foto',navn:'Fotosyntese',lag:1,boks:[650,75],maal:[434,167],stier:['M1020 75 C800 25 510 80 300 260','M1370 550 Q1260 510 1140 590'],tekst:'Planter og planteplankton optager CO₂ og bygger organisk stof ved hjælp af lysenergi. På land kommer kulstoffet fra luften; i havet fra vandet.'},
 {id:'resp',navn:'Respiration og nedbrydning',lag:1,boks:[255,365],maal:[419,293],stier:['M230 455 C420 465 445 250 420 100'],tekst:'Planter, dyr og nedbrydere omsætter organisk stof og afgiver CO₂ ved respiration. Også levende planter har respiration. Nedbrydning kan flytte kulstof fra jordens organiske stof tilbage til atmosfæren.'},
 {id:'udveksling',navn:'Hav–luft-udveksling',lag:1,boks:[1330,310],maal:[1473,388],stier:['M1460 210 Q1510 360 1430 505'],dobbelt:true,tekst:'CO₂ udveksles begge veje mellem havoverfladen og atmosfæren. Nettoretningen afhænger blandt andet af temperatur og forskellen i CO₂-partialtryk.'},
 {id:'pumpe',navn:'Biologisk pumpe',lag:1,boks:[1270,750],maal:[1300,672],stier:['M1130 605 Q1200 660 1400 695'],tekst:'Dødt plankton og andre organiske partikler synker mod dybhav og havbund. Det meste nedbrydes; en lille del aflejres og begraves. Den biologiske pumpe flytter kulstof ned fra havets øvre lag.'},
 {id:'brand',navn:'Forbrænding',lag:1,boks:[785,510],maal:[736,449],stier:['M650 805 C840 700 850 475 590 325 Q540 220 710 150'],tekst:'Forbrænding af kul, olie og naturgas flytter kulstof fra geologiske lagre til atmosfæren som CO₂. Det sker langt hurtigere, end de fossile brændsler dannes.'},
 {id:'forvitring',navn:'Forvitring og flodtransport',lag:2,boks:[1030,300],maal:[1020,400],stier:['M760 160 C850 210 855 290 965 360 Q1035 420 1200 445'],tekst:'CO₂ opløst i vand reagerer med silikatmineraler under kemisk forvitring. Floder fører opløste stoffer videre til havet. Mekanisk sønderdeling af sten optager ikke i sig selv CO₂.'},
 {id:'kalk',navn:'Aflejring af kalk',lag:2,boks:[1320,845],maal:[1461,754],stier:['M1450 685 Q1510 735 1400 810'],tekst:'Kalkskaller kan aflejres på havbunden, begraves og med tiden blive til kalksten. Kulstoffet lagres i bjergarten. Selve dannelsen af kalk frigiver også CO₂; sammen med silikatforvitring kan forløbet give netto lagring.'},
 {id:'dybet',navn:'Vulkansk afgasning',lag:2,boks:[1320,190],maal:[1180,130],stier:['M1230 870 C1300 990 1530 940 1530 780 L1530 530 C1530 250 1120 300 1180 130'],tekst:'Kulstofholdige bjergarter kan føres i dybet. Ved opvarmning og reaktioner kan CO₂ frigives og senere afgasses gennem vulkaner. Den samlede pil forenkler transporten i dybet; fuldstændig opsmeltning er ikke en forudsætning.'},
 {id:'haevning',navn:'Landhævning og erosion',lag:2,boks:[650,260],maal:[794,432],stier:['M1040 820 C920 720 810 580 755 260'],tekst:'Landhævning og erosion blotlægger bjergarter, så de igen kan udsættes for forvitring. Hævningen flytter kulstofholdige bjergarter, men optager ikke i sig selv CO₂.'},
 {id:'fossil',navn:'Fossildannelse',lag:2,boks:[310,705],maal:[160,636],stier:['M200 480 Q125 640 190 785','M1130 695 C1050 970 810 965 670 815'],tekst:'En lille del af det organiske stof undgår fuldstændig nedbrydning og begraves. Over millioner af år kan landplanter under særlige forhold danne kul; især marint organisk stof kan danne olie og naturgas. Pilene samler begravelse og senere omdannelse.'},
 {id:'cement',navn:'Cementproduktion',lag:2,boks:[610,560],maal:[800,551],stier:['M1170 800 C1040 720 790 620 650 350 Q650 220 760 150'],tekst:'Når kalksten opvarmes ved cementproduktion, kan CO₂ frigives fra selve kalken. Brændslet til ovnen giver desuden udledning, som hører til forbrænding.'}
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
