// Samlet oversigt over atlassets datagrundlag (ⓘ-knappen ved Hjælp).
// Hver post svarer til en eller flere filer i data/ — de fulde kildeangivelser,
// hentedatoer, SHA-256 og bearbejdning står i de tilhørende *.LICENSE-filer.

export const DATAGRUNDLAG = [
  { gruppe: 'Grundkort', kilder: [
    { navn: 'Lande, kyster og grænser', kilde: 'Natural Earth via world-atlas 2.0.2', omfang: '1:110 mio. på globussen, 1:50 mio. ved zoom, 1:10 mio. i quizzen', licens: 'Public domain (world-atlas: ISC)', url: 'https://www.naturalearthdata.com/' },
    { navn: 'Danmarkskortet', kilde: 'Styrelsen for Dataforsyning og Infrastruktur, DAGI', omfang: 'Kommuner og regioner, 1:500.000 (2014)', licens: 'Frie data med kildeangivelse', url: 'https://dataforsyningen.dk/' },
    { navn: 'Relief', kilde: 'Natural Earth, Cross Blended Hypso with Relief v3.2.0', omfang: 'Skyggekort, ikke et højdegitter', licens: 'Public domain', url: 'https://www.naturalearthdata.com/downloads/10m-raster-data/10m-cross-blend-hypso/' },
    { navn: 'Vegetation og arealdække', kilde: 'NASA MODIS IGBP Land Cover via NASA GIBS', omfang: '2023, satellitklassificering', licens: 'Åbne NASA-data', url: 'https://modis-land.gsfc.nasa.gov/landcover.html' },
  ] },
  { gruppe: 'Geologi', kilder: [
    { navn: 'Pladegrænser, pladenavne og grænsehastigheder', kilde: 'Bird (2003), model PB2002', omfang: 'Geologisk model; hastigheder er modelværdier', licens: 'Open Data Commons Attribution 1.0', url: 'https://doi.org/10.1029/2001GC000252' },
    { navn: 'Havbundens alder', kilde: 'Seton m.fl. (2020), EarthByte aldersgitter 2020', omfang: 'Rekonstruktion, 0,1° gitter', licens: 'Fri med kildeangivelse (artikel CC BY 4.0)', url: 'https://doi.org/10.1029/2020GC009214' },
    { navn: 'Jordskælv', kilde: 'USGS, ANSS Comprehensive Earthquake Catalog (ComCat)', omfang: 'Magnitude ≥ 5, 1976–2025', licens: 'Public domain', url: 'https://earthquake.usgs.gov/data/comcat/' },
    { navn: 'Vulkaner', kilde: 'Smithsonian Global Volcanism Program, Volcanoes of the World 5.4.0 (2026)', omfang: 'Udbrud inden for ca. 11 700 år (holocæn)', licens: 'Uddannelsesbrug med kildeangivelse', url: 'https://volcano.si.edu/' },
  ] },
  { gruppe: 'Klima', kilder: [
    { navn: 'Klimazoner (Köppen og Vahl)', kilde: 'Beck m.fl. (2023); Vahl-klasserne er beregnet til atlasset', omfang: 'Klimanormal 1991–2020, 0,1–0,5°', licens: 'CC BY 4.0', url: 'https://doi.org/10.1038/s41597-023-02549-6' },
    { navn: 'Nedbør måned for måned', kilde: 'GPCP Monthly v2.3, NOAA CDR (Adler m.fl. 2018)', omfang: 'Klimanormal 1991–2020, 2,5° gitter', licens: 'Ingen begrænsninger (NOAA)', url: 'https://doi.org/10.7289/V56971M6' },
    { navn: 'Middeltemperatur måned for måned', kilde: 'NCEP/NCAR Reanalysis 1, NOAA PSL (Kalnay m.fl. 1996)', omfang: 'Luft 2 m over overfladen, 1991–2020; reanalyse', licens: 'Offentlige NOAA-data', url: 'https://psl.noaa.gov/data/gridded/data.ncep.reanalysis.derived.surface.html' },
    { navn: 'Havoverfladetemperatur', kilde: 'NOAA OI SST V2 (Reynolds m.fl. 2002)', omfang: 'Årsmiddel 1991–2020, 1° gitter', licens: 'Offentlige NOAA-data', url: 'https://psl.noaa.gov/data/gridded/data.noaa.oisst.v2.html' },
    { navn: 'Klimadiagrammer for vejrstationer', kilde: 'Deutscher Wetterdienst, CLIMAT-normaler (indberettet til WMO)', omfang: '1991–2020 (ellers 1961–1990)', licens: 'CC BY 4.0', url: 'https://opendata.dwd.de/climate_environment/CDC/observations_global/CLIMAT/multi_annual/' },
    { navn: 'Vind, trykbælter og havstrømme', kilde: 'Redaktionelle skitser efter NOAA’s beskrivelser', omfang: 'Hovedmønstre i januar og juli – ikke måledata', licens: 'Egen tegning', url: 'https://www.noaa.gov/jetstream/tropical/convergence-zone' },
  ] },
  { gruppe: 'Klimaforandringer', kilder: [
    { navn: 'Temperaturændring', kilde: 'NASA GISTEMP v4 (Lenssen m.fl. 2019)', omfang: 'Afvigelse fra 1951–1980 pr. årti 1900–2025, 2° gitter', licens: 'Offentlige NASA-data', url: 'https://data.giss.nasa.gov/gistemp/' },
    { navn: 'Havis', kilde: 'NSIDC Sea Ice Index v4 (G02135)', omfang: 'Udbredelse i marts og september, 1979–2025', licens: 'Fri med kildeangivelse', url: 'https://nsidc.org/data/g02135/versions/4' },
    { navn: 'Havniveau ved vandstandsmålere', kilde: 'Permanent Service for Mean Sea Level (Holgate m.fl. 2013)', omfang: 'Lineær tendens 1960–2024', licens: 'Fri med kildeangivelse', url: 'https://psmsl.org/data/obtaining/' },
    { navn: 'CO₂ og alle drivhusgasser', kilde: 'Global Carbon Budget 2025 og Jones m.fl. (2025) via Our World in Data', omfang: 'Nationale, forbrugsbaserede og samlede udledninger siden 1850', licens: 'CC BY 4.0', url: 'https://github.com/owid/co2-data' },
  ] },
  { gruppe: 'Befolkning, levevilkår og ressourcer', kilder: [
    { navn: 'Befolkning, fødsler og dødsfald', kilde: 'FN, World Population Prospects 2024', omfang: 'Estimater til 2023, derefter fremskrivninger', licens: 'CC BY 3.0 IGO', url: 'https://population.un.org/wpp/' },
    { navn: 'HDI, BNI og skolegang', kilde: 'UNDP, Human Development Report 2025', omfang: '2023', licens: 'CC BY 3.0 IGO', url: 'https://hdr.undp.org/data-center/documentation-and-downloads' },
    { navn: 'Urbanisering og hovedstæder', kilde: 'Verdensbanken, World Development Indicators', omfang: '2023', licens: 'CC BY 4.0', url: 'https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS' },
    { navn: 'Fødevarer og ernæring', kilde: 'FAO (FAOSTAT, fødevarebalancer), UNICEF/WHO/Verdensbanken (JME), via Verdensbanken og Our World in Data', omfang: 'Underernæring, væksthæmning, kornudbytte, kalorier og afgrøder, 2022–2024', licens: 'CC BY 4.0', url: 'https://www.fao.org/faostat/' },
    { navn: 'Energimiks og elproduktion', kilde: 'Our World in Data (Energy Institute, Ember) og Ember', omfang: '2023', licens: 'CC BY 4.0', url: 'https://github.com/owid/energy-data' },
    { navn: 'Vandstress', kilde: 'FAO AQUASTAT via Verdensbanken (SDG 6.4.2)', omfang: '2022', licens: 'CC BY 4.0', url: 'https://data.worldbank.org/indicator/ER.H2O.FWST.ZS' },
    { navn: 'Solindstråling og vindpotentiale', kilde: 'NASA POWER (CERES og MERRA-2)', omfang: 'Årsnormal 2001–2020, 1° celler', licens: 'Fri med kildeangivelse', url: 'https://power.larc.nasa.gov/' },
  ] },
  { gruppe: 'Island-modellen', kilder: [
    { navn: 'Terræn og havbund', kilde: 'NOAA NCEI, ETOPO 2022', omfang: '15″ globalt reliefgitter, jøklernes overflade', licens: 'Fri brug og videregivelse', url: 'https://doi.org/10.25921/fd45-gt74' },
    { navn: 'Vulkansystemer og sprækkesværme', kilde: 'Náttúrufræðistofnun, geologisk kort 1:600.000', omfang: 'Centralvulkaner, kalderaer og sprækkesværme', licens: 'CC BY 4.0', url: 'https://www.natt.is/is/midlun/opin-gogn' },
  ] },
];

