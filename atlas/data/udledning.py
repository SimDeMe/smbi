#!/usr/bin/env python3
"""Danner udledning.json til atlassets lag under «Klimaforandringer».

Kilde: Global Carbon Budget 2025 (Global Carbon Project) i Our World in
Data's samlede CO2-datasæt, owid-co2-data.csv fra
https://github.com/owid/co2-data (CC BY 4.0). Uden argument hentes filen
til raa-owid/ ved siden af scriptet (ikke i git).

Brug:
  python -I atlas/data/udledning.py [owid-co2-data.csv]

Indhold pr. land og år (1990, 2000, 2010, 2023):
- n:  national (territorial) CO2-udledning i mio. t (Mt), kolonnen «co2»
- f:  forbrugsbaseret CO2-udledning i Mt, «consumption_co2»
- nc: national udledning i t pr. indbygger, «co2_per_capita»
- fc: forbrugsbaseret udledning i t pr. indbygger, «consumption_co2_per_capita»
- g:  alle drivhusgasser (CO2, metan, lattergas) inkl. arealanvendelse i mio. t
      CO2-ækvivalenter (GWP100), «total_ghg» (Jones m.fl. 2025)
- gc: samme pr. indbygger, «ghg_per_capita»
- gu: alle drivhusgasser uden arealanvendelse, «total_ghg_excluding_lucf»

Samlet udledning siden 1850 («kumuleret», til cirkellaget), summeret her af
de årlige tal fra og med 1850 til og med årene 1900, 1950, 1990 og 2023:
- k:  CO2 fra fossile brændsler og industri, «co2»
- kl: CO2 inkl. arealanvendelse (skovrydning m.m.), «co2_including_luc»
Manglende år tæller som 0 (små lande har ingen tal i de tidligste år).
Verdens samlede udledning (rækken «World») gemmes til andele.

n, f, nc og fc er kun CO2 fra fossile brændsler og industri (cement,
afbrænding af gas m.m.), fordi det er det eneste, der findes forbrugsbaseret.
2023 er det seneste år med forbrugsbaserede tal; de andre tal tages fra
samme år, så kortene kan sammenlignes.
Landene kobles til globussen med ISO 3166-alfa-3-koden i demografi.json;
OWID's egne regioner og aggregater (OWID_…) springes over.
"""
import csv, hashlib, json, sys, urllib.request
from pathlib import Path

HER = Path(__file__).parent
URL = 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv'
AAR = [1990, 2000, 2010, 2023]
FELTER = {'n': ('co2', 2), 'f': ('consumption_co2', 2),
          'nc': ('co2_per_capita', 2), 'fc': ('consumption_co2_per_capita', 2),
          'g': ('total_ghg', 2), 'gc': ('ghg_per_capita', 2), 'gu': ('total_ghg_excluding_lucf', 2)}
KUM_AAR = [1900, 1950, 1990, 2023]
KUM = {'k': 'co2', 'kl': 'co2_including_luc'}
KUM_FRA = 1850


def hent():
    sti = HER / 'raa-owid' / 'owid-co2-data.csv'
    if not sti.exists():
        sti.parent.mkdir(exist_ok=True)
        urllib.request.urlretrieve(URL, sti)
    return sti


def main():
    sti = Path(sys.argv[1]) if len(sys.argv) > 1 else hent()
    demografi = json.loads((HER / 'demografi.json').read_text())
    id_for = {land['iso3']: id for id, land in demografi['lande'].items() if land.get('iso3')}
    lande = {}
    sum_ = {}      # løbende summer pr. land (og 'verden') og felt
    kum = {}
    with open(sti, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            aar = int(r['year'])
            id = 'verden' if r['country'] == 'World' else id_for.get(r['iso_code'])
            if id and KUM_FRA <= aar <= KUM_AAR[-1]:
                # Filen er sorteret efter land og år, så summen kan løbe med.
                s_ = sum_.setdefault(id, {k: 0.0 for k in KUM})
                for k, kolonne in KUM.items():
                    s_[k] += float(r[kolonne] or 0)
                if aar in KUM_AAR:
                    k_ = kum.setdefault(id, {k: [None] * len(KUM_AAR) for k in KUM})
                    for k in KUM:
                        k_[k][KUM_AAR.index(aar)] = round(s_[k], 1)
            if not id or id == 'verden' or aar not in AAR:
                continue
            land = lande.setdefault(id, {'navn': demografi['lande'][id]['navn'],
                                         **{k: [None] * len(AAR) for k in FELTER}})
            i = AAR.index(int(r['year']))
            for k, (kolonne, d) in FELTER.items():
                if r[kolonne]:
                    land[k][i] = round(float(r[kolonne]), d)
    # Lande helt uden tal udelades; de bliver grå («ingen data») på kortet.
    lande = {id: l for id, l in sorted(lande.items()) if any(v is not None for k in FELTER for v in l[k])}
    verden = kum.pop('verden')
    kum = {id: k for id, k in sorted(kum.items()) if id in lande and any(k['k'])}
    ud = {'kilde': 'Global Carbon Budget 2025 og Jones m.fl. 2025 via Our World in Data (CC BY 4.0)',
          'sha256': hashlib.sha256(sti.read_bytes()).hexdigest(), 'aar': AAR, 'lande': lande,
          'kumuleret': {'fra': KUM_FRA, 'aar': KUM_AAR, 'verden': verden, 'lande': kum}}
    (HER / 'udledning.json').write_text(json.dumps(ud, ensure_ascii=False, separators=(',', ':')))
    for k in FELTER:
        print(k, [sum(l[k][i] is not None for l in lande.values()) for i in range(len(AAR))])
    print('kumuleret', len(kum), 'lande; verden', verden, 'Danmark', kum['208'])


if __name__ == '__main__':
    main()
