#!/usr/bin/env python3
"""Danner temperatur.bin til atlassets lag «Temperaturstigning» (Klimaforandringer).

Kilde: NASA GISS Surface Temperature Analysis (GISTEMP v4), månedlige
temperaturafvigelser i 2° × 2° celler med 1200 km udglatning, land
(GHCN v4) og hav (ERSST v5) kombineret, i forhold til 1951–1980.
  https://data.giss.nasa.gov/pub/gistemp/gistemp1200_GHCNv4_ERSSTv5.nc.gz
Uden argument hentes filen til raa-gistemp/ ved siden af scriptet (ikke i git).

Brug (i et venv med numpy og netCDF4):
  python -I atlas/data/temperatur.py [gistemp1200_GHCNv4_ERSSTv5.nc]

Bearbejdning:
- Perioder: årtierne 1900–1909 … 2010–2019 og 2020–2025 (seneste hele år).
- For hver celle middel af periodens måneder; har cellen tal for under
  halvdelen af månederne, er den uden data (tidlige år over Arktis,
  Antarktis og dele af Afrika).
- Afrundet til 0,01 °C og lagret som int16 (hundrededele °C), −32768 = ingen
  data, rækker fra nord (89° … −89°), søjler fra −179° til 179° (cellemidter).
- Det globale middel for hver periode (arealvægtet over cellerne med data)
  skrives ud til kontrol mod GISS' egen globale serie.

Filformat (efter gunzip): 'TMP1', bredde, højde og antal perioder som
uint16, perioderne som par af uint16 (første og sidste år), derefter
perioder × højde × bredde int16 (little endian).
"""
import gzip, struct, sys, urllib.request
from pathlib import Path
import numpy as np
import netCDF4

HER = Path(__file__).parent
URL = 'https://data.giss.nasa.gov/pub/gistemp/gistemp1200_GHCNv4_ERSSTv5.nc.gz'
PERIODER = [(a, a + 9) for a in range(1900, 2020, 10)] + [(2020, 2025)]
INGEN = -32768


def hent():
    sti = HER / 'raa-gistemp' / 'gistemp1200_GHCNv4_ERSSTv5.nc'
    if not sti.exists():
        sti.parent.mkdir(exist_ok=True)
        gz = sti.with_suffix('.nc.gz')
        urllib.request.urlretrieve(URL, gz)
        sti.write_bytes(gzip.decompress(gz.read_bytes()))
    return sti


def main():
    sti = Path(sys.argv[1]) if len(sys.argv) > 1 else hent()
    d = netCDF4.Dataset(sti)
    lat = d.variables['lat'][:]
    lon = d.variables['lon'][:]
    assert len(lat) == 90 and len(lon) == 180 and lat[0] < 0 and lon[0] == -179
    tid = d.variables['time']
    aar = np.array([t.year for t in netCDF4.num2date(tid[:], tid.units)])
    a = d.variables['tempanomaly'][:]          # maskeret array, °C
    vaegt = np.cos(np.radians(lat))[:, None] * np.ones((1, 180))
    ud = []
    for fra, til in PERIODER:
        valgt = (aar >= fra) & (aar <= til)
        assert valgt.sum() == 12 * (til - fra + 1), (fra, til)
        blok = a[valgt]
        antal = (~np.ma.getmaskarray(blok)).sum(axis=0)
        middel = blok.mean(axis=0).filled(np.nan)
        middel[antal < valgt.sum() / 2] = np.nan
        ok = ~np.isnan(middel)
        glob = (middel[ok] * vaegt[ok]).sum() / vaegt[ok].sum()
        print(f'{fra}–{til}: globalt middel {glob:+.2f} °C, {ok.mean():.0%} af cellerne har data')
        ud.append(np.where(ok, np.round(middel * 100), INGEN).astype('<i2')[::-1])   # nord først
    hoved = b'TMP1' + struct.pack('<3H', 180, 90, len(PERIODER)) + b''.join(struct.pack('<2H', *p) for p in PERIODER)
    data = hoved + np.stack(ud).tobytes()
    (HER / 'temperatur.bin').write_bytes(gzip.compress(data, 9, mtime=0))
    print('temperatur.bin', len(data), 'byte, gzip', (HER / 'temperatur.bin').stat().st_size)


if __name__ == '__main__':
    main()