export function visDatagrundlag(indhold) {
  const el = (tag, tekst, klasse) => {
    const e = document.createElement(tag);
    if (tekst) e.textContent = tekst;
    if (klasse) e.className = klasse;
    return e;
  };
  indhold.append(el('p', 'Atlasset bygger på åbne data fra forskningsinstitutioner og internationale organisationer. Alle data ligger lokalt på smbi.dk, så intet hentes udefra, mens du bruger atlasset. Skeln mellem målinger, modeller/reanalyser, rekonstruktioner og redaktionelle skitser – det står ved hvert lag under «Undersøg og kilde».'));
  for (const { gruppe, kilder } of DATAGRUNDLAG) {
    const sektion = el('section', '', 'datagrundlag');
    sektion.append(el('h3', gruppe));
    const liste = el('ul');
    for (const k of kilder) {
      const li = el('li');
      li.append(el('strong', k.navn), ` – ${k.kilde}. ${k.omfang}.`);
      const fod = el('span', `Licens: ${k.licens} · `, 'datagrundlag-licens');
      const a = el('a', 'kilde →');
      a.href = k.url;
      a.setAttribute('aria-label', `Kilde: ${k.kilde}`);
      fod.append(a);
      li.append(fod);
      liste.append(li);
    }
    sektion.append(liste);
    indhold.append(sektion);
  }
  indhold.append(el('p', 'Fulde kildeangivelser, hentedatoer, kontrolsummer og bearbejdning står i atlassets datamappe (filerne *.LICENSE).'));
}
