#!/usr/bin/env python3
"""Danner datagrundlaget til Island-kortet (#49, trin 2 «Zoom»).

Kilder (licenser og kontrolsummer i islandskort.LICENSE):
  * Terræn og havbund: NOAA NCEI, ETOPO 2022 15 Arc-Second Global Relief
    Model (overflade inkl. jøkler), doi:10.25921/fd45-gt74, hentet via ERDDAP.
  * Centralvulkaner, kalderaer og sprækkesværme: Náttúrufræðistofnun,
    NI_J600v Jarðfræðikort af Íslandi – Höggun 1:600.000, lag
    ni_j600v_hoggun_eldstodvakerfi_li (CC BY 4.0), hentet via NÍ's WFS.
  * Navne, placering og seneste udbrud for de navngivne vulkaner:
    Global Volcanism Program, Smithsonian Institution, Volcanoes of the World.

Brug (kræver numpy og Pillow, fx i et venv):
    python3 atlas/island/data/islandskort.py <cachemappe>

Rådata hentes til cachemappen (springes over, hvis de findes) og skrives
ikke ind i repoet. Ud kommer, i samme mappe som scriptet:
  islandskort-relief.jpg   skyggelagt relief i kortets projektion
  islandskort-hoejde.bin   højde/dybde i hele meter (int16, little-endian)
  islandskort.json         projektion, grænser, vektorlag og vulkannavne

Projektionen er D3's sfæriske geoConicConformal med standardparallellerne
64,25° og 65,75° N og midtmeridianen 19° V (som ISN93). Rasteret er dannet
ved at regne hver pixel tilbage til længde/bredde og interpolere bilineært
i ETOPO-gitteret; vektorerne projiceres i browseren med den samme formel.
"""
import csv, hashlib, json, math, sys, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image

HER = Path(__file__).resolve().parent

ETOPO = ('https://coastwatch.pfeg.noaa.gov/erddap/griddap/ETOPO_2022_v1_15s.csv0'
         '?z%5B(61.6):2:(68.8)%5D%5B(-33):4:(-5)%5D')
NI = ('https://gis.natt.is/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature'
      '&typeNames=ni:ni_j600v_hoggun_eldstodvakerfi_li&outputFormat=application/json&srsName=EPSG:4326')
GVP = ('https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?service=WFS&version=1.0.0'
       '&request=GetFeature&typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes'
       '&outputFormat=application/json&CQL_FILTER=Country=%27Iceland%27')

# Projektion (skal svare til kort.js).
PARALLELLER = (64.25, 65.75)
MIDTMERIDIAN = -19.0
# Kortudsnittet: Island med Reykjanesryggen mod sydvest og Kolbeinseyryggen mod nord.
UDSNIT_LON = (-29.4, -8.6)
UDSNIT_LAT = (62.75, 67.45)
BREDDE = 2000           # reliefbilledets bredde i pixel
HOEJDE_TRIN = 3         # højdegitteret er hver 3. pixel af billedet

# Navngivne vulkaner: GVP-navn → visningsnavn (islandsk stavemåde) og prioritet
# (1 vises altid, 2 når der er plads, 3 kun på store skærme).
NAVNE = {
    'Hekla': ('Hekla', 1), 'Katla': ('Katla', 1), 'Grimsvotn': ('Grímsvötn', 1),
    'Bardarbunga': ('Bárðarbunga', 1), 'Askja': ('Askja', 2), 'Krafla': ('Krafla', 1),
    'Eyjafjallajokull': ('Eyjafjallajökull', 2), 'Oraefajokull': ('Öræfajökull', 2),
    'Snaefellsjokull': ('Snæfellsjökull', 2), 'Fagradalsfjall': ('Fagradalsfjall', 1),
    'Vestmannaeyjar': ('Vestmannaeyjar', 3), 'Hengill': ('Hengill', 3),
    'Kverkfjoll': ('Kverkfjöll', 3), 'Torfajokull': ('Torfajökull', 3),
}


def hent(url, fil):
    if not fil.exists():
        print('henter', url, file=sys.stderr)
        with urllib.request.urlopen(url, timeout=600) as svar:
            fil.write_bytes(svar.read())
    return fil


def sha(fil):
    return hashlib.sha256(fil.read_bytes()).hexdigest()


# --- D3's conicConformalRaw (sfærisk), enhed = jordradius ---
def _tany(y):
    return np.tan((math.pi / 2 + y) / 2)

Y0, Y1 = (math.radians(p) for p in PARALLELLER)
N = math.log(math.cos(Y0) / math.cos(Y1)) / math.log(_tany(Y1) / _tany(Y0))
F = math.cos(Y0) * _tany(Y0) ** N / N


def frem(lon, lat):
    """Længde/bredde i grader → skærmkoordinat ved scale 1, translate 0 (y nedad)."""
    lam = np.radians(np.asarray(lon) - MIDTMERIDIAN)
    phi = np.radians(np.asarray(lat))
    r = F / _tany(phi) ** N
    return r * np.sin(N * lam), -(F - r * np.cos(N * lam))


