// Registeret er atlassets eneste kilde til steder, processer og modelkort.
// Koordinater følger GeoJSON: [længdegrad, breddegrad] i grader.
export const steder = [
  {
    id: 'island', navn: 'Island', koordinater: [-19, 64.9],
    forklaring: 'Island ligger på den Midtatlantiske Ryg, hvor pladerne bevæger sig fra hinanden. Et hotspot bidrager også til vulkanismen.',
    forbehold: 'Et fagligt eksempel på pladetektonik og vulkanisme. Modellerne er generelle og gengiver ikke en bestemt islandsk vulkan.'
  },
  {
    id: 'nordatlanten', navn: 'Grønland / Nordatlanten', kortnavn: 'Nordatlanten', koordinater: [-37, 58],
    forklaring: 'I Nordatlanten kan afkøling og høj saltholdighed gøre havvand tungere og bidrage til dannelsen af dybvand.',
    forbehold: 'Markøren angiver en region syd for Grønland, ikke et enkelt nedsynkningspunkt. Grønlandspumpen er en idealiseret model af dele af havcirkulationen.'
  },
  {
    id: 'alperne', navn: 'Alperne', koordinater: [10, 46.5],
    forklaring: 'Når fugtig luft tvinges op over en bjergkæde, afkøles den. Vanddamp kan kondensere og give nedbør; på læsiden kan luften blive varm og tør.',
    forbehold: 'Alperne er et eksempel på stigningsregn og føhn. Modellen bruger et skematisk bjerg og beregner ikke det aktuelle vejr i Alperne.'
  }
];

export const modeller = [
  { id: 'pladegraenser', titel: 'Pladegrænser', emne: 'Pladetektonik', niveau: 'Naturgeografi C / B', steder: ['island'],
    beskrivelse: 'Undersøg spredning, subduktion og bevaring ved forskellige pladegrænser.',
    sti: '/geografi/pladegraenser.html', soegeord: 'tektonik kontinenter jordskælv ryg' },
  { id: 'vulkanudbrud', titel: 'Vulkanudbrud', emne: 'Vulkanisme', niveau: 'Naturgeografi C / B', steder: ['island'],
    beskrivelse: 'Følg magmaets vej op, og undersøg sammenhængen mellem magma, gas og udbrudstype.',
    sti: '/geografi/vulkanudbrud.html', soegeord: 'lava hotspot basalt magma' },
  { id: 'groenlandspumpen', titel: 'Grønlandspumpen', emne: 'Havcirkulation', niveau: 'NV / Naturgeografi C / B', steder: ['nordatlanten'],
    beskrivelse: 'Skru på kulde og smeltevand, og undersøg hvordan havcirkulationen reagerer i en kvalitativ model.',
    sti: '/geografi/groenlandspumpen.html', soegeord: 'grønland hav salt temperatur dybvand termohalin amoc' },
  { id: 'stigningsregn', titel: 'Stigningsregn & føhn', emne: 'Vejr og klima', niveau: 'Naturgeografi C / B', steder: ['alperne'],
    beskrivelse: 'Løft en luftpakke over et bjerg, og følg temperatur, kondensation og nedbør.',
    sti: '/geografi/Stigningsregn.html', soegeord: 'bjerg regn føhn foehn fugt alper' },
  { id: 'drivhus-enkel', titel: 'Drivhuseffekten — forenklet', emne: 'Global atmosfære', niveau: 'NV / Naturgeografi C', steder: [],
    beskrivelse: 'Følg sollys og varmestråling trin for trin, og undersøg atmosfærens betydning for Jordens energibalance.',
    sti: '/geografi/drivhuseffektenSimpel.html', soegeord: 'global klima co2 kuldioxid stråling drivhusgas energi' },
  { id: 'drivhus-udvidet', titel: 'Drivhuseffekten — udvidet', emne: 'Global atmosfære', niveau: 'Naturgeografi C / B', steder: [],
    beskrivelse: 'Undersøg energibalancen med tal, albedo og tilbagekoblinger i en idealiseret global model.',
    sti: '/geografi/drivhuseffekten.html', soegeord: 'global klima co2 kuldioxid albedo feedback stråling energi' }
];
