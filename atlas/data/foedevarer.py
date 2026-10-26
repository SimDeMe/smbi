#!/usr/bin/env python3
"""Danner foedevarer.json til atlassets temakort og landemenuens Fødevarer-fane.

Kilder (se foedevarer.LICENSE):
- Underernæring: FAO, Prevalence of undernourishment, via Verdensbanken
  (SN.ITK.DEFC.ZS). FAO angiver værdier under 2,5 % som 2,5.
- Væksthæmning: UNICEF/WHO/Verdensbanken, Joint Child Malnutrition Estimates,
  modelestimat for børn under 5 år, via Verdensbanken (SH.STA.STNT.ME.ZS).
- Kornudbytte og kornareal: FAO (FAOSTAT QCL) via Verdensbanken
  (AG.YLD.CREL.KG og AG.LND.CREL.HA).
- Kalorieforsyning: FAO, Food Balances (FBS og FBSH), via Our World in Data
  (daily-per-capita-caloric-supply).
- Største afgrøder: FAOSTAT, Crops and livestock products (QCL), bulkfilen med
  høstet areal og produktion for hver primærafgrøde.

Brug:
  python3 -I atlas/data/foedevarer.py [--cache mappe]

Rådata gemmes i cachen (standard: raa-foedevarer/ ved siden af scriptet, ikke i
git); slet den for at hente på ny. SHA-256 for hver rådatafil skrives i
foedevarer.json, så det kan ses, hvilken udgave tallene bygger på.

Indhold pr. land (nøgle = FN-landekoden fra demografi.json):
- u:  underernæring i % af befolkningen, [værdi, år], seneste år 2022–2024
- us: underernæring 2001–2024 (liste, null hvor tal mangler)
- k:  kalorieforsyning i kcal pr. person pr. døgn, [værdi, år], seneste år 2021–2023
- ks: kalorieforsyning 1961–2023 (liste)
- v:  væksthæmmede børn under 5 år i %, [værdi, år], seneste år 2022–2024
- c:  kornudbytte i t pr. ha, gennemsnit af 2022–2024 (mindst to år med tal)
- cl: true, hvis kornarealet i gennemsnit er under 10.000 ha. Så udelades c:
      udbyttet fra få marker (ofte vandet eller i drivhus, fx Oman 31 t/ha)
      kan ikke sammenlignes med landbrugslande.
- a:  de største afgrøder efter høstet areal, gennemsnit af 2022–2024, som
      [FAO-varekode, høstet areal i ha, produktion i t]. Op til AFGROEDER stk.
- at: samlet høstet areal for alle primærafgrøder i ha (til andelene).
Navnene på afgrøderne står i «afgroeder» (FAO-varekode → dansk navn).
Rækken «verden» har verdensgennemsnittet til sammenligning.
"""
import argparse, csv, hashlib, io, json, urllib.request, zipfile
from pathlib import Path

HER = Path(__file__).parent
WB = 'https://api.worldbank.org/v2/country/all/indicator/{}?format=json&per_page=20000&date=2001:2024'
OWID = 'https://ourworldindata.org/grapher/daily-per-capita-caloric-supply.csv?v=1&csvType=full&useColumnShortNames=true'
QCL = 'https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip'
UAAR = list(range(2001, 2025))
KAAR = list(range(1961, 2024))
KILDER = {}
AFGROEDER = 6
AFGROEDEAAR = ('2022', '2023', '2024')

