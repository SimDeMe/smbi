#!/usr/bin/env python3
"""Dan elproduktion.json fra Ember Yearly Electricity Data (CC BY 4.0).
Kør: python3 atlas/data/elproduktion.py release_generation_yearly_global.csv
Kilde: https://ember-energy.org/data/yearly-electricity-data/
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

HER = Path(__file__).parent
FELTER = {'Coal': 'coal', 'Gas': 'gas', 'Other fossil': 'other_fossil',
          'Nuclear': 'nuclear', 'Hydro': 'hydro', 'Wind': 'wind', 'Solar': 'solar',
          'Bioenergy': 'biofuel', 'Other renewables': 'other_renewables',
          'Fossil': 'fossil', 'Total generation': 'total'}


def main(sti):
    demografi = json.loads((HER / 'demografi.json').read_text())['lande']
    id_for = {land['iso3']: id for id, land in demografi.items() if land.get('iso3')}
    lande = {}
    with sti.open(encoding='utf-8-sig', newline='') as fil:
        for r in csv.DictReader(fil):
            id = id_for.get(r['ISO 3 code'])
            felt = FELTER.get(r['Electricity source'])
            if not id or not felt or r['Year'] < '2000' or not r['Generation (TWh)']:
                continue
            aar = lande.setdefault(id, {}).setdefault(r['Year'], {})
            assert felt not in aar, (id, r['Year'], felt)
            aar[felt] = float(r['Generation (TWh)'])
    assert lande['208']['2023']['wind'] > 15 and lande['156']['2023']['coal'] > 4000
    (HER / 'elproduktion.json').write_text(json.dumps({
        'kilde': 'Ember Yearly Electricity Data',
        'sha256': hashlib.sha256(sti.read_bytes()).hexdigest(),
        'lande': lande
    }, separators=(',', ':'), sort_keys=True) + '\n')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
