"""Konverter NOAA OISST v2 havoverfladetemperatur 1991–2020 til årsmiddel på 1°-gitter.
Brug: python havtemperatur.py /sti/sst.ltm.1991-2020.nc /sti/lsmask.nc
Kræver numpy og netCDF4. Kilde og metode: havtemperatur.LICENSE.
"""
import gzip, struct, sys
from pathlib import Path
import numpy as np
from netCDF4 import Dataset
with Dataset(sys.argv[1]) as ds:
    lat = np.asarray(ds['lat'][:]); lon = np.asarray(ds['lon'][:])
    sst = np.asarray(ds['sst'][:], dtype=float)
    assert ds['sst'].units == 'degC' and sst.shape == (12, 180, 360)
with Dataset(sys.argv[2]) as ds:
    hav = np.asarray(ds['mask'][0]) == 1
assert lat[0] == 89.5 and lon[0] == 0.5
# Årsmiddel af de tolv månedsnormaler; land bliver -32768.
aar = sst.mean(axis=0)
assert np.isfinite(aar[hav]).all() and aar[hav].min() > -2.5 and aar[hav].max() < 35
# Fra 0,5…359,5 °Ø til -179,5…179,5, så kolonne i svarer til længde -179,5 + i.
aar = np.roll(aar, 180, axis=1); hav = np.roll(hav, 180, axis=1)
grid = np.where(hav, np.rint(aar * 10), -32768).astype('<i2')
raw = b'SST1' + struct.pack('<HH', 360, 180) + grid.tobytes()
Path(__file__).with_suffix('.bin').write_bytes(gzip.compress(raw, mtime=0))
print('°C interval', aar[hav].min(), aar[hav].max(), 'havceller', hav.sum())
