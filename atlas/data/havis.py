#!/usr/bin/env python3
"""Danner havis.json til atlassets lag «Havisens udbredelse» (Klimaforandringer).

Kilde: NSIDC Sea Ice Index, version 4 (G02135, National Snow and Ice Data Center 2025):
- månedlige polygoner for havisens udbredelse (mindst 15 % is i cellen) for
  Arktis (N) og Antarktis (S),
- medianlinjen for 1981–2010 for samme måned,
- de månedlige udbredelser i mio. km² (N_MM_extent_v4.0.csv).
  https://noaadata.apps.nsidc.org/NOAA/G02135/

Uden argument hentes filerne til raa-nsidc/ ved siden af scriptet (ikke i git).

Brug (i et venv med pyshp, shapely og pyproj):
  python -I atlas/data/havis.py [mappe-med-nsidc-filer]

Bearbejdning:
- Marts (Arktis' maksimum) og september (Arktis' minimum; Antarktis' maksimum)
  for årene 1980, 1990, 2000, 2010, 2012 (Arktis' rekordlave september),
  2020 og 2025.
- Polygonerne omregnes fra NSIDC's polære stereografiske projektion til
  længde og bredde, forenkles med 10 km tolerance (Douglas–Peucker i
  projektionen), og isflager under 2000 km² udelades. Koordinater med to
  decimaler (ca. 1 km).
- Tidsserien for marts og september fra 1979 til 2025 i mio. km².
"""
import csv, json, sys, urllib.request, zipfile, io
from pathlib import Path
import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import shape, mapping, MultiPolygon, Polygon, MultiLineString
import numpy as np
import shapely

HER = Path(__file__).parent
URL = 'https://noaadata.apps.nsidc.org/NOAA/G02135/'
AAR = [1980, 1990, 2000, 2010, 2012, 2020, 2025]
MAANEDER = {3: '03_Mar', 9: '09_Sep'}
POL = {'N': 'north', 'S': 'south'}
TOLERANCE = 10000      # m
MIN_AREAL = 2000e6     # m²


def hent(mappe):
    mappe.mkdir(exist_ok=True)
    for h, navn in POL.items():
        for m, mappenavn in MAANEDER.items():
            filer = [(f'extent_{h}_{a}{m:02}_polygon_v4.0.zip', f'{navn}/monthly/shapefiles/shp_extent/{mappenavn}/') for a in AAR]
            filer += [(f'median_extent_{h}_{m:02}_1981-2010_polyline_v4.0.zip', f'{navn}/monthly/shapefiles/shp_median/'),
                      (f'{h}_{m:02}_extent_v4.0.csv', f'{navn}/monthly/data/')]
            for fil, sti in filer:
                if not (mappe / fil).exists():
                    urllib.request.urlretrieve(URL + sti + fil, mappe / fil)


def laes(zipsti):
    """Geometrier i længde/bredde fra en zippet shapefil i NSIDC's projektion."""
    with zipfile.ZipFile(zipsti) as z:
        navne = z.namelist()
        hent_ = lambda ext: io.BytesIO(z.read(next(n for n in navne if n.endswith(ext))))
        prj = z.read(next(n for n in navne if n.endswith('.prj'))).decode()
        r = shapefile.Reader(shp=hent_('.shp'), shx=hent_('.shx'), dbf=hent_('.dbf'))
        geom = [shape(s.__geo_interface__) for s in r.shapes()]
    til = Transformer.from_crs(CRS.from_wkt(prj), 'EPSG:4326', always_xy=True)
    return geom, lambda g: shapely.transform(g, lambda xy: np.column_stack(til.transform(xy[:, 0], xy[:, 1])))


def rund(koord):
    if isinstance(koord, (list, tuple)) and koord and isinstance(koord[0], (int, float)):
        return [round(koord[0], 2), round(koord[1], 2)]
    return [rund(k) for k in koord]


def polygoner(zipsti):
    geom, tillonlat = laes(zipsti)
    dele = []
    for g in geom:
        for p in getattr(g, 'geoms', [g]):
            p = p.simplify(TOLERANCE, preserve_topology=True)
            if p.is_empty or p.area < MIN_AREAL:
                continue
            # Små huller (polynier, øer) under arealgrænsen fjernes også.
            p = Polygon(p.exterior, [h for h in p.interiors if Polygon(h).area >= MIN_AREAL])
            dele.append(tillonlat(p))
    return rund(mapping(MultiPolygon(dele))['coordinates'])


def linjer(zipsti):
    geom, tillonlat = laes(zipsti)
    ud = []
    for g in geom:
        for l in getattr(g, 'geoms', [g]):
            l = l.simplify(TOLERANCE)
            if l.length > 100e3:
                ud.append(tillonlat(l))
    return rund(mapping(MultiLineString(ud))['coordinates'])


def serie(sti):
    with open(sti, newline='') as f:
        raekker = [{k.strip(): v.strip() for k, v in r.items()} for r in csv.DictReader(f)]
    # Kun hele år til og med det seneste kortår; det igangværende års tal er foreløbige.
    return [[int(r['year']), float(r['extent'])] for r in raekker if float(r['extent']) > 0 and int(r['year']) <= AAR[-1]]


def main():
    mappe = Path(sys.argv[1]) if len(sys.argv) > 1 else HER / 'raa-nsidc'
    if len(sys.argv) <= 1:
        hent(mappe)
    kort, median, serier = {}, {}, {}
    for h in POL:
        for m in MAANEDER:
            for a in AAR:
                kort[f'{h}-{m}-{a}'] = polygoner(mappe / f'extent_{h}_{a}{m:02}_polygon_v4.0.zip')
            median[f'{h}-{m}'] = linjer(mappe / f'median_extent_{h}_{m:02}_1981-2010_polyline_v4.0.zip')
            serier[f'{h}-{m}'] = serie(mappe / f'{h}_{m:02}_extent_v4.0.csv')
            print(h, m, 'punkter', sum(len(r) for a in AAR for p in kort[f'{h}-{m}-{a}'] for r in p),
                  'serie', serier[f'{h}-{m}'][0], serier[f'{h}-{m}'][-1])
    ud = {'kilde': 'NSIDC Sea Ice Index, version 4 (G02135)', 'aar': AAR, 'maaneder': list(MAANEDER),
          'kort': kort, 'median': median, 'serie': serier}
    (HER / 'havis.json').write_text(json.dumps(ud, separators=(',', ':')))
    print('havis.json', (HER / 'havis.json').stat().st_size, 'byte')


if __name__ == '__main__':
    main()
