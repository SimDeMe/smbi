"""Geografiske stikprøver og uafhængig kontrol mod de versionsbundne originaler.

python3 atlas/test/pladedata.py
python3 atlas/test/pladedata.py --originaler /mappe/med/PB2002-filer
Ingen netadgang er nødvendig; originalfiler hentes særskilt fra LICENSE-linket.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

STI = Path(__file__).parents[1] / 'data/pladegraenser.json'
FINGERAFTRYK = {
    'PB2002_steps.dat.txt': '513babb111c65cd275274e2edcb249085d00e007c79d8755e1b4b79f60806f37',
    'PB2002_orogens.dig.txt': 'daf4e6ff6c5e6983d70df8977bc989f814b79dd4efda28c24433db012f2e77c6',
}


def afstand(a, b):
    """Storcirkelafstand i radianer; også korrekt over ±180°."""
    l1, b1, l2, b2 = map(math.radians, [*a, *b])
    h = math.sin((b2-b1)/2)**2 + math.cos(b1)*math.cos(b2)*math.sin((l2-l1)/2)**2
    return 2 * math.asin(min(1, math.sqrt(h)))


def laengdegrad(tekst):
    v = float(tekst)
    return v - 360 if v > 180 else v


def stikproever(data):
    # Geografiske kontrolområder, ikke nye stedmarkører eller målte grænser.
    for navn, sted, bird, graense in [
        ('Island', [-19, 65], 'OSR', 'EU-NA'),
        ('San Andreas', [-120, 36], 'CTF', 'NA-PA'),
        ('Himalaya', [85, 28], 'CCB', 'EU-IN'),
        ('Andes', [-73, -22], 'SUB', 'NZ\\SA'),
        ('Japan', [142, 37], 'SUB', 'PA\\OK'),
    ]:
        linje = min(data['linjer'], key=lambda l: min(
            afstand(sted, p) for p in zip(l[4][::2], l[4][1::2])))
        assert (linje[0], linje[3]) == (bird, graense), (navn, linje[:4])
    assert {l[0] for l in data['linjer']} == {'OSR', 'CRB', 'SUB', 'OCB', 'CCB', 'OTF', 'CTF'}
    for navn, ring in data['orogener']:
        assert ring[:2] == ring[-2:], f'Polygonen {navn} er ikke lukket'
    print('Geografiske stikprøver, syv klasser og lukkede orogener: OK')


def kontroller_originaler(data, mappe):
    tekster = {}
    for fil, sha in FINGERAFTRYK.items():
        indhold = (mappe / fil).read_bytes().replace(b'\r', b'')
        assert hashlib.sha256(indhold).hexdigest() == sha, f'Ukendt kildeversion: {fil}'
        tekster[fil] = indhold.decode('latin-1')

    # Læs hvert originaltrin direkte ud fra Birds feltbeskrivelse; importér
    # ikke eksportøren. Ingen klasseskift, segmenter eller kildepunkter må tabes.
    original = []
    for l in tekster['PB2002_steps.dat.txt'].splitlines():
        original.append((l[92:95], int(l[95:96] == '*'), l[6:11],
            laengdegrad(l[12:20]), float(l[21:28]), laengdegrad(l[29:37]), float(l[38:45])))
    eksporteret = []
    for bird, orogen, side, graense, flad in data['linjer']:
        assert side == ((1 if graense[2] == '/' else -1) if bird == 'SUB' else 0)
        for i in range(0, len(flad)-2, 2):
            eksporteret.append((bird, orogen, graense, *flad[i:i+4]))
    assert len(eksporteret) == len(original), 'Originaltrin er tabt eller tilføjet'
    for i, (ud, ind) in enumerate(zip(eksporteret, original)):
        assert ud[:3] == ind[:3], f'Klasse/grænse/orogenmærke afviger i trin {i+1}'
        assert all(abs(a-b) <= .0050001 for a, b in zip(ud[3:], ind[3:])), f'Koordinatændring ud over afrundingen i trin {i+1}'

    ringe = {}
    navn, punkter = None, []
    for l in tekster['PB2002_orogens.dig.txt'].splitlines():
        if l.startswith('***'):
            if punkter[-1] != punkter[0]: punkter.append(punkter[0])
            ringe[navn] = [v for p in reversed(punkter) for v in p]
            navn, punkter = None, []
        elif navn is None:
            navn = l[:27].strip()
        else:
            lon, lat = map(float, l.split(','))
            punkter.append([lon-360 if lon > 180 else lon, lat])
    assert set(dict(data['orogener'])) == set(ringe), 'Orogener er tabt eller tilføjet'
    for navn, ud in data['orogener']:
        ind = ringe[navn]
        assert len(ud) == len(ind) and all(abs(a-b) <= .0050001 for a, b in zip(ud, ind)), f'Kildepunkter ændret i {navn}'
    print(f'Alle {len(original)} trin og {len(ringe)} orogener matcher originalerne, inkl. subduktionsside: OK')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--originaler', type=Path)
    valg = parser.parse_args()
    data = json.loads(STI.read_text())
    stikproever(data)
    if valg.originaler:
        kontroller_originaler(data, valg.originaler)
