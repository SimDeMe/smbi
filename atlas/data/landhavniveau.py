#!/usr/bin/env python3
"""Knyt atlasets PSMSL-stationer til lande via PSMSL's stationsliste.
Kør: python3 atlas/data/landhavniveau.py stationsliste.html
Stationsliste: https://psmsl.org/data/obtaining/
"""
import json
import re
import sys
from pathlib import Path

HER = Path(__file__).parent


def main(sti):
    demo = json.loads((HER / 'demografi.json').read_text())['lande']
    id_for = {land['iso3']: id for id, land in demo.items() if land.get('iso3')}
    stationsliste = {}
    for raekke in re.findall(r'<tr\b[^>]*>(.*?)</tr>', sti.read_text(), re.S):
        station = re.search(r'stations/(\d+)\.php', raekke)
        iso = re.search(r'<abbr\b[^>]*>([A-Z]{3})</abbr>', raekke)
        if station and iso:
            stationsliste[int(station[1])] = iso[1]
    data = json.loads((HER / 'havniveau.json').read_text())
    lande = {}
    for station in data['stationer']:
        id = id_for.get(stationsliste.get(station['id']))
        if id:
            lande.setdefault(id, []).append({k: station[k] for k in ('id', 'navn', 'mm', 'fra', 'til')})
    assert len(stationsliste) > 1000 and lande['208'] and lande['840']
    for stationer in lande.values():
        stationer.sort(key=lambda s: s['navn'])
    (HER / 'landhavniveau.json').write_text(json.dumps({'lande': lande}, ensure_ascii=False, separators=(',', ':'), sort_keys=True) + '\n')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
