"""Målt havtemperaturafvigelse under El Niño 1997/98 og La Niña 2010/11.
NOAA ERSST v5, middel af november–januar minus samme måneders middel 1991–2020,
lagt om fra 2°- til 1°-gitter (bilineært), så det passer på havtemperatur.bin.
Brug: python enso.py /sti/ersstv5.nc
Kræver numpy og netCDF4. Kilde og metode: enso.LICENSE.
"""
import gzip, struct, sys
from pathlib import Path
import numpy as np
from netCDF4 import Dataset, num2date

with Dataset(sys.argv[1]) as ds:
    tid = [(t.year, t.month) for t in num2date(ds['time'][:], ds['time'].units)]
    lat = np.asarray(ds['lat'][:]); lon = np.asarray(ds['lon'][:])
    sst = np.ma.filled(ds['sst'][:], np.nan).astype(float)
    assert ds['sst'].units == 'degC'
assert lat[0] == 88 and lat[-1] == -88 and lon[0] == 0 and lon[-1] == 358

def maaned(aar, m): return sst[tid.index((aar, m))]
normal = {m: np.nanmean([maaned(a, m) for a in range(1991, 2021)], axis=0) for m in (11, 12, 1)}
def ndj(aar):
    return np.mean([maaned(aar, 11) - normal[11], maaned(aar, 12) - normal[12], maaned(aar + 1, 1) - normal[1]], axis=0)

def til_1grad(a):
    # Celler -179,5…179,5 °Ø og 89,5…−89,5 °N; manglende 2°-værdier springes over.
    ud = np.full((180, 360), np.nan)
    for j, b in enumerate(np.arange(89.5, -90, -1)):
        y = np.clip((88 - b) / 2, 0, 88); j0 = int(min(87, np.floor(y))); fy = y - j0
        for i, l in enumerate(np.arange(-179.5, 180, 1)):
            x = (l % 360) / 2; i0 = int(np.floor(x)) % 180; i1 = (i0 + 1) % 180; fx = x - np.floor(x)
            v = np.array([a[j0, i0], a[j0, i1], a[j0 + 1, i0], a[j0 + 1, i1]])
            w = np.array([(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy])
            ok = np.isfinite(v)
            if ok.any() and w[ok].sum() > 0: ud[j, i] = (v[ok] * w[ok]).sum() / w[ok].sum()
    return ud

raw = b'ENSO' + struct.pack('<HHB', 360, 180, 2)
for aar in (1997, 2010):
    g = til_1grad(ndj(aar))
    print(aar, 'interval', np.nanmin(g), np.nanmax(g))
    # int8 i tiendedele °C, klippet til ±12,7; −128 = ingen værdi.
    raw += np.where(np.isfinite(g), np.clip(np.rint(g * 10), -127, 127), -128).astype('i1').tobytes()
Path(__file__).with_suffix('.bin').write_bytes(gzip.compress(raw, mtime=0))