def tilbage(X, Y):
    x, y = X, -Y
    fy = F - y
    r = np.sign(N) * np.sqrt(x * x + fy * fy)
    lam = np.arctan2(x, np.abs(fy)) * np.sign(fy)
    phi = 2 * np.arctan((F / r) ** (1 / N)) - math.pi / 2
    return np.degrees(lam / N) + MIDTMERIDIAN, np.degrees(phi)


def etopo(fil):
    data = np.loadtxt(fil, delimiter=',', dtype=np.float64)
    lats, lons = np.unique(data[:, 0]), np.unique(data[:, 1])
    z = data[:, 2].reshape(len(lats), len(lons))
    return lats, lons, z


def bilineaer(lats, lons, z, lon, lat):
    fi = (lat - lats[0]) / (lats[1] - lats[0])
    fj = (lon - lons[0]) / (lons[1] - lons[0])
    assert fi.min() >= 0 and fj.min() >= 0 and fi.max() <= len(lats) - 1 and fj.max() <= len(lons) - 1, 'udsnit uden for ETOPO-gitteret'
    i0 = np.clip(np.floor(fi).astype(int), 0, len(lats) - 2)
    j0 = np.clip(np.floor(fj).astype(int), 0, len(lons) - 2)
    a, b = fi - i0, fj - j0
    return ((1 - a) * (1 - b) * z[i0, j0] + (1 - a) * b * z[i0, j0 + 1]
            + a * (1 - b) * z[i0 + 1, j0] + a * b * z[i0 + 1, j0 + 1])


def rampe(v, stop):
    ks, fs = zip(*stop)
    fs = np.array([[int(f[i:i + 2], 16) for i in (1, 3, 5)] for f in fs], float)
    return np.stack([np.interp(v, ks, fs[:, k]) for k in range(3)], axis=-1)


# Farveskalaer (skal svare til signaturforklaringen i kort.js).
HAV = [(0, '#dceff7'), (200, '#c3e2f1'), (500, '#a6d0e8'), (1000, '#86b9db'),
       (1500, '#6ba3cc'), (2000, '#558cba'), (3000, '#3d6c99')]
LAND = [(0, '#bccb9c'), (200, '#d2d6a4'), (500, '#dcc996'), (800, '#cfae82'),
        (1200, '#b89f88'), (1600, '#d9d3cd'), (2100, '#f7f5f1')]


def relief(z, pixel_km):
    gy, gx = np.gradient(z, pixel_km * 1000)
    land = z > 0
    # Bjergene overdrives lidt, havbunden mere, så ryggene kan ses.
    ex = np.where(land, 1.6, 6.0)
    gx, gy = gx * ex, gy * ex
    # Lys fra nordvest. Billedets x vokser mod øst og y mod syd; (lx, ly) peger mod lyset.
    az, alt = math.radians(315), math.radians(45)
    lx, ly = math.cos(alt) * math.sin(az), -math.cos(alt) * math.cos(az)
    nz = 1 / np.sqrt(1 + gx * gx + gy * gy)
    hs = np.clip((-gx * lx - gy * ly + math.sin(alt)) * nz, 0, 1)
    farve = np.where(land[..., None], rampe(z, LAND), rampe(-z, HAV))
    lys = np.where(land, .45 + .75 * hs, .78 + .3 * hs)[..., None]
    rgb = np.clip(farve * lys, 0, 255)
    # Kystlinje: landpixel med havnabo.
    kyst = land & ~(np.roll(land, 1, 0) & np.roll(land, -1, 0) & np.roll(land, 1, 1) & np.roll(land, -1, 1))
    rgb[kyst] = rgb[kyst] * .35 + np.array([23, 33, 31]) * .65
    return rgb.astype(np.uint8)


def rdp(punkter, tol):
    """Douglas–Peucker i et lokalt fladt system (km)."""
    if len(punkter) < 3:
        return punkter
    p = np.array(punkter)
    xy = np.c_[p[:, 0] * 111.32 * math.cos(math.radians(65)), p[:, 1] * 110.6]
    behold = np.zeros(len(p), bool)
    behold[[0, -1]] = True
    stak = [(0, len(p) - 1)]
    while stak:
        a, b = stak.pop()
        if b - a < 2:
            continue
        d = xy[b] - xy[a]
        l = np.hypot(*d) or 1e-9
        v = xy[a + 1:b] - xy[a]
        afst = np.abs(d[0] * v[:, 1] - d[1] * v[:, 0]) / l
        i = int(np.argmax(afst))
        if afst[i] > tol:
            behold[a + 1 + i] = True
            stak += [(a, a + 1 + i), (a + 1 + i, b)]
    return [punkter[i] for i in np.flatnonzero(behold)]


