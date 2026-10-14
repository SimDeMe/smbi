#!/usr/bin/env python3
"""Danner pladegraenser.json (GeoJSON) fra Peter Birds PB2002-model.

Kilde: Bird, P. (2003), An updated digital model of plate boundaries,
G-cubed 4(3), 1027, doi:10.1029/2001GC000252. Filerne PB2002_steps.dat og
PB2002_orogens.dig hentes fra http://peterbird.name/oldFTP/PB2002/ (eller
den identiske kopi i github.com/fraxen/tectonicplates, ODC-By 1.0).

Brug:  python3 atlas/data/pladegraenser.py PB2002_steps.dat.txt PB2002_orogens.dig.txt

Bearbejdning: Birds syv trinklasser samles i tre skoleklasser; sammenhængende
trin med samme grænse, klasse og orogenmærke slås sammen til én linje;
koordinater afrundes til 0,01° (ca. 1 km), langt under modellens egen usikkerhed.
"""
import json, sys
from pathlib import Path

KLASSE = {
    'OSR': 'konstruktiv', 'CRB': 'konstruktiv',
    'SUB': 'destruktiv', 'OCB': 'destruktiv', 'CCB': 'destruktiv',
    'OTF': 'bevarende', 'CTF': 'bevarende',
}

def lon(x):
    x = float(x)
    return round(x - 360 if x > 180 else x, 2)

def punkt(l, b):
    return [lon(l), round(float(b), 2)]

def trin(fil):
    for linje in Path(fil).read_text(encoding='latin-1').splitlines():
        if not linje.strip():
            continue
        # Faste kolonner (PB2002_steps_desc): byte 6 kontinuitet, 7-11 grænse,
        # 93-95 klasse, 96 orogen.
        yield {
            'fortsat': linje[5] == ':',
            'graense': linje[6:11],
            'fra': punkt(linje[12:20], linje[21:28]),
            'til': punkt(linje[29:37], linje[38:45]),
            'spredning': float(linje[66:72]),
            'bird': linje[92:95],
            'orogen': linje[95:96] == '*',
        }

def flad(koord):
    return [v for p in koord for v in p]

def linjer(fil):
    ud, aktuel = [], None
    for t in trin(fil):
        noegle = (t['graense'], t['bird'], t['orogen'])
        if aktuel and t['fortsat'] and aktuel['noegle'] == noegle and aktuel['koord'][-1] == t['fra']:
            aktuel['koord'].append(t['til'])
            continue
        aktuel = {'noegle': noegle, 'koord': [t['fra'], t['til']]}
        ud.append(aktuel)
    features = []
    for l in ud:
        graense, bird, orogen = l['noegle']
        # '/' : højre plade subducerer under venstre; '\' : omvendt (set
        # udefra i digitaliseringsretningen). Tænder tegnes på den overliggende:
        # 1 = venstre side, -1 = højre side, 0 = ingen subduktion.
        overliggende = (1 if graense[2] == '/' else -1) if bird == 'SUB' else 0
        features.append([bird, int(orogen), overliggende, graense, flad(l['koord'])])
    return features

def orogener(fil):
    features, navn, ring = [], None, []
    for linje in Path(fil).read_text(encoding='latin-1').splitlines():
        if linje.startswith('***'):
            # Bird digitaliserer mod uret set udefra; D3 forventer med uret.
            features.append([navn, flad(ring[::-1])])
            navn, ring = None, []
        elif navn is None:
            navn = linje[:27].strip()
        else:
            l, b = linje.split(',')
            ring.append(punkt(l, b))
    return features

if __name__ == '__main__':
    steps, orog = sys.argv[1:3]
    # Kompakt format; atlas/pladelag.js omdanner til GeoJSON.
    # linjer: [Bird-klasse, orogen 0/1, overliggende 1/-1/0, grænse, [lon, lat, lon, lat …]]
    # orogener: [navn, [lon, lat …]] som lukket ring, med uret set udefra.
    data = {
        'kilde': 'Bird (2003) PB2002, doi:10.1029/2001GC000252; bearbejdet af smbi.dk',
        'klasser': KLASSE,
        'linjer': linjer(steps),
        'orogener': orogener(orog),
    }
    ud = Path(__file__).with_name('pladegraenser.json')
    ud.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(ud, len(data['linjer']), 'linjer,', len(data['orogener']), 'orogener')
