import { FARVE as F, del, rect, ellipse, skal, tekst, pil, pilOmr, plads, ramme, grund } from './tegn.js';
const P = {
  forvitring:'M300 120 Q460 140 490 250',
  flodtransport:'M530 365 Q700 395 925 405',
  kalkdannelse:'M1090 375 Q1240 380 1210 470',
  sedimentation:'M1090 485 L1090 590',
  diagenese:'M990 590 Q950 620 980 675',
  subduktion:'M1070 700 Q880 675 650 775',
  metamorfose:'M650 775 C450 770 320 620 195 425',
  afgasning:'M195 425 Q95 280 140 145',
  haevning:'M280 685 Q140 660 180 465'
};
export default {
  id:'geologi',navn:'Det langsomme kredsløb',
  intro:'Følg kulstof fra CO₂ i luften gennem kemisk forvitring og havets kalk til undergrunden – og tilbage igen. Her er forvitringen vist på silikatbjergarter.',
  vb:[1400,820],boks:[240,42],mobilBredde:1000,graa:'let',
  lag:[
    {navn:'Steder og materialer',ord:['atmosfaere','silikater','hav','kalksten']},
    {navn:'Fra luft til havbund',ord:['forvitring','flodtransport','kalkdannelse','sedimentation'],ekstra:['mekanisk'],ekstraFejl:{mekanisk:'At dele sten i småstykker optager ikke i sig selv CO₂. Her reagerer CO₂ opløst i vand med mineralerne.'}},
    {navn:'Begravelse og vejen tilbage',ord:['diagenese','subduktion','metamorfose','afgasning','haevning']}
  ],
  dele:[
    grund(),
    del(null,`<path d="M0 490L110 470L195 385L270 465L400 330L500 405L605 445L780 465L910 600H1400V820H0Z" fill="#dfc6a3" stroke="#9e8869" stroke-width="2"/><path d="M805 360H1400V600H910Z" fill="#b4dceb"/><path d="M900 600H1400" stroke="#82938a" stroke-width="4"/>${tekst(1030,800,'Geologiske tidsrum: tusinder til millioner af år',18)}`),
    del('atmosfaere',`${ellipse(190,105,160,65,F.luft)}${tekst(190,125,'CO₂',34)}`),
    del('silikater',`<path d="M280 435L435 220L610 445Z" fill="#b2b2a8" stroke="#56695d" stroke-width="3"/><path d="M435 220l-44 62 36-12 25 24 24-18Z" fill="#f8f4e6"/><path d="M375 354l30-40 25 20m25 26 32 30" stroke="#7d8b7c" stroke-width="3" fill="none"/>`),
    del('hav',`${tekst(1130,310,'HCO₃⁻ · Ca²⁺ · CO₂',27)}<path d="M875 380q23-12 46 0t46 0t46 0" fill="none" stroke="#519ebc" stroke-width="4"/>`),
    del('kalksten',`${rect(930,650,430,130,'url(#kc-kalk)',10)}${skal(1020,703,.8)}${skal(1230,695,.65)}`),
    del(null,`<path d="M930 625 Q805 650 660 800L630 820Q790 670 920 650Z" fill="#b0a18c" stroke="#7c7462" stroke-width="3"/><path d="M85 480L195 330L290 480Z" fill="#c5906e" stroke="#8c6952" stroke-width="3"/><path d="M195 339l-15 24 33 18-18 99" fill="none" stroke="#bb604a" stroke-width="11"/>${tekst(505,810,'Opvarmning i dybet',18)}`),
    ...Object.entries(P).map(([id,p])=>pil(id,p,F.geologi)),
    del('forvitring',`<g stroke="#519ebc" stroke-width="3"><path d="M465 180l-6 20m35-6-6 20m30-9-6 20"/></g>`),
    del('kalkdannelse',skal(1210,468,.85)+skal(1140,455,.65)),
    del('sedimentation',skal(1060,540,.5)+skal(1130,575,.4))
  ],
  pladser:[
    plads('atmosfaere',245,65,[190,120],`<ellipse cx="190" cy="105" rx="160" ry="65" fill="none" stroke-width="9"/>`),
    plads('silikater',435,330,[480,310],`<path d="M280 435L435 220L610 445Z" fill="none" stroke-width="9"/>`),
    plads('hav',1150,330,[1250,390],ramme(835,360,540,240)),
    plads('kalksten',1150,740,[1240,690],ramme(930,650,430,130)),
    plads('forvitring',430,170,[470,200],pilOmr(P.forvitring)),
    plads('flodtransport',730,315,[714,390],pilOmr(P.flodtransport)),
    plads('kalkdannelse',1150,485,[1195,401],pilOmr(P.kalkdannelse)),
    plads('sedimentation',1150,600,[1090,550],pilOmr(P.sedimentation)),
    plads('diagenese',730,740,[968,626],pilOmr(P.diagenese)),
    plads('subduktion',730,640,[784,726],pilOmr(P.subduktion)),
    plads('metamorfose',470,675,[311,586],pilOmr(P.metamorfose)),
    plads('afgasning',125,245,[135,305],pilOmr(P.afgasning)),
    plads('haevning',155,570,[180,505],pilOmr(P.haevning))
  ]
};
