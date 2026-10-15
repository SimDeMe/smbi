#!/usr/bin/env python3
"""Danner jordskaelv.json fra USGS' ComCat-katalog (public domain).

Udtræk: alle hændelser af typen »earthquake« med M ≥ 5,0 fra 1. januar 1976
til 1. januar 2026 (UTC). 1976 er det år, hvor Global CMT-kataloget begynder,
og dybderne for store skælv bliver mere ensartede.

Brug:  python3 -I atlas/data/jordskaelv.py [mappe-med-csv]

Uden mappe hentes CSV'erne fra USGS' FDSN-tjeneste i femårsbidder (tjenesten
returnerer højst 20 000 hændelser pr. kald) og gemmes i mappen raa-usgs/
ved siden af scriptet, som ikke er med i git.

Bearbejdning: koordinater afrundes til 0,1° (ca. 10 km), dybden til hele km
(negative dybder over havniveau sættes til 0), magnituden til 0,1. Hver
hændelse gemmes som fem heltal i én flad liste, sorteret efter magnitude,
så de største skælv tegnes øverst:
  [lon·10, lat·10, dybde_km, (M − 5)·10, år − 1976, ...]
"""
import csv, hashlib, json, sys, urllib.request
from pathlib import Path

START, SLUT = 1976, 2026
ADRESSE = ('https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv&orderby=time-asc'
           '&eventtype=earthquake&minmagnitude=5&starttime={}-01-01&endtime={}-01-01')


def bidder():
    for aar in range(START, SLUT, 5):
        yield aar, min(aar + 5, SLUT)


def hent(mappe):
    mappe.mkdir(exist_ok=True)
    for fra, til in bidder():
        fil = mappe / f'usgs-{fra}-{til}.csv'
        if not fil.exists():
            with urllib.request.urlopen(ADRESSE.format(fra, til), timeout=300) as svar:
                fil.write_bytes(svar.read())
        yield fil


def main():
    mappe = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name('raa-usgs')
    filer = list(hent(mappe))
    skaelv, set_id = [], set()
    for fil in filer:
        with fil.open(newline='') as f:
            for r in csv.DictReader(f):
                if r['type'] != 'earthquake' or not r['mag'] or r['id'] in set_id:
                    continue
                m = float(r['mag'])
                if m < 5:
                    continue
                set_id.add(r['id'])
                aar = int(r['time'][:4])
                assert START <= aar < SLUT, r
                skaelv.append([
                    round(float(r['longitude']) * 10), round(float(r['latitude']) * 10),
                    max(0, round(float(r['depth'] or 0))), round((m - 5) * 10), aar - START,
                ])
        print(fil.name, hashlib.sha256(fil.read_bytes()).hexdigest())
    skaelv.sort(key=lambda s: (s[3], s[4], s[0], s[1]))
    flad = [v for s in skaelv for v in s]
    ud = {
        'kilde': 'USGS ComCat, M ≥ 5, 1976–2025 (public domain)',
        'felter': ['lon·10', 'lat·10', 'dybde km', '(M−5)·10', 'år−1976'],
        'start': START,
        'antal': len(skaelv),
        'skaelv': flad,
    }
    sti = Path(__file__).with_name('jordskaelv.json')
    sti.write_text(json.dumps(ud, separators=(',', ':'), ensure_ascii=False))
    print(len(skaelv), 'skælv;', sti.stat().st_size // 1000, 'kB')


if __name__ == '__main__':
    main()
