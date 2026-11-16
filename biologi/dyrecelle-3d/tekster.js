// Navne, etiketter og korte faglige forklaringer. Rækkefølgen bruges i
// menuen og i listen over synlige dele. retning/afstand placerer etiketten
// ud fra organellens ankerpunkt i 3D.
export const ORGANELLER=[
 {id:'cellemembran',navn:'Cellemembran',retning:[-.8,.6,.3],afstand:1.6,
  tekst:'Cellemembranen er et dobbeltlag af fosfolipider med indlejrede proteiner. Den afgrænser cellen og styrer, hvad der kommer ind og ud.'},
 {id:'cytoplasma',navn:'Cytoplasma',retning:[.8,-.3,.6],afstand:2.4,
  tekst:'Cytoplasmaet er den vandige cytosol med opløste stoffer, hvor organellerne ligger. Snitfladerne i modellen viser, at cellen er fyldt helt ud.'},
 {id:'kerne',navn:'Cellekerne',retning:[-.55,1,.2],afstand:3.2,
  tekst:'Cellekernen rummer DNA’et som kromatin. Kernehylsteret er to membraner med kerneporer, hvor mRNA og proteiner passerer. Kernelegemet (nukleolus) samler ribosomernes dele. Åbn kernen for at se ind.'},
 {id:'mito',navn:'Mitokondrie',retning:[.35,-.55,1],afstand:2.6,
  tekst:'Mitokondriet har en glat ydre membran og en indre membran, der er foldet ind i cristae. På cristae sidder elektrontransportkæden og ATP-syntase; i matrix inden for kører citronsyrecyklus. Åbn mitokondrierne for at se folderne.'},
 {id:'ruER',navn:'Ru ER',retning:[.6,1,-.2],afstand:3.0,
  tekst:'Ru endoplasmatisk reticulum er flade membransække (cisterner) med ribosomer på ydersiden. Her dannes proteiner til membraner, lysosomer og eksport. Membranen hænger sammen med kernehylsterets ydre membran.'},
 {id:'glatER',navn:'Glat ER',retning:[1,.6,.6],afstand:2.6,
  tekst:'Glat ER er et netværk af membranrør uden ribosomer, der fortsætter fra det ru ER. Her dannes lipider og steroidhormoner, og giftstoffer omdannes.'},
 {id:'golgi',navn:'Golgiapparat',retning:[-.8,.9,.4],afstand:3.0,
  tekst:'Golgiapparatet er en stabel flade, buede sække med fortykkede rande. Proteiner fra ER modificeres, sorteres og pakkes i vesikler. Cis-siden vender mod ER, trans-siden mod cellemembranen.'},
 {id:'lysosom',navn:'Lysosom',retning:[-1,.3,.3],afstand:2.2,
  tekst:'Lysosomer er membranblærer med nedbrydende enzymer i et surt indre. De fordøjer slidte organeller og materiale, cellen har optaget.'},
 {id:'vesikel',navn:'Vesikel',retning:[-.5,-.7,1],afstand:2.2,
  tekst:'Vesikler er små membranblærer, der transporterer stoffer mellem ER, golgiapparatet og cellemembranen – ved exocytose ud af cellen og endocytose ind.'},
 {id:'ribosom',navn:'Frie ribosomer',retning:[.5,1,.6],afstand:2.4,
  tekst:'Frie ribosomer i cytoplasmaet samler proteiner, som skal bruges inde i cellen selv. Ribosomerne på ru ER laver proteiner til membraner og eksport.'},
 {id:'centriol',navn:'Centrioler',retning:[-.4,1,.7],afstand:2.6,
  tekst:'Centriolerne er to vinkelrette cylindre af mikrotubuli i centrosomet. Herfra organiseres tentrådene, når cellen deler sig.'},
 {id:'cytoskelet',navn:'Mikrotubuli',retning:[-.9,-.5,.6],afstand:3.0,
  tekst:'Mikrotubuli er rør af protein, der udgår fra centrosomet. De holder cellens form, og organeller og vesikler transporteres langs dem.'}
];
export const HELE='Træk for at dreje cellen. Klik på en organel, eller vælg den i listen, for at læse om den. Kernen og mitokondrierne kan åbnes, så du kan se membranerne indeni.';
