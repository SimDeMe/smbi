"""Konverter NCEP/NCAR 2 m lufttemperatur 1991–2020 til 2,5° atlasgitter.
Brug: python middeltemperatur.py /sti/air.2m.mon.ltm.1991-2020.nc
Kræver numpy og netCDF4. Kilde og metode: middeltemperatur.LICENSE.
"""
import gzip, struct, sys
from pathlib import Path
import numpy as np
from netCDF4 import Dataset
with Dataset(sys.argv[1]) as ds:
    lat = np.asarray(ds['lat'][:]); lon = np.asarray(ds['lon'][:])
    air = np.asarray(ds['air'][:], dtype=float)
    assert air.shape == (12, len(lat), len(lon))
    units = ds['air'].units
    if units.lower() in ('k', 'degk', 'kelvin'): air -= 273.15
    else: assert units.lower() in ('degc', 'c', 'degree_celsius'), units
    assert np.isfinite(air).all() and air.min() > -90 and air.max() < 65
    # Periodisk interpolation i længde; lineær i bredde, nærmeste polrand.
    x = (np.arange(144)*2.5-178.75) % 360
    y = 88.75-np.arange(72)*2.5
    rows = np.array([[np.interp(x, np.r_[lon,360], np.r_[row,row[0]]) for row in month] for month in air])
    grid = np.array([[np.interp(y,lat[::-1],rows[m,::-1,j]) for j in range(144)] for m in range(12)]).transpose(0,2,1)
raw = b'MTM1'+struct.pack('<HHH',144,72,12)+np.rint(grid*10).astype('<i2').tobytes()
Path(__file__).with_suffix('.bin').write_bytes(gzip.compress(raw, mtime=0))
print('°C interval', grid.min(), grid.max())
