#!/usr/bin/env python3
"""Danner nedboer.bin til atlassets lag «Nedbør måned for måned».

Kilde: GPCP Monthly Version 2.3 (Global Precipitation Climatology Project),
NOAA Climate Data Record, satellit- og regnmålerdata kombineret, 2,5° × 2,5°,
mm/døgn. Adler m.fl. (2018), The Global Precipitation Climatology Project
(GPCP) Monthly Analysis (New Version 2.3) and a Review of 2017 Global
Precipitation, Atmosphere 9(4), 138, doi:10.3390/atmos9040138.

NOAA's egne servere (psl.noaa.gov, ncei.noaa.gov) kunne ikke nås fra
arbejdsmiljøet. De samme filer ligger i NOAA's åbne AWS-spejl
s3://noaa-cdr-precip-gpcp-monthly-pds (NOAA Open Data Dissemination).
Uden argument hentes de 360 måneder 1991–2020 til raa-gpcp/ ved siden af
scriptet (ikke i git).

Brug (i et venv med numpy og netCDF4):
  python -I atlas/data/nedboer.py [mappe-med-gpcp-filer]

Bearbejdning:
- Klimanormal 1991–2020 (samme periode som klimazonelaget): for hver
  kalendermåned middel af de 30 års mm/døgn i hver celle.
- Omregnet til mm pr. måned med månedens middellængde (februar 28,25 døgn),
  fordi elever kender nedbør i mm/måned fra klimadiagrammer.
- Afrundet til 0,1 mm og lagret som uint16 (tiendedele mm), rækker fra nord
  (88,75° … -88,75°), søjler fra -178,75° til 178,75° (cellemidter).

Filformat (efter gunzip): 'NBR1', bredde, højde og antal måneder som
uint16, derefter måneder × højde × bredde uint16 (little endian).
"""
import gzip, hashlib, re, struct, sys, urllib.request
from pathlib import Path
import numpy as np
import netCDF4

SPEJL = 'https://noaa-cdr-precip-gpcp-monthly-pds.s3.amazonaws.com/'
AAR = range(1991, 2021)
DOEGN = np.array([31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31])
NX, NY = 144, 72


def hent(mappe):
    mappe.mkdir(exist_ok=True)
    for aar in AAR:
        with urllib.request.urlopen(f'{SPEJL}?list-type=2&prefix=data/{aar}/', timeout=60) as svar:
            noegler = re.findall(r'<Key>([^<]+\.nc)</Key>', svar.read().decode())
        for n in noegler:
            fil = mappe / n.rsplit('/', 1)[1]
            if not fil.exists():
                with urllib.request.urlopen(SPEJL + n, timeout=120) as svar:
                    fil.write_bytes(svar.read())


def filer(mappe):
    # Én fil pr. måned; findes der flere udgaver (nyere c-dato), bruges den nyeste.
    valgt = {}
    for fil in sorted(mappe.glob('gpcp_v02r03_monthly_d*_c*.nc')):
        m = re.search(r'_d(\d{4})(\d\d)_c(\d{8})', fil.name)
        aar, maaned = int(m[1]), int(m[2])
        if aar in AAR:
            valgt[(aar, maaned)] = fil
    assert len(valgt) == 30 * 12, f'{len(valgt)} måneder, ikke 360'
    return valgt


def main():
    mappe = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name('raa-gpcp')
    if len(sys.argv) == 1:
        hent(mappe)
    valgt = filer(mappe)
    sum_ = np.zeros((12, NY, NX))
    for (aar, maaned), fil in valgt.items():
        d = netCDF4.Dataset(fil)
        lat, lon = d['latitude'][:], d['longitude'][:]
        assert len(lat) == NY and len(lon) == NX and lat[0] < 0 and abs(lon[0] - 1.25) < 1e-4
        p = np.ma.filled(d['precip'][0].astype(np.float64), np.nan)
        assert np.isfinite(p).all() and p.min() >= 0, fil.name
        sum_[maaned - 1] += p
        d.close()
    mm_doegn = sum_ / len(AAR)
    # Nord først; søjlerne 1,25 … 358,75° roteres til -178,75 … 178,75°.
    mm_doegn = np.roll(mm_doegn[:, ::-1, :], NX // 2, axis=2)
    mm = mm_doegn * DOEGN[:, None, None]
    k = np.round(mm * 10).astype(np.int64)
    assert k.max() < 65535
    hoved = b'NBR1' + struct.pack('<HHH', NX, NY, 12)
    ud = Path(__file__).with_name('nedboer.bin')
    ud.write_bytes(gzip.compress(hoved + k.astype('<u2').tobytes(), 9, mtime=0))

    # Nøgletal til LICENSE og test (arealvægtet med cos(breddegrad)).
    bredde = np.radians(88.75 - 2.5 * np.arange(NY))
    w = np.repeat(np.cos(bredde)[:, None], NX, 1)
    print(f'{ud.name}: {ud.stat().st_size // 1000} kB, sha256 {hashlib.sha256(ud.read_bytes()).hexdigest()}')
    aarssum = mm.sum(axis=0)
    print(f'global middel {np.average(mm_doegn.mean(axis=0), weights=w):.2f} mm/døgn, '
          f'{np.average(aarssum, weights=w):.0f} mm/år; største måned {mm.max():.0f} mm')
    def celle(lon, lat):
        return int((88.75 - lat) / 2.5 + .5), int((lon + 178.75) / 2.5 + .5)
    for navn, lon, lat in [('København', 12.5, 55.6), ('Mumbai', 72.9, 19.1), ('Manaus', -60.0, -3.1),
                           ('Sahara (Tchad)', 20.0, 22.0), ('Rom', 12.5, 41.9), ('Niamey', 2.1, 13.5)]:
        j, i = celle(lon, lat)
        print(f'  {navn:15s}', ' '.join(f'{v:4.0f}' for v in mm[:, j, i]), f'| år {aarssum[j, i]:.0f}')


if __name__ == '__main__':
    main()