def vektorer(fil):
    """Centralvulkaner (meld), kalderaer (eld08) og sprækkesværme (rein),
    hver som aktiv (eldSprunguvirkni 1) eller uddød (2), med rift-/flankebælte."""
    d = json.loads(fil.read_text(encoding='utf-8'))
    navn = {'meld': 'centralvulkan', 'eld08': 'kaldera', 'rein': 'svaerm'}
    baelte = {'rekb': 'rift', 'jadb': 'flanke', None: None}
    ud, punkter_ind, punkter_ud = [], 0, 0
    for f in d['features']:
        p = f['properties']
        assert p['gerdGosgiga'] in navn and p['eldSprunguvirkni'] in (1, 2), p
        linjer = []
        for l in f['geometry']['coordinates']:
            punkter_ind += len(l)
            l = rdp([[round(x, 4), round(y, 4)] for x, y in l], .25)
            l = [[round(x, 3), round(y, 3)] for x, y in l]
            l = [q for i, q in enumerate(l) if i == 0 or q != l[i - 1]]
            punkter_ud += len(l)
            linjer.append(l)
        ud.append({'type': 'Feature', 'properties': {
            'slags': navn[p['gerdGosgiga']], 'aktiv': p['eldSprunguvirkni'] == 1,
            'baelte': baelte[p['jardhnik']]},
            'geometry': {'type': 'MultiLineString', 'coordinates': linjer}})
    print(f'NÍ: {len(ud)} objekter, {punkter_ind} → {punkter_ud} punkter', file=sys.stderr)
    return ud


def vulkannavne(fil):
    d = json.loads(fil.read_text(encoding='utf-8'))
    ud = []
    for f in d['features']:
        p = f['properties']
        if p['Volcano_Name'] in NAVNE:
            vis, prio = NAVNE[p['Volcano_Name']]
            aar = p['Last_Eruption_Year']
            ud.append({'navn': vis, 'prioritet': prio, 'lon': round(p['Longitude'], 3), 'lat': round(p['Latitude'], 3),
                       'senest': aar, 'gvp': p['Volcano_Number']})
    assert len(ud) == len(NAVNE), sorted(set(NAVNE) - {f['properties']['Volcano_Name'] for f in d['features']})
    return sorted(ud, key=lambda v: (v['prioritet'], v['navn']))


def main(cache):
    cache = Path(cache)
    cache.mkdir(parents=True, exist_ok=True)
    fe, fn, fg = hent(ETOPO, cache / 'etopo.csv'), hent(NI, cache / 'ni_eldstodvakerfi.json'), hent(GVP, cache / 'gvp.json')
    for f in (fe, fn, fg):
        print(f'SHA-256 {f.name}: {sha(f)}', file=sys.stderr)

    # Udsnittets grænser i projektionen: rektanglet om den fortættede lon/lat-ramme.
    t = np.linspace(0, 1, 200)
    (l0, l1), (b0, b1) = UDSNIT_LON, UDSNIT_LAT
    rlon = np.r_[l0 + (l1 - l0) * t, np.full_like(t, l1), l1 - (l1 - l0) * t, np.full_like(t, l0)]
    rlat = np.r_[np.full_like(t, b0), b0 + (b1 - b0) * t, np.full_like(t, b1), b1 - (b1 - b0) * t]
    X, Y = frem(rlon, rlat)
    X0, X1, Y0_, Y1_ = X.min(), X.max(), Y.min(), Y.max()
    W = BREDDE
    H = round(W * (Y1_ - Y0_) / (X1 - X0))
    px = (X1 - X0) / W
    xs = X0 + (np.arange(W) + .5) * px
    ys = Y0_ + (np.arange(H) + .5) * px
    gx, gy = np.meshgrid(xs, ys)
    lon, lat = tilbage(gx, gy)
    lats, lons, z = etopo(fe)
    zz = bilineaer(lats, lons, z, lon, lat)
    pixel_km = px * 6371.0
    print(f'billede {W}×{H}, {pixel_km:.3f} km/pixel; højde {zz.min():.0f}…{zz.max():.0f} m', file=sys.stderr)

    Image.fromarray(relief(zz, pixel_km)).save(HER / 'islandskort-relief.jpg', quality=84, optimize=True, progressive=True)
    hz = np.round(zz[HOEJDE_TRIN // 2::HOEJDE_TRIN, HOEJDE_TRIN // 2::HOEJDE_TRIN]).astype('<i2')
    (HER / 'islandskort-hoejde.bin').write_bytes(hz.tobytes())

    meta = {
        'projektion': {'type': 'geoConicConformal', 'paralleller': list(PARALLELLER), 'rotation': [-MIDTMERIDIAN, 0]},
        'graenser': [round(v, 7) for v in (X0, Y0_, X1, Y1_)],
        'relief': {'fil': 'islandskort-relief.jpg', 'bredde': W, 'hoejde': H},
        'hoejde': {'fil': 'islandskort-hoejde.bin', 'bredde': hz.shape[1], 'hoejde': hz.shape[0],
                   'trin': HOEJDE_TRIN, 'enhed': 'm', 'type': 'int16le'},
        'pixel_km': round(pixel_km, 4),
        'farver': {'hav': HAV, 'land': LAND},
        'vulkansystemer': vektorer(fn),
        'navne': vulkannavne(fg),
    }
    (HER / 'islandskort.json').write_text(json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    for f in ('islandskort-relief.jpg', 'islandskort-hoejde.bin', 'islandskort.json'):
        print(f'{f}: {(HER / f).stat().st_size // 1024} KB', file=sys.stderr)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/islandskort-cache')
