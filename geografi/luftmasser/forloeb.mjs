// Hvert trin varer syv sekunder. Forløbene er kvalitative, ikke vejrudsigter.
export const TRINSEKUNDER = 7;
export const FORLOEB = {
  stabil: {
    navn: 'Stabil luft', etiketter: ['Jorden varmes', 'Luften stiger', 'Små skyer', 'Opstigning bremses'],
    trin: [
      ['Solen varmer jorden', 'Over den varme jord dannes små bobler af opvarmet luft.'],
      ['Varm luft stiger', 'Luftboblerne stiger og afkøles. Højere oppe møder de et stabilt luftlag.'],
      ['Små skyer dannes', 'Vanddamp kondenserer til skydråber. Luftboblerne mister deres opdrift i den stabile luft.'],
      ['Skyerne vokser ikke videre', 'Opstigningen bremses, og luften breder sig ud. I dette eksempel bliver skyerne små.']
    ]
  },
  ustabil: {
    navn: 'Ustabil, fugtig luft', etiketter: ['Jorden varmes', 'Kraftig opstigning', 'Skyen vokser', 'Tordenbyge'],
    trin: [
      ['Varm og fugtig luft', 'Solen varmer jorden. Der er rigeligt med fugt til skyer.'],
      ['Luften fortsætter op', 'Den opstigende luft er varmere end omgivelserne. Den får opdrift og stiger videre.'],
      ['En høj bygesky', 'Vanddamp kondenserer. Den frigivne energi hjælper den fugtige luft med at fortsætte opstigningen.'],
      ['Fra bygesky til torden', 'Skyen er vokset højt nok til en tordenbyge. Regn og kold luft falder ned ved siden af opstigningen.']
    ]
  },
  betinget: {
    navn: 'Betinget stabil luft', etiketter: ['Lille opstigning', 'Luften bremses', 'Ekstra løft', 'Skyen vokser videre'],
    trin: [
      ['Et lille løft er ikke nok', 'Umættet luft afkøles hurtigt, når den stiger. Den mister opdrift og søger ned igen.'],
      ['Små skyer, men ingen byge', 'Der kan dannes sky, mens luften stadig er koldere end omgivelserne. Skyen vokser ikke frit endnu.'],
      ['Vindene mødes', 'Luft strømmer sammen ved jorden og tvinges op. Det giver løft nok til at udløse ustabiliteten.'],
      ['Nu kan skyen vokse', 'Efter tilstrækkeligt løft er den mættede luft varmere end omgivelserne. I dette fugtige eksempel udvikles en tordenbyge.']
    ]
  },
  inversion: {
    navn: 'Inversion', etiketter: ['Kold jord', 'Kold luft nederst', 'Varm luft ovenover', 'Dis bliver liggende'],
    trin: [
      ['Jorden køles af', 'Efter en klar nat er jorden kold. Den afkøler luften lige over sig.'],
      ['Kold luft samles nederst', 'Den kolde luft bliver liggende nær jorden i dalen.'],
      ['Temperaturen stiger opad', 'Luften ovenover er varmere. En løftet luftboble er koldere end omgivelserne og søger ned igen.'],
      ['Luften blandes kun lidt', 'Inversionen hæmmer lodret blanding. Fugt og partikler kan ophobes som dis nær jorden.']
    ]
  }
};
export const klem = x => Math.max(0, Math.min(1, x));
const glat = x => { const v = klem(x); return v * v * (3 - 2 * v); };
export function vejrtilstand(profil, tid) {
  const fase = Math.min(4, Math.max(0, tid / TRINSEKUNDER));
  const inversion = profil === 'inversion';
  return {
    trin: Math.min(3, Math.floor(fase)),
    varme: inversion ? 0 : glat(fase * 1.5 + .2),
    loeft: inversion ? 0 : glat(fase - .2),
    skyer: inversion ? 0 : glat(fase - .8),
    taarn: profil === 'ustabil' ? glat((fase - 1.4) / 1.5) : profil === 'betinget' ? glat((fase - 2.25) / 1.05) : 0,
    regn: profil === 'ustabil' ? glat((fase - 2.85) / .7) : profil === 'betinget' ? glat((fase - 3.3) / .7) : 0,
    ekstra: profil === 'betinget' ? glat(fase - 1.8) : 0,
    dis: inversion ? glat(fase / 2.8) : 0,
    inversion: inversion ? glat(fase - .8) : 0
  };
}
