#!/usr/bin/env python3
"""Dan primaerenergi.json fra OWID Energy Data (CC BY 4.0).
Kør: python3 atlas/data/primaerenergi.py owid-energy-data.csv
Kilde: https://github.com/owid/energy-data
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

HER = Path(__file__).parent
FELTER = {k: f'{k}_consumption' for k in
          ('coal', 'oil', 'gas', 'nuclear', 'renewables', 'hydro', 'wind', 'solar', 'biofuel')}
FELTER.update(total='primary_energy_consumption', fossil='fossil_fuel_consumption')


def main(sti):
    demografi = json.loads((HER / 'demografi.json').read_text())['lande']
    id_for = {land['iso3']: id for id, land in demografi.items() if land.get('iso3')}
    lande = {}
    with sti.open(encoding='utf-8-sig', newline='') as fil:
        for r in csv.DictReader(fil):
            id = id_for.get(r['iso_code'])
            if not id or r['year'] < '2000' or not r['primary_energy_consumption']:
                continue
            tal = {k: float(r[kolonne]) for k, kolonne in FELTER.items() if r[kolonne]}
            lande.setdefault(id, {})[r['year']] = tal
    assert lande['208']['2023']['total'] > lande['208']['2023']['oil'] > 0
    assert lande['156']['2023']['coal'] > lande['156']['2023']['oil']
    (HER / 'primaerenergi.json').write_text(json.dumps({
        'sha256': hashlib.sha256(sti.read_bytes()).hexdigest(), 'lande': lande
    }, separators=(',', ':'), sort_keys=True) + '\n')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
