#!/usr/bin/env python3
"""Dan samfund.json og potentiale.bin fra åbne kilder. Kræver Pillow og numpy.
Kør: python atlas/data/ressourcer.py --cache /tmp/atlas-ressourcer
Rådata gemmes i cachen; slet den for at hente på ny. SHA-256 gemmes i kildeoversigten.
"""
import argparse, csv, gzip, hashlib, json, struct, urllib.parse, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image

HER = Path(__file__).parent
NASA = 'https://gis.earthdata.nasa.gov/portal/rest/services/POWER/'
ENERGI = 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv'
VAND = 'https://api.worldbank.org/v2/country/all/indicator/ER.H2O.FWST.ZS?format=json&date=2022&per_page=1000'
KILDER = {}


def hent(cache, navn, url):
    sti = cache / navn
    if not sti.exists():
        urllib.request.urlretrieve(url, sti)
    KILDER[navn] = {'url': url, 'sha256': hashlib.sha256(sti.read_bytes()).hexdigest()}
    return sti


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, default=Path('/tmp/atlas-ressourcer'))
    cache = parser.parse_args().cache
    cache.mkdir(parents=True, exist_ok=True)
    demo = json.loads((HER / 'demografi.json').read_text())['lande']
    id_for = {l['iso3']: id for id, l in demo.items() if l.get('iso3')}
    lande = {id: {'navn': l['navn']} for id, l in demo.items()}
    felter = ['renewables', 'coal', 'oil', 'gas', 'nuclear', 'hydro', 'solar', 'wind', 'biofuel', 'other_renewables']
    for r in csv.DictReader(hent(cache, 'energi.csv', ENERGI).open()):
        id = id_for.get(r['iso_code'])
        if not id or r['year'] != '2023':
            continue
        for basis, kol in [('energi', 'energy'), ('el', 'elec')]:
            lande[id][basis] = {f: round(float(r[f + '_share_' + kol]), 3)
                                for f in felter if r.get(f + '_share_' + kol)}
    for r in json.loads(hent(cache, 'vand.json', VAND).read_text())[1]:
        id = id_for.get(r['countryiso3code'])
        if id and r['value'] is not None:
            lande[id]['vand'] = round(r['value'], 3)
    assert lande['208']['el']['renewables'] > 80 and 20 < lande['208']['vand'] < 30
    (HER / 'samfund.json').write_text(json.dumps({'energiaar': 2023, 'vandaar': 2022, 'lande': lande}, ensure_ascii=False, separators=(',', ':')) + '\n')
    raekker = []
    for kind, var in [('RADIATION', 'ALLSKY_SFC_SW_DWN'), ('METEOROLOGY', 'WS50M')]:
        url = NASA + 'POWER_CLIMATOLOGY_' + kind + '_LST/ImageServer'
        rule = {'multidimensionalDefinition': [{'variableName': var, 'dimensionName': 'month', 'values': [13], 'isSlice': True}]}
        q = {'bbox': '-180,-90,180,90', 'bboxSR': 4326, 'imageSR': 4326, 'size': '360,180', 'format': 'tiff', 'pixelType': 'F32',
             'interpolation': 'RSP_NearestNeighbor', 'mosaicRule': json.dumps(rule), 'renderingRule': json.dumps({'rasterFunction': 'None'}), 'f': 'image'}
        a = np.array(Image.open(hent(cache, var + '.tif', url + '/exportImage?' + urllib.parse.urlencode(q))))
        assert a.shape == (180, 360)
        # Soltjenesten bruger W/m². Omregn til daglig energi: 24/1000 kWh/m²/døgn.
        faktor = .024 if kind == 'RADIATION' else 1
        assert np.all((a >= 0) | (a == -999))
        raekker.append(np.where(a == -999, 65535, np.rint(a * faktor * 100)).astype('<u2').tobytes())
    # Nord → syd, vest → øst; cellemidter −179,5…179,5 og 89,5…−89,5.
    raw = b'RES1' + struct.pack('<HH', 360, 180) + b''.join(raekker)
    (HER / 'potentiale.bin').write_bytes(gzip.compress(raw, mtime=0))
    (HER / 'ressourcer-kilder.json').write_text(json.dumps(KILDER, indent=2) + '\n')
    print('Lande:', sum(bool(l.get('el')) for l in lande.values()), 'el;', sum('vand' in l for l in lande.values()), 'vandstress')


if __name__ == '__main__':
    main()
