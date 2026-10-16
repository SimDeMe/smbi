#!/usr/bin/env python3
"""Danner havbundsalder.bin til atlassets lag «Havbundens alder».

Kilde: Seton, M. m.fl. (2020), A global dataset of present-day oceanic crustal
age and seafloor spreading parameters, Geochemistry, Geophysics, Geosystems 21,
e2020GC009214, doi:10.1029/2020GC009214. Gitteret er EarthBytes
age.2020.1.GeeK2007.6m.nc (0,1°, alder i mio. år efter tidsskalaen GTS2012).

EarthByte (earthbyte.org) kunne ikke nås fra arbejdsmiljøet. Den samme fil
ligger uændret i pyBacktrack 1.5.0 på PyPI som
pybacktrack/bundle_data/age/agegrid_6m.nc (se Readme.txt ved siden af den).
Uden argument hentes hjulet fra PyPI og gemmes i raa-havbund/ ved siden af
scriptet (ikke i git).

Brug (i et venv med numpy og netCDF4):
  python -I atlas/data/havbundsalder.py [agegrid_6m.nc]

Bearbejdning:
- 2 × 2 celler af 0,1° samles til én celle på 0,2° (middel af de gyldige;
  en celle er gyldig, hvis mindst halvdelen af de fire har en alder). Det
  giver 1800 × 900 celler med midtpunkt i -179,9 … 179,9° og 89,9 … -89,9°.
- Alderen afrundes til 0,2 mio. år og lagres som heltal k = 5·alder + 1;
  0 betyder «ingen havbundsalder» (kontinental skorpe eller ingen data).
- Hver række gemmes som forskelle til forrige celle (int16, little endian),
  så filen pakker godt, og det hele gzippes.

Filformat (efter gunzip): 'HBA1', bredde og højde som uint16, derefter
bredde × højde int16-forskelle række for række fra nord.
"""
import gzip, hashlib, struct, sys, urllib.request, warnings, zipfile
from pathlib import Path
import numpy as np
import netCDF4

HJUL = ('https://files.pythonhosted.org/packages/py3/p/pybacktrack/'
        'pybacktrack-1.5.0-py3-none-any.whl')
HJUL_SHA256 = '978d0f11b0fa12bdcffef43e66487c5caf28a0f84a8eccbf5c9b253e5d389193'
GITTER = 'pybacktrack/bundle_data/age/agegrid_6m.nc'
TRIN = 5           # 1 / 0,2 mio. år


def hent_gitter():
    mappe = Path(__file__).with_name('raa-havbund')
    mappe.mkdir(exist_ok=True)
    fil = mappe / 'agegrid_6m.nc'
    if not fil.exists():
        hjul = mappe / HJUL.rsplit('/', 1)[1]
        if not hjul.exists():
            with urllib.request.urlopen(HJUL, timeout=600) as svar:
                hjul.write_bytes(svar.read())
        if hashlib.sha256(hjul.read_bytes()).hexdigest() != HJUL_SHA256:
            sys.exit('pyBacktrack-hjulet har en anden SHA-256 end forventet')
        with zipfile.ZipFile(hjul) as z:
            fil.write_bytes(z.read(GITTER))
    return fil


def main():
    fil = Path(sys.argv[1]) if len(sys.argv) > 1 else hent_gitter()
    print(fil.name, hashlib.sha256(fil.read_bytes()).hexdigest())
    d = netCDF4.Dataset(fil)
    lat, lon = d['lat'][:], d['lon'][:]
    assert lat[0] == -90 and lat[-1] == 90 and lon[0] == -180 and lon[-1] == 180 and len(lon) == 3601
    z = np.ma.filled(d['z'][:].astype(np.float64), np.nan)
    # Gitterpunkterne ligger på hele 0,1°; cellerne på 0,2° samler punkterne
    # -180,0 og -179,9 osv. (sidste søjle, 180°, er den samme som -180°).
    z = z[:-1, :-1]
    ny, nx = z.shape[0] // 2, z.shape[1] // 2
    blok = z[:ny * 2, :nx * 2].reshape(ny, 2, nx, 2)
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', RuntimeWarning)
        alder = np.nanmean(blok, axis=(1, 3))
    alder[np.isfinite(blok).mean(axis=(1, 3)) < .5] = np.nan
    alder = alder[::-1]                      # nord først
    k = np.zeros(alder.shape, np.int32)
    gyldig = np.isfinite(alder)
    k[gyldig] = np.round(alder[gyldig] * TRIN).astype(np.int32) + 1
    assert k.max() < 32000
    forskel = np.diff(k, axis=1, prepend=0).astype('<i2')
    hoved = b'HBA1' + struct.pack('<HH', nx, ny)
    ud = Path(__file__).with_name('havbundsalder.bin')
    ud.write_bytes(gzip.compress(hoved + forskel.tobytes(), 9, mtime=0))

    # Nøgletal til LICENSE og test (arealvægtet med cos(breddegrad)).
    bredde = np.radians(89.9 - .2 * np.arange(ny))
    vaegt = np.repeat(np.cos(bredde)[:, None], nx, 1)
    a = (k[gyldig] - 1) / TRIN
    w = vaegt[gyldig]
    print(f'{ud.name}: {ud.stat().st_size // 1000} kB, {nx} × {ny} celler, '
          f'{gyldig.mean():.1%} af cellerne har en alder')
    print(f'arealvægtet middelalder {np.average(a, weights=w):.1f} mio. år, '
          f'median {np.median(a):.1f}, ældste {a.max():.1f}')
    for graense in (20, 66, 145, 200):
        print(f'  andel af havbunden yngre end {graense} mio. år: {w[a < graense].sum() / w.sum():.0%}')


if __name__ == '__main__':
    main()
