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
  sted('luft','Atmosfæren',[1430,95],'M1310 15H1558V230H1310Z',['co2'],'Kulstof i atmosfæren findes især som CO₂. Gassen kan optages af planter og udveksles med havet.'),
  sted('skov','Skov',[225,270],'M5 100H455V430H5Z',['organisk'],'Træerne bygger organisk stof af CO₂ ved fotosyntese. Kulstoffet bliver blandt andet en del af ved, blade og rødder.'),
  sted('jord','Humus og døde blade',[195,470],'M5 415L440 455V500H5Z',['organisk'],'Døde blade, rødder og humus indeholder organisk kulstof. Ved nedbrydning kan kulstoffet frigives som CO₂.'),
  sted('roeg','Røggas',[610,230],'M545 170H680V310H545Z',['co2'],'Forbrænding af fossile brændsler frigiver CO₂. En cementovn kan desuden frigive CO₂ fra selve kalkstenen.'),
  sted('vulkan','Vulkanske gasser',[1200,105],'M1100 35H1300V195H1100Z',['co2'],'Vulkansk afgasning fører CO₂ fra Jordens indre til atmosfæren. Noget af kulstoffet har været bundet i bjergarter.'),
  sted('hav','Havvand',[1370,515],'M1260 440H1558V640H1260Z',['co2'],'CO₂ kan opløses i havvand og afgives til luften igen. Havet rummer også andre opløste kulstofformer; dem undersøger du på B-niveau.','Havvandet indeholder både CO₂, HCO₃⁻ og CO₃²⁻. Det meste af det opløste uorganiske kulstof findes som HCO₃⁻. De tre kort hører til i det samme vand.'),
  sted('plankton','Plankton og tang',[1115,600],'M960 490H1245V675H960Z',['organisk'],'Planteplankton og tang bruger opløst CO₂ ved fotosyntese. Kulstoffet i organismernes væv er organisk bundet.'),
  sted('skaller','Kalkskaller',[1445,680],'M1240 640H1558V710H1240Z',['kalk'],'Muslingers og visse planktonorganismers skaller består af kalk. Skallernes kulstof er bundet i et fast mineral.','Kalkskaller indeholder calciumkarbonat, CaCO₃. Det er fast mineralbundet kulstof; de to ionkort i opgaven beskriver opløste former i vand.'),
  sted('kul','Kullag',[190,800],'M5 720L420 755V875H5Z',['organisk'],'Kul stammer især fra begravede landplanter og består af stærkt omdannet organisk stof. Kul er ikke det samme som kalk.'),
  sted('gas','Naturgas',[655,750],'M450 750Q650 670 885 780H450Z',['organisk'],'Naturgas er organisk bundet kulstof og består især af metan, CH₄. Når gassen brændes, dannes CO₂.'),
  sted('olie','Olie',[650,805],'M450 780H885L750 830H450Z',['organisk'],'Olie består især af kulbrinter fra gammelt organisk stof. Her bruges den fælles kategori organisk kulstof.'),
  sted('kalksten','Kalksten',[1170,800],'M1030 725Q1260 720 1558 735V865L1030 830Z',['kalk'],'Kalksten lagrer kulstof bundet i kalk. Bjergarten kan dannes af kalksedimenter og skaller over geologiske tidsrum.','Kulstoffet i kalksten er bundet i karbonatmineraler som calciumkarbonat, CaCO₃. Kalksten er ikke et fossilt brændsel.'),
  sted('flod','Flodvand',[985,365],'M900 310H1080V430H900Z',[],'','Floder fører blandt andet opløst HCO₃⁻ fra kemisk forvitring ud i havet. Pilen viser transport af opløste stoffer og ikke kun sand og grus.')
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
  {id:'foto',navn:'Fotosyntese',sti:'M780 90Q490 110 300 235',tekst:'Planter og planteplankton bruger CO₂ til at danne organisk stof ved hjælp af lysenergi.'},
  {id:'resp',navn:'Respiration og nedbrydning',sti:'M325 470Q470 350 400 150',tekst:'Planter, dyr, rødder og nedbrydere omsætter organisk stof og afgiver CO₂. Planter har også respiration.'},
  {id:'udveksling',navn:'Udveksling mellem hav og luft',sti:'M1420 290Q1470 365 1400 475',dobbelt:true,tekst:'CO₂ kan både opløses i havet og afgives til luften. Temperatur og forskelle i CO₂-partialtryk har betydning.'},
  {id:'forvitring',navn:'Kemisk forvitring og flodtransport',sti:'M820 180Q860 285 980 355T1140 455',tekst:'CO₂ opløst i vand reagerer med silikatmineraler. Kulstoffet og andre opløste stoffer føres med vandet ud i havet. Mekanisk sønderdeling af sten optager ikke i sig selv CO₂.',tekstB:'Ved silikatforvitring forbruges CO₂. Kulstoffet føres videre i vandet, især som HCO₃⁻, sammen med ioner frigivet fra mineralerne.'},
  {id:'pumpe',navn:'Biologisk pumpe og sedimentation',sti:'M1140 560Q1220 655 1330 715',tekst:'Dødt plankton og andre partikler synker ned i havet. Det meste nedbrydes eller opløses; en lille del aflejres og begraves.'},
  {id:'kalk',navn:'Kalkdannelse og diagenese',sti:'M1460 710Q1330 805 1180 865',tekst:'Kalkskaller og andre kalkpartikler kan aflejres og med tiden blive til kalksten. Kalkdannelse frigiver også CO₂; sammen med silikatforvitring giver den netto lagring.',tekstB:'Kalkdannelse kan beskrives som Ca²⁺ + 2 HCO₃⁻ → CaCO₃ + CO₂ + H₂O. Sammen med silikatforvitring giver processen netto lagring af kulstof.'},
  {id:'dybet',navn:'Subduktion, metamorfose og vulkansk afgasning',sti:'M1180 940Q950 985 870 800T1155 190',tekst:'Kulstofholdige sedimenter og bjergarter kan føres i dybet. Ved opvarmning og reaktioner kan CO₂ frigives og senere afgasses. Det kræver ikke fuldstændig opsmeltning.'},
  {id:'haevning',navn:'Landhævning og erosion',sti:'M1090 865Q880 695 745 270',tekst:'Bjergarter løftes og blotlægges ved erosion, så de kan forvitre igen. Hævningen flytter bjergarter, men optager ikke i sig selv CO₂ fra atmosfæren.'},
  {id:'fossil',navn:'Begravelse og fossildannelse',sti:'M350 505Q420 690 600 810',tekst:'En lille del af det organiske stof undgår fuldstændig nedbrydning. Over millioner af år kan det under særlige forhold danne kul, olie og naturgas.'},
  {id:'brand',navn:'Forbrænding',sti:'M680 815Q815 510 610 255',tekst:'Forbrænding flytter kulstof fra fossile brændsler til atmosfæren som CO₂ langt hurtigere, end de geologiske lagre gendannes.'},
  {id:'cement',navn:'Cementproduktion',sti:'M1080 870Q960 460 650 250',tekst:'Når kalksten opvarmes i cementproduktion, kan CO₂ frigives fra selve kalken. Ovnenes brændsel kan give yderligere udledning.'}
];
