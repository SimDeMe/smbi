import { FARVE as F, del, rect, ellipse, trae, skal, tekst, pil, pilOmr, plads, ramme, grund } from './tegn.js';
const P = {
  begravelse:'M140 320 L140 505',
  fossildannelse:'M290 560 Q390 650 535 670',
  forbraending:'M620 620 C625 435 760 260 1000 150',
  afskovning:'M310 270 Q590 265 955 155',
  cement:'M1170 620 C1310 460 1270 280 1180 165'
};
export default {
  id:'mennesker',navn:'Fossilt kulstof og mennesker',
  intro:'Kulstof i fossile brændsler og kulstof i kalk er to forskellige geologiske lagre. Byg deres dannelse og forbind dem med menneskets udledninger.',
  vb:[1400,820],boks:[240,42],mobilBredde:1000,graa:'let',
  lag:[
    {navn:'Luft og to lagre i undergrunden',ord:['atmosfaere','fossiler','kalksten']},
    {navn:'En langsom dannelse – en hurtig udledning',ord:['begravelse','fossildannelse','forbraending']},
    {navn:'Andre menneskelige påvirkninger',ord:['afskovning','cement']}
  ],
  dele:[
    grund(),
    del(null,`<path d="M25 570Q650 600 1375 565V800H25Z" fill="#eee1c8"/>${trae(145,310,.9)}${trae(245,310,.8)}${tekst(210,185,'Planter og plankton',23)}${rect(50,490,310,100,'#d7c6a5')}${tekst(205,540,'Dødt organisk stof',24)}<path d="M1060 110Q600 -40 250 210" fill="none" stroke="#8fae9a" stroke-width="4" marker-end="url(#kc-spids)"/>${tekst(610,60,'Fotosyntese før begravelse',20)}<path d="M800 340h230v120H800Z M840 340v-75h25v75M915 340v-105h25v105" fill="#8b9d9b" stroke="#526a66" stroke-width="3"/><path d="M815 380h30m20 0h30m20 0h30m20 0h30m-180 30h30m20 0h30m20 0h30m20 0h30" stroke="#e4e8db" stroke-width="12"/>${tekst(915,490,'Industri og energi',20)}`),
    del('atmosfaere',`${ellipse(1150,110,205,65,F.luft)}${tekst(1150,130,'CO₂',34)}`),
    del('fossiler',`${rect(465,620,290,170,'#bdab90')}<path d="M480 680q90-30 260-7l-10 25q-150-25-250 10Z" fill="#3e4742"/><path d="M650 700q-24 31 0 31t0-31" fill="#383e39"/>${tekst(600,650,'Kul · olie · gas',22)}`),
    del('kalksten',`${rect(975,620,360,170,'url(#kc-kalk)',14)}${skal(1050,670,.8)}${skal(1250,685,.7)}`),
    ...Object.entries(P).map(([id,p])=>pil(id,p,id==='begravelse'||id==='fossildannelse'?F.geologi:F.menneske)),
    del(null,`${tekst(275,795,'Bevares kun under særlige forhold',18)}${tekst(1060,795,'Kalk er ikke et fossilt brændsel',18)}`)
  ],
  pladser:[
    plads('atmosfaere',1150,65,[1150,125],`<ellipse cx="1150" cy="110" rx="205" ry="65" fill="none" stroke-width="9"/>`),
    plads('fossiler',600,750,[600,685],ramme(465,620,290,170),{kalksten:'Dette lager består af kul, olie og naturgas. Kulstoffet stammer fra gammelt organisk stof.'}),
    plads('kalksten',1150,750,[1160,670],ramme(975,620,360,170),{fossiler:'Her er kulstoffet bundet i mineralet calciumkarbonat. Det er ikke brændbart kul, olie eller gas.'}),
    plads('begravelse',200,420,[140,465],pilOmr(P.begravelse)),
    plads('fossildannelse',430,610,[430,640],pilOmr(P.fossildannelse)),
    plads('forbraending',650,330,[722,357],pilOmr(P.forbraending)),
    plads('afskovning',600,175,[600,235],pilOmr(P.afskovning)),
    plads('cement',1150,450,[1260,370],pilOmr(P.cement),{forbraending:'Denne pil begynder i kalken. Her frigives CO₂ ved en kemisk spaltning af calciumkarbonat.'})
  ]
};
