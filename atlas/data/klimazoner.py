#!/usr/bin/env python3
"""Danner koppen.json og vahl.json (TopoJSON) til atlassets klimalag.

Kilde: Beck, H. E. m.fl. (2023), High-resolution (1 km) Köppen-Geiger maps
for 1901–2099 based on constrained CMIP6 projections, Scientific Data 10, 724,
doi:10.1038/s41597-023-02549-6. Data: figshare 21789074, CC BY 4.0.
  koppen_geiger_tif.zip  → 1991_2020/koppen_geiger_0p1.tif
  climate_data_0p5.zip   → 1991_2020/ensemble_mean_0p5.nc

Brug (i et venv med numpy, scipy, rasterio, shapely, topojson og netCDF4):
  python klimazoner.py /mappe/med/1991_2020 atlas/data

Köppen: Becks egne klasser for 1991–2020 (0,1°). Vahl: beregnet her ud fra
samme kildes månedsnormaler (0,5°) med skolekriterierne nedenfor – Vahls
eget system bygger også på regnsandsynlighed, som ikke findes i normalerne.

Bearbejdning: havceller får nærmeste landklasse, så kortet kan klippes med
atlassets egen kystlinje; et flertalsfilter fjerner enkeltceller; polygonerne
forenkles med fælles kanter (ingen huller eller overlap mellem klasser).
"""
import sys
from pathlib import Path
import numpy as np
from scipy import ndimage
import rasterio, rasterio.features, rasterio.transform
from shapely.geometry import shape, mapping, MultiPolygon
from shapely.ops import unary_union
import netCDF4
import topojson

# Vahl efter den gængse skoleversion.
# v = varmeste, k = koldeste måneds middeltemperatur (°C).
# Fugtig måned: nedbør (mm) > 2 × temperatur (°C), som i hydrotermfiguren.
VAHL = [
    # (nr, zone, plantebælte)
    (1, 'tropisk', 'Regnskov'),
    (2, 'tropisk', 'Savanne'),
    (3, 'tropisk', 'Busksteppe'),
    (4, 'tropisk', 'Ørken'),
    (5, 'subtropisk', 'Subtropisk skov'),
    (6, 'subtropisk', 'Maki'),
    (7, 'subtropisk', 'Græssteppe og savanne'),
    (8, 'subtropisk', 'Busksteppe'),
    (9, 'subtropisk', 'Ørken'),
    (10, 'tempereret', 'Løvskov'),
    (11, 'tempereret', 'Nåleskov'),
    (12, 'tempereret', 'Steppe'),
    (13, 'tempereret', 'Busksteppe'),
    (14, 'tempereret', 'Ørken'),
    (15, 'polar', 'Tundra'),
    (16, 'polar', 'Is'),
]


def vahl(t, p):
    """t, p: (12, ny, nx). Returnerer klassenumre (0 = ingen data)."""
    gyldig = np.isfinite(t).all(0) & np.isfinite(p).all(0)
    t = np.where(np.isfinite(t), t, 0); p = np.where(np.isfinite(p), p, 0)
    v, k = t.max(0), t.min(0)
    fugtig = p > 2 * t
    n = fugtig.sum(0)
    # Vinterregn: de tre varmeste måneder er alle tørre.
    varmeste = np.argsort(t, axis=0)[-3:]
    sommertoer = ~np.take_along_axis(fugtig, varmeste, 0).any(0)

    polar = v < 10
    tropisk = ~polar & (k > 15)
    subtropisk = ~polar & ~tropisk & (v > 20) & (k > 5)
    tempereret = ~polar & ~tropisk & ~subtropisk

    ud = np.zeros(v.shape, np.uint8)
    def tør(maske, regn, mellem, lidt, intet):
        ud[maske & (n >= 10)] = regn
        ud[maske & (n >= 3) & (n <= 9)] = mellem
        ud[maske & (n >= 1) & (n <= 2)] = lidt
        ud[maske & (n == 0)] = intet
    tør(tropisk, 1, 2, 3, 4)
    tør(subtropisk, 5, 7, 8, 9)
    ud[subtropisk & (n >= 3) & (n <= 9) & sommertoer] = 6
    tør(tempereret, 10, 12, 13, 14)
    # Vahls grænse mellem nåleskov og løvskov: v = 16,2 − 0,3·k.
    ud[tempereret & (n >= 10) & (v < 16.2 - 0.3 * k)] = 11
    ud[polar] = 15
    ud[polar & (v < 0)] = 16
    ud[~gyldig] = 0
    return ud


def fyld_hav(g):
    """Havceller (0) får nærmeste landklasse."""
    _, (iy, ix) = ndimage.distance_transform_edt(g == 0, return_indices=True)
    return g[iy, ix]


def flertal(g, n, stoerrelse):
    """Flertalsfilter: hver celle får den hyppigste klasse i et vindue."""
    bedst = np.zeros(g.shape, np.float32); ud = g.copy()
    for c in range(1, n + 1):
        andel = ndimage.uniform_filter((g == c).astype(np.float32), stoerrelse, mode='nearest')
        bedre = andel > bedst + 1e-6
        ud[bedre] = c; bedst[bedre] = andel[bedre]
    return ud


def main(kilde, ud):
    kilde, ud = Path(kilde), Path(ud)
    # Köppen-Geiger (Beck 2023), 0,1°.
    with rasterio.open(kilde / 'koppen_geiger_0p1.tif') as f:
        kg = f.read(1).astype(np.uint8); tr = f.transform
    kg = flertal(fyld_hav(kg), 30, 5)
    gem(ud / 'koppen.json', kg, tr, 'koppen', 0.12)

    # Vahl beregnet fra månedsnormalerne, 0,5°.
    d = netCDF4.Dataset(kilde / 'ensemble_mean_0p5.nc')
    lat = d['lat'][:]; lon = d['lon'][:]
    t = np.ma.filled(d['air_temperature'][:].astype(np.float64), np.nan)
    p = np.ma.filled(d['precipitation'][:].astype(np.float64), np.nan)
    if lat[0] < lat[-1]:
        lat = lat[::-1]; t = t[:, ::-1]; p = p[:, ::-1]
    tr = rasterio.transform.from_origin(lon[0] - .25, lat[0] + .25, .5, .5)
    va = vahl(t, p)
    va = flertal(fyld_hav(va), 16, 3)
    gem(ud / 'vahl.json', va, tr, 'vahl', 0.2)


def gem(sti, g, tr, navn, tolerance):
    lag = {}
    for geom, vaerdi in rasterio.features.shapes(g.astype(np.int16), transform=tr):
        if vaerdi:
            lag.setdefault(int(vaerdi), []).append(shape(geom))
    features = []
    for nr in sorted(lag):
        samlet = unary_union(lag[nr])
        dele = list(samlet.geoms) if hasattr(samlet, 'geoms') else [samlet]
        features.append({'type': 'Feature', 'id': nr, 'properties': {},
                         'geometry': mapping(MultiPolygon(dele))})
    topo = topojson.Topology({'type': 'FeatureCollection', 'features': features},
                             object_name=navn, prequantize=1e5,
                             toposimplify=tolerance, simplify_with='shapely',
                             prevent_oversimplify=True)
    sti.write_text(topo.to_json(), encoding='utf-8')
    print(sti.name, len(features), 'klasser', round(sti.stat().st_size / 1024), 'kB')


if __name__ == '__main__':
    main(*sys.argv[1:3])
