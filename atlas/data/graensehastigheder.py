#!/usr/bin/env python3
"""Udtag lokale PB2002-hastigheder uden at udjævne eller halvere dem.

python3 atlas/data/graensehastigheder.py /mappe/PB2002_steps.dat.txt
Hvert punkt er midten af ét originaltrin; værdierne gælder netop dér.
"""
import hashlib
import json
import math
import sys
from pathlib import Path


def midtpunkt(fra, til):
    vektorer = []
    for lon, lat in [fra, til]:
        l, b = map(math.radians, [lon, lat])
        vektorer.append([math.cos(b) * math.cos(l), math.cos(b) * math.sin(l), math.sin(b)])
    x, y, z = [sum(v[i] for v in vektorer) for i in range(3)]
    return [round(math.degrees(math.atan2(y, x)), 5),
            round(math.degrees(math.atan2(z, math.hypot(x, y))), 5)]


def udtag(tekst):
    blokke, blok, noegle = [], [], None
    for l in tekst.splitlines():
        t = l.split()
        if not t:
            continue
        graense = l[6:11]
        ny = (graense, l[92:95], l[95:96] == '*')
        if blok and (l[5] != ':' or ny != noegle):
            blokke.append(blok)
            blok = []
        noegle = ny
        blok.append((t, ny))
    if blok:
        blokke.append(blok)
    punkter = []
    for blok in blokke:
        laengde = sum(float(t[6]) for t, _ in blok)
        antal = math.ceil(laengde / 400)
        maal = [(i + .5) * laengde / antal for i in range(antal)]
        gennemloebet, valgt = 0, set()
        for t, (graense, klasse, orogen) in blok:
            gennemloebet += float(t[6])
            while maal and maal[0] <= gennemloebet + 1e-6:
                maal.pop(0)
                if int(t[0]) in valgt:
                    continue
                valgt.add(int(t[0]))
                lon, lat = midtpunkt(list(map(float, t[2:4])), list(map(float, t[4:6])))
                # Positiv på tværs = åbning; negativ = lukning. Langs er
                # Birds fortegnede højrelaterale komponent. Begge i mm/år.
                punkter.append([int(t[0]), graense, klasse, int(orogen or 'SL' in graense),
                                lon, lat, int(t[7]), float(t[10]), float(t[11]), round(laengde, 1)])
    return punkter


if __name__ == '__main__':
    kilde = Path(sys.argv[1]).read_bytes().replace(b'\r', b'')
    assert hashlib.sha256(kilde).hexdigest() == '513babb111c65cd275274e2edcb249085d00e007c79d8755e1b4b79f60806f37', 'Ukendt kildeversion'
    tekst = kilde.decode('latin1')
    assert len(tekst.splitlines()) == 5819
    data = {'kilde': 'Bird (2003), PB2002_steps.dat, tabel 2', 'enhed': 'mm/år',
            'kildetrin': 5819, 'punkter': udtag(tekst)}
    fil = Path(__file__).with_suffix('.json')
    fil.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(fil, len(data['punkter']), 'lokale kildepunkter')
