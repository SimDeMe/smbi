import { FARVE as F, del, rect, ellipse, trae, tekst, pil, pilOmr, plads, ramme, grund } from './tegn.js';

const P = {
  fotosyntese:'M590 145 Q390 135 300 260',
  respiration:'M385 290 Q570 330 630 165',
  doedtstof:'M160 400 L160 565',
  jordrespiration:'M380 640 Q735 625 775 165',
  gasudveksling:'M910 150 Q1130 155 1140 250',
  havcirkulation:'M1290 420 L1290 570',
  biologiskpumpe:'M955 395 C790 430 785 610 955 660'
};
export default {
  id:'hurtig', navn:'Land og hav',
  intro:'Kulstof lagres i luft, planter, jord og hav. Sæt navn på lagrene og på de processer, der flytter kulstof mellem dem. Pilene viser kulstof, ikke energi.',
  vb:[1400,820], boks:[240,42], mobilBredde:1000, graa:'let',
  lag:[
    {navn:'Lagrene i det hurtige kredsløb',ord:['atmosfaere','vegetation','jord','overfladehav','dybhav']},
    {navn:'Planter og jord',ord:['fotosyntese','respiration','doedtstof','jordrespiration']},
    {navn:'Havet flytter også kulstof',ord:['gasudveksling','havcirkulation','biologiskpumpe']}
  ],
  dele:[
    grund(),
    del(null,`<path d="M25 430Q240 400 410 440V800H25Z" fill="#eee1bf"/>${tekst(210,800,'Land',18)}${tekst(1140,800,'Hav',18)}`),
    del('atmosfaere',`${ellipse(700,110,200,65,F.luft)}${tekst(700,125,'CO₂',34)}`),
    del('vegetation',trae(150,330,.9)+trae(245,330,1.1)+trae(335,340,.85)),
    del('jord',`${rect(40,590,370,190,F.jord)}<path d="M70 620Q180 580 220 645T380 635M110 675q30-35 65 5t90-8" fill="none" stroke="#735936" stroke-width="5"/><g fill="#604d35"><circle cx="90" cy="705" r="7"/><circle cx="300" cy="685" r="6"/><circle cx="365" cy="724" r="8"/></g>`),
    del('overfladehav',`${rect(900,230,460,180,'#8bc7de')}<path d="M925 266q25-15 50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0" fill="none" stroke="#e8f6fa" stroke-width="5"/>${tekst(1110,304,'CO₂ · HCO₃⁻ · plankton',24)}`),
    del('dybhav',`${rect(900,590,460,190,'#7daac9')}${tekst(1120,660,'Opløst kulstof',26)}<path d="M950 695h300m-250 28h200" stroke="#cce5f2" stroke-width="3"/>`),
    ...Object.entries(P).map(([id,p])=>pil(id,p,id==='fotosyntese'?'#46884f':id==='gasudveksling'||id==='havcirkulation'||id==='biologiskpumpe'?F.proces:'#a27350',id==='gasudveksling'||id==='havcirkulation')),
    del(null,tekst(670,800,'Sekunder til århundreder – nogle jordlagre er ældre',18))
  ],
  pladser:[
    plads('atmosfaere',700,65,[700,120],`<ellipse cx="700" cy="110" rx="200" ry="65" fill="none" stroke-width="9"/>`),
    plads('vegetation',220,370,[245,280],ramme(90,195,300,150)),
    plads('jord',220,740,[220,645],ramme(40,590,370,190)),
    plads('overfladehav',1130,370,[1110,300],ramme(900,230,460,180)),
    plads('dybhav',1130,740,[1110,650],ramme(900,590,460,190)),
    plads('fotosyntese',300,135,[420,173],pilOmr(P.fotosyntese),{respiration:'Denne pil fører kulstof fra luften ind i planterne, ikke fra planterne ud i luften.'}),
    plads('respiration',650,365,[539,279],pilOmr(P.respiration),{fotosyntese:'Denne pil går fra planterne tilbage til luften. Planterne afgiver også CO₂.'}),
    plads('doedtstof',175,490,[160,535],pilOmr(P.doedtstof)),
    plads('jordrespiration',650,545,[656,514],pilOmr(P.jordrespiration)),
    plads('gasudveksling',1120,135,[1078,178],pilOmr(P.gasudveksling)),
    plads('havcirkulation',1150,510,[1290,510],pilOmr(P.havcirkulation),{biologiskpumpe:'Her flyttes kulstof med selve havvandet, ikke som synkende organiske partikler.'}),
    plads('biologiskpumpe',650,740,[844,585],pilOmr(P.biologiskpumpe),{havcirkulation:'Her synker organiske partikler ned gennem vandet. Det er ikke en strøm af havvand.'})
  ]
};
