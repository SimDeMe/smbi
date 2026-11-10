// Et fælles landskab. Samme kort kan bruges på flere elementer.
// C viser brede bindingstyper; B udvider med havets og flodens opløste ioner.
export const FORMER = {
  co2: {navn:'CO₂',kort:'CO₂',under:'Kuldioxid',farve:'#c8e8f4',niveau:'C'},
  organisk: {navn:'Organisk kulstof',kort:'Organisk',under:'I levende og dødt organisk stof',farve:'#cde6b1',niveau:'C'},
  kalk: {navn:'Kulstof i kalk',kort:'I kalk',under:'Bundet i fast kalk',farve:'#f2dfb2',niveau:'C'},
  hco3: {navn:'HCO₃⁻',kort:'HCO₃⁻',under:'Hydrogenkarbonat i vand',farve:'#bfe5df',niveau:'B'},
  co3: {navn:'CO₃²⁻',kort:'CO₃²⁻',under:'Karbonat i vand',farve:'#d8d2ef',niveau:'B'}
};
const sted = (id,navn,punkt,omraade,former,tekst,tekstB) => ({id,navn,punkt,omraade,former,tekst,tekstB});
export const STEDER = [
  sted('luft','Atmosfæren',[240,105],'M30 25H430V190H30Z',['co2'],'Kulstof i atmosfæren findes især som CO₂. Gassen kan optages af planter og udveksles med havet.'),
  sted('skov','Skov',[220,345],'M45 200H430V445H45Z',['organisk'],'Træerne bygger organisk stof af CO₂ ved fotosyntese. Kulstoffet bliver blandt andet en del af ved, blade og rødder.'),
  sted('jord','Humus og døde blade',[240,550],'M45 460H430V635H45Z',['organisk'],'Døde blade, rødder og humus indeholder organisk kulstof. Ved nedbrydning kan kulstoffet frigives som CO₂.'),
  sted('roeg','Røggas',[585,170],'M445 60H740V245H445Z',['co2'],'Forbrænding af fossile brændsler frigiver CO₂. En cementovn kan desuden frigive CO₂ fra selve kalkstenen.'),
  sted('vulkan','Vulkanske gasser',[1030,125],'M870 30H1235V220H870Z',['co2'],'Vulkansk afgasning fører CO₂ fra Jordens indre til atmosfæren. Noget af kulstoffet har været bundet i bjergarter.'),
  sted('hav','Havvand',[1355,510],'M1060 445H1590V600H1060Z',['co2'],'CO₂ kan opløses i havvand og afgives til luften igen. Havet rummer også andre opløste kulstofformer; dem undersøger du på B-niveau.','Havvandet indeholder både CO₂, HCO₃⁻ og CO₃²⁻. Det meste af det opløste uorganiske kulstof findes som HCO₃⁻. De tre kort hører til i det samme vand.'),
  sted('plankton','Plankton og tang',[1200,650],'M1060 610H1340V745H1060Z',['organisk'],'Planteplankton og tang bruger opløst CO₂ ved fotosyntese. Kulstoffet i organismernes væv er organisk bundet.'),
  sted('skaller','Kalkskaller',[1465,745],'M1360 640H1590V815H1360Z',['kalk'],'Muslingers og visse planktonorganismers skaller består af kalk. Skallernes kulstof er bundet i et fast mineral.','Kalkskaller indeholder calciumkarbonat, CaCO₃. Det er fast mineralbundet kulstof; de to ionkort i opgaven beskriver opløste former i vand.'),
  sted('kul','Kullag',[220,770],'M50 680H430V850H50Z',['organisk'],'Kul stammer især fra begravede landplanter og består af stærkt omdannet organisk stof. Kul er ikke det samme som kalk.'),
  sted('gas','Naturgas',[665,715],'M500 635H815V785H500Z',['organisk'],'Naturgas er organisk bundet kulstof og består især af metan, CH₄. Når gassen brændes, dannes CO₂.'),
  sted('olie','Olie',[665,855],'M500 795H815V940H500Z',['organisk'],'Olie består især af kulbrinter fra gammelt organisk stof. Her bruges den fælles kategori organisk kulstof.'),
  sted('kalksten','Kalksten',[1050,855],'M870 770H1265V940H870Z',['kalk'],'Kalksten lagrer kulstof bundet i kalk. Bjergarten kan dannes af kalksedimenter og skaller over geologiske tidsrum.','Kulstoffet i kalksten er bundet i karbonatmineraler som calciumkarbonat, CaCO₃. Kalksten er ikke et fossilt brændsel.'),
  sted('flod','Flodvand',[960,415],'M855 320L1000 355L1055 445L975 485L900 435Z',[],'','Floder fører blandt andet opløst HCO₃⁻ fra kemisk forvitring ud i havet. Pilen viser transport af opløste stoffer og ikke kun sand og grus.')
];
export function krav(sted,niveau) {
  if(sted.id==='hav'&&niveau==='B')return ['co2','hco3','co3'];
  if(sted.id==='flod')return niveau==='B'?['hco3']:[];
  return sted.former;
}
export const noegle = (sted,form) => `${sted}:${form}`;
export function fremskridt(t) {
  const alle=STEDER.flatMap(s=>krav(s,t.niveau).map(f=>noegle(s.id,f)));
  const antal=alle.filter(k=>t.loest.has(k)).length;
  return {antal,total:alle.length,faerdig:antal===alle.length};
}
export function placer(t,stedId,formId) {
  const s=STEDER.find(s=>s.id===stedId), f=FORMER[formId];
  if(!s||!f||!krav(s,t.niveau).length||(t.niveau==='C'&&f.niveau==='B'))return {status:'ukendt'};
  if(krav(s,t.niveau).includes(formId)) {
    const key=noegle(stedId,formId),allerede=t.loest.has(key);t.loest.add(key);
    return {status:allerede?'allerede':'rigtig',tekst:(allerede?'Den form er allerede på plads. ':'Korrekt! ')+(t.niveau==='B'&&s.tekstB?s.tekstB:s.tekst)};
  }
  let tekst=`${f.navn} er ikke den binding, der skal placeres på ${s.navn.toLowerCase()} her. `;
  if(stedId==='hav'&&formId==='organisk')tekst='Havet rummer også organisk kulstof, men feltet »Havvand« handler her om opløst uorganisk kulstof. Placér organisk kulstof på plankton og tang.';
  else if(formId==='co2'&&['skov','jord','kul','olie','gas'].includes(stedId))tekst='CO₂ kan dannes herfra, men opgaven spørger til kulstoffet i selve materialet. Her er det organisk bundet.';
  else if(['skaller','kalksten'].includes(stedId)&&['co3','hco3'].includes(formId))tekst='Her er kulstoffet bundet i fast kalk. Ionkortene er til de opløste former i vand; brug »Kulstof i kalk« på det faste materiale.';
  else if(formId==='kalk'&&['kul','olie','gas'].includes(stedId))tekst='Fossile brændsler stammer fra organisk stof. Kulstof i kalk er bundet i et mineral og skal placeres på kalksten eller kalkskaller.';
  else tekst+=t.niveau==='B'&&s.tekstB?s.tekstB:s.tekst;
  return {status:'forkert',tekst};
}
export function gemData(t) {return {version:2,niveau:t.niveau,loest:[...t.loest]};}
export function hentData(d) {
  const gyldige=new Set(STEDER.flatMap(s=>krav(s,'B').map(f=>noegle(s.id,f))));
  return {niveau:d?.niveau==='B'?'B':'C',loest:new Set(Array.isArray(d?.loest)?d.loest.filter(k=>gyldige.has(k)):[])};
}
export const PROCESSER = [
  {id:'foto',navn:'Fotosyntese',sti:'M320 160Q300 220 240 280',tekst:'Planter og planteplankton bruger CO₂ til at danne organisk stof ved hjælp af lysenergi.'},
  {id:'resp',navn:'Respiration og nedbrydning',sti:'M340 495Q460 375 380 180',tekst:'Planter, dyr, rødder og nedbrydere omsætter organisk stof og afgiver CO₂. Planter har også respiration.'},
  {id:'udveksling',navn:'Udveksling mellem hav og luft',sti:'M1310 280Q1410 335 1370 465',dobbelt:true,tekst:'CO₂ kan både opløses i havet og afgives til luften. Temperatur og forskelle i CO₂-partialtryk har betydning.'},
  {id:'forvitring',navn:'Kemisk forvitring og flodtransport',sti:'M695 205Q750 300 955 415T1110 490',tekst:'CO₂ opløst i vand reagerer med silikatmineraler. Kulstoffet og andre opløste stoffer føres med vandet ud i havet. Mekanisk sønderdeling af sten optager ikke i sig selv CO₂.',tekstB:'Ved silikatforvitring forbruges CO₂. Kulstoffet føres videre i vandet, især som HCO₃⁻, sammen med ioner frigivet fra mineralerne.'},
  {id:'pumpe',navn:'Biologisk pumpe og sedimentation',sti:'M1230 630Q1280 710 1260 790',tekst:'Dødt plankton og andre partikler synker ned i havet. Det meste nedbrydes eller opløses; en lille del aflejres og begraves.'},
  {id:'kalk',navn:'Kalkdannelse og diagenese',sti:'M1460 700Q1390 830 1150 865',tekst:'Kalkskaller og andre kalkpartikler kan aflejres og med tiden blive til kalksten. Kalkdannelse frigiver også CO₂; sammen med silikatforvitring giver den netto lagring.',tekstB:'Kalkdannelse kan beskrives som Ca²⁺ + 2 HCO₃⁻ → CaCO₃ + CO₂ + H₂O. Sammen med silikatforvitring giver processen netto lagring af kulstof.'},
  {id:'dybet',navn:'Subduktion, metamorfose og vulkansk afgasning',sti:'M1120 910Q925 975 850 820T850 285',tekst:'Kulstofholdige sedimenter og bjergarter kan føres i dybet. Ved opvarmning og reaktioner kan CO₂ frigives og senere afgasses. Det kræver ikke fuldstændig opsmeltning.'},
  {id:'haevning',navn:'Landhævning og erosion',sti:'M1010 875Q825 765 700 320',tekst:'Bjergarter løftes og blotlægges ved erosion, så de kan forvitre igen. Hævningen flytter bjergarter, men optager ikke i sig selv CO₂ fra atmosfæren.'},
  {id:'fossil',navn:'Begravelse og fossildannelse',sti:'M350 535Q450 745 585 835',tekst:'En lille del af det organiske stof undgår fuldstændig nedbrydning. Over millioner af år kan det under særlige forhold danne kul, olie og naturgas.'},
  {id:'brand',navn:'Forbrænding',sti:'M700 820Q810 490 600 210',tekst:'Forbrænding flytter kulstof fra fossile brændsler til atmosfæren som CO₂ langt hurtigere, end de geologiske lagre gendannes.'},
  {id:'cement',navn:'Cementproduktion',sti:'M990 835Q910 435 650 215',tekst:'Når kalksten opvarmes i cementproduktion, kan CO₂ frigives fra selve kalken. Ovnenes brændsel kan give yderligere udledning.'}
];
