// Funktionsopgaven i «Byg cellen»: hvad gør delen? Eleven læser teksten og
// klikker på delen på figuren (se /byg-motor/funktion.js).
//
// Teksterne må ikke indeholde fagordet selv (selvtesten tjekker det). `alle`
// gælder på alle figurer; en figurs egen tekst vinder, fx når den ydre membran
// gør noget andet på mitokondrien end på kloroplasten. Ord uden tekst (pilene
// på bladet, Celletyperne) er ikke med i opgaven.

export const FUNKTIONER = {
  alle: {
    cellemembran: 'Afgrænser cellen og bestemmer, hvilke stoffer der kommer ind og ud.',
    cytoplasma: 'Den geléagtige væske, organellerne ligger i. Mange af cellens kemiske reaktioner foregår her, fx glykolysen.',
    cellekerne: 'Rummer cellens DNA og styrer cellen ved at bestemme, hvilke gener der bliver aflæst.',
    kernemembran: 'Holder DNA’et adskilt fra resten af cellen. Gennem dens porer kommer mRNA ud.',
    ribosom: 'Oversætter mRNA til protein. Findes i alle celler, også frit i cytoplasmaet.',
    ruER: 'Bygger proteiner, der skal ud af cellen eller sidde i en membran, og sender dem videre til færdigbehandling.',
    glatER: 'Danner lipider, fx til nye membraner, og nedbryder giftstoffer.',
    golgi: 'Færdigbehandler og sorterer proteiner og pakker dem i små membranblærer, der sendes videre.',
    mitokondrie: 'Her foregår respirationen: energien i glukose bliver overført til ATP.',
    vesikel: 'Fragter stoffer rundt i cellen og kan tømme indholdet ud af cellen ved exocytose.',
    cellevaeg: 'Stiv skal uden om membranen. Den giver cellen form og forhindrer, at den sprænges, når vand trænger ind.',
    kloroplast: 'Her foregår fotosyntesen: lysenergi bruges til at bygge glukose af CO₂ og vand.',
    vakuole: 'Lagrer vand og stoffer og holder cellen spændt ud, så planten kan stå oprejst.',
    kromosom: 'Bærer bakteriens vigtigste gener. Det ligger frit i cytoplasmaet, for der er ingen kerne.',
    plasmid: 'En lille ekstra ring af DNA, der kan gives videre til andre bakterier, fx med gener for resistens mod antibiotika.',
    flagel: 'Drejer rundt som en propel, så bakterien kan svømme.',
    pili: 'Korte hår, som bakterien hæfter sig fast med. Nogle bruges til at overføre DNA til en anden bakterie.',
    kapsel: 'Slimet lag yderst, der beskytter mod udtørring og gør det sværere for immunforsvaret at fange bakterien.',
    intermembranrum: 'Det smalle rum, H⁺ bliver pumpet ud i, så koncentrationen af H⁺ bliver høj.',
    cristae: 'Folder, der gør den indre membran stor, så der er plads til mange proteiner til respirationen.',
    matrix: 'Væsken inderst i organellen. Her bliver pyruvat nedbrudt, og her ligger organellens eget DNA.',
    citronsyrecyklus: 'En kreds af reaktioner, hvor resten af glukosen nedbrydes til CO₂, og elektronerne afleveres til NADH og FADH₂.',
    elektrontransportkaede: 'Proteiner, der sender elektroner fra NADH videre til ilt og bruger energien til at pumpe H⁺ ud.',
    atpSyntase: 'Et protein, som H⁺ strømmer tilbage igennem. Strømmen driver dannelsen af ATP.',
    thylakoid: 'En enkelt flad sæk af membran med klorofyl, der opfanger lyset.',
    granum: 'En stak af flade membransække. Stakken giver plads til meget klorofyl på lidt plads.',
    stroma: 'Væsken inden for den indre membran, uden om stakkene af membransække.',
    lysreaktion: 'Her spaltes vand med lysenergi, så der frigives O₂, og der dannes ATP og NADPH.',
    calvin: 'Her bliver CO₂ bundet og bygget om til sukker med energi fra ATP og NADPH.',
    // bladet
    overhud: 'Dækker bladet som et tyndt, tæt cellelag og beskytter mod udtørring.',
    palisadevæv: 'Tætstillede, aflange celler med mange kloroplaster lige under oversiden. Her foregår det meste af fotosyntesen.',
    svampvæv: 'Løst væv med luftfyldte rum, så CO₂ og vanddamp let kan bevæge sig rundt inde i bladet.',
    ledningsstreng: 'Fører vand og mineraler ind i bladet og sukker ud til resten af planten.',
    læbeceller: 'To celler, der åbner og lukker poren i bladets underside ved at ændre deres saftspænding.',
    spalteåbning: 'Poren, som CO₂ kommer ind og vanddamp slipper ud gennem.',
  },
  mitokondrie: {
    ydreMembran: 'Den glatte, yderste hinde. Den lader små molekyler slippe igennem.',
    indreMembran: 'Den tætte hinde, der holder på H⁺, så der kan dannes ATP. Kun transportproteiner lukker stoffer igennem.',
  },
  kloroplast: {
    ydreMembran: 'Den yderste hinde om organellen. Den lader små molekyler slippe igennem.',
    indreMembran: 'Den inderste af de to hinder om organellen. Transportproteiner i den bestemmer, hvad der kommer ind i væsken indenfor.',
  },
};