# Danske navne på FAO's primærafgrøder (varekoder i QCL). Kun de afgrøder, der
# kommer i top i et land, skal stå her; scriptet stopper, hvis et navn mangler.
NAVNE = {
    15: 'Hvede', 27: 'Ris', 44: 'Byg', 56: 'Majs', 71: 'Rug', 75: 'Havre', 79: 'Hirse',
    83: 'Sorghum', 89: 'Boghvede', 92: 'Quinoa', 94: 'Fonio', 97: 'Triticale',
    103: 'Blandsæd', 108: 'Andet korn', 116: 'Kartofler', 122: 'Søde kartofler',
    125: 'Kassava', 135: 'Yautia', 136: 'Taro', 137: 'Yams',
    149: 'Andre rod- og knoldfrugter', 156: 'Sukkerrør', 157: 'Sukkerroer',
    176: 'Bønner (tørrede)', 181: 'Hestebønner (tørrede)', 187: 'Ærter (tørrede)',
    191: 'Kikærter', 195: 'Vignabønner', 197: 'Dueærter', 201: 'Linser',
    203: 'Bambarabønner', 205: 'Vikke', 210: 'Lupiner', 211: 'Andre bælgfrugter',
    217: 'Cashewnødder', 220: 'Kastanjer', 221: 'Mandler', 222: 'Valnødder',
    223: 'Pistacienødder', 225: 'Hasselnødder', 226: 'Betelnødder',
    234: 'Andre nødder', 236: 'Sojabønner', 242: 'Jordnødder', 249: 'Kokosnødder',
    254: 'Oliepalme', 260: 'Oliven', 263: 'Sheanødder', 265: 'Ricinusfrø',
    267: 'Solsikkefrø', 270: 'Raps', 280: 'Saflor', 289: 'Sesam', 292: 'Sennepsfrø',
    299: 'Melonfrø', 328: 'Bomuld', 333: 'Hørfrø', 339: 'Andre oliefrø',
    358: 'Kål', 372: 'Salat', 373: 'Spinat', 388: 'Tomater', 393: 'Blomkål og broccoli',
    394: 'Græskar', 397: 'Agurker', 399: 'Auberginer', 401: 'Peberfrugt og chili',
    402: 'Forårsløg', 403: 'Løg', 417: 'Grønne ærter', 420: 'Grønne hestebønner',
    423: 'Grønne bønner', 426: 'Gulerødder og majroer', 446: 'Sukkermajs',
    461: 'Johannesbrød', 463: 'Andre grøntsager', 486: 'Bananer',
    489: 'Melbananer', 490: 'Appelsiner', 495: 'Mandariner',
    497: 'Citroner og limefrugter', 507: 'Pomelo og grapefrugt', 515: 'Æbler',
    521: 'Pærer', 526: 'Abrikoser', 531: 'Kirsebær', 534: 'Ferskner', 536: 'Blommer',
    544: 'Jordbær', 560: 'Vindruer', 567: 'Vandmeloner', 568: 'Meloner', 569: 'Figner',
    571: 'Mango og guava', 572: 'Avocado', 574: 'Ananas', 577: 'Dadler',
    592: 'Kiwi', 600: 'Papaya', 603: 'Andre tropiske frugter', 619: 'Andre frugter',
    656: 'Kaffe', 661: 'Kakao', 667: 'Te', 671: 'Maté', 677: 'Humle',
    687: 'Peber', 689: 'Chili (tørret)', 698: 'Nelliker', 702: 'Muskat og kardemomme',
    711: 'Anis, koriander og kommen', 720: 'Ingefær', 723: 'Andre krydderier',
    771: 'Hør', 780: 'Jute', 789: 'Sisal', 809: 'Abaca', 821: 'Andre fiberplanter',
    826: 'Tobak', 836: 'Naturgummi',
    1080: 'Teff og andet korn',
}
# I Etiopien og Eritrea er FAO's «Cereals n.e.c.» (108) for langt størstedelen
# teff; det får sin egen kode 1080, så navnet kan sige det.
TEFF = {'231', '232'}


def hent(cache, navn, url):
    sti = cache / navn
    if not sti.exists():
        anmodning = urllib.request.Request(url, headers={'User-Agent': 'smbi.dk atlas'})
        with urllib.request.urlopen(anmodning, timeout=120) as svar:
            sti.write_bytes(svar.read())
    KILDER[navn] = {'url': url, 'sha256': hashlib.sha256(sti.read_bytes()).hexdigest()}
    return sti


def verdensbanken(cache, kode):
    """{iso3: {år: værdi}} for en indikator."""
    raekker = json.loads(hent(cache, f'{kode}.json', WB.format(kode)).read_text())[1]
    ud = {}
    for r in raekker:
        if r['value'] is not None:
            ud.setdefault(r['countryiso3code'], {})[int(r['date'])] = r['value']
    return ud


def seneste(serie, fra, til, d=1):
    for aar in range(til, fra - 1, -1):
        if serie.get(aar) is not None:
            return [round(serie[aar], d), aar]
    return None


def afgroeder(cache, id_for_m49):
    """{id: (top-liste, samlet areal)} efter høstet areal, gennemsnit af AFGROEDEAAR."""
    areal, prod = {}, {}
    with zipfile.ZipFile(hent(cache, 'qcl.zip', QCL)) as z:
        navn = next(n for n in z.namelist() if n.endswith('(Normalized).csv'))
        with io.TextIOWrapper(z.open(navn), encoding='latin-1', newline='') as f:
            for r in csv.DictReader(f):
                if r['Year'] not in AFGROEDEAAR or not r['Value']:
                    continue
                id = id_for_m49.get(r['Area Code (M49)'].lstrip("'"))
                kode = int(r['Item Code'])
                # Koder fra 1700 er summer (fx «Cereals, primary»), ikke afgrøder.
                if id is None or kode >= 1700:
                    continue
                maal = {'5312': areal, '5510': prod}.get(r['Element Code'])
                if maal is not None:
                    maal.setdefault(id, {}).setdefault(kode, []).append(float(r['Value']))
    gns = lambda v: sum(v) / len(v)
    ud = {}
    for id, afg in areal.items():
        afg = {k: gns(v) for k, v in afg.items() if gns(v) > 0}
        if not afg:
            continue
        top = sorted(afg, key=afg.get, reverse=True)[:AFGROEDER]
        mangler = [k for k in top if k not in NAVNE]
        assert not mangler, f'Mangler dansk navn for FAO-varekode {mangler}'
        p = prod.get(id, {})
        kode = lambda k: 1080 if k == 108 and id in TEFF else k
        ud[id] = ([[kode(k), round(afg[k]), round(gns(p[k])) if k in p else None] for k in top],
                  round(sum(afg.values())))
    return ud


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, default=HER / 'raa-foedevarer')
    cache = parser.parse_args().cache
    cache.mkdir(parents=True, exist_ok=True)

    demo = json.loads((HER / 'demografi.json').read_text())['lande']
    id_for = {l['iso3']: id for id, l in demo.items() if l.get('iso3')}
    id_for['WLD'] = id_for['OWID_WRL'] = 'verden'

    under = verdensbanken(cache, 'SN.ITK.DEFC.ZS')
    vaekst = verdensbanken(cache, 'SH.STA.STNT.ME.ZS')
    korn = verdensbanken(cache, 'AG.YLD.CREL.KG')
    kornareal = verdensbanken(cache, 'AG.LND.CREL.HA')
    kcal = {}
    with hent(cache, 'kalorier.csv', OWID).open(newline='') as f:
        for r in csv.DictReader(f):
            if r['daily_calories']:
                kcal.setdefault(r['code'], {})[int(r['year'])] = float(r['daily_calories'])

    m49 = {id: id for id in demo}
    m49['001'] = 'verden'
    afg = afgroeder(cache, m49)

    lande = {}
    for id, (top, samlet) in afg.items():
        lande[id] = {'a': top, 'at': samlet}
    for iso3, id in id_for.items():
        land = {}
        if iso3 in under:
            land['u'] = seneste(under[iso3], 2022, 2024)
            land['us'] = [under[iso3].get(a) for a in UAAR]
        if iso3 in kcal and (k := seneste(kcal[iso3], 2021, 2023, 0)):
            land['k'] = [int(k[0]), k[1]]
            land['ks'] = [None if kcal[iso3].get(a) is None else round(kcal[iso3][a]) for a in KAAR]
        if iso3 in vaekst:
            land['v'] = seneste(vaekst[iso3], 2022, 2024)
        aar = [korn.get(iso3, {}).get(a) for a in (2022, 2023, 2024)]
        aar = [v for v in aar if v is not None]
        areal = [kornareal.get(iso3, {}).get(a) for a in (2022, 2023, 2024)]
        areal = [v for v in areal if v is not None]
        if len(aar) >= 2:
            if areal and sum(areal) / len(areal) < 10000:
                land['cl'] = True
            else:
                land['c'] = round(sum(aar) / len(aar) / 1000, 2)
        land = {k: v for k, v in land.items() if v is not None}
        if land:
            lande.setdefault(id, {}).update(land)

    # Stikprøver mod tal, der er slået op i kilderne.
    assert lande['208']['u'] == [2.5, 2024] and 3600 < lande['208']['k'][0] < 3900
    assert lande['706']['u'][0] > 40 and lande['231']['v'][0] > 30
    assert 5 < lande['208']['c'] < 8 and lande['verden']['k'][0] > 2800
    assert lande['512'].get('cl') and 'c' not in lande['512']  # Oman
    assert {a[0] for a in lande['208']['a'][:2]} == {15, 44}  # Danmark: hvede, byg
    assert lande['076']['a'][0][0] == 236 and lande['356']['a'][0][0] in (15, 27)  # Brasilien soja; Indien hvede/ris

    brugt = sorted({a[0] for l in lande.values() for a in l.get('a', [])})
    ud = {'uaar': UAAR, 'kaar': KAAR, 'afgroedeaar': [int(a) for a in AFGROEDEAAR],
          'afgroeder': {str(k): NAVNE[k] for k in brugt}, 'kilder': KILDER, 'lande': lande}
    (HER / 'foedevarer.json').write_text(json.dumps(ud, ensure_ascii=False, separators=(',', ':')) + '\n')
    for felt, navn in [('u', 'underernæring'), ('k', 'kalorier'), ('v', 'væksthæmning'), ('c', 'kornudbytte')]:
        print(navn, sum(felt in l for i, l in lande.items() if i != 'verden'), 'lande')
    print('afgrøder', sum('a' in l for i, l in lande.items() if i != 'verden'), 'lande')
    print('lille kornareal', sum('cl' in l for l in lande.values()), 'lande')


if __name__ == '__main__':
    main()
