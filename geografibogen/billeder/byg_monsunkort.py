#!/usr/bin/env python3
"""Tegner de regionale kort til kapitlet «Regnbæltet og monsunen» i Geografibogen.

Kort over Sydasien og Østafrika i juli og januar med
  - nedbør i mm pr. måned (GPCP v2.3, klimanormal 1991–2020, 2,5° × 2,5°, NOAA CDR;
    samme fil som atlassets nedbørslag: atlas/data/nedboer.bin, se nedboer.LICENSE),
  - landegrænser fra Natural Earth 1:50m via world-atlas (public domain; atlas/data/countries-50m.json),
  - vindpile og ITK som SKITSER (ikke målinger): hovedretningerne i monsunen og passaten,
    og ITK-linjen lagt ud fra nedbørsmaksimum i GPCP-data (se kontrol nederst).

Tegnet til Geografibogen; ligner opbygningen i de store verdenskort i lærebøger
(nedbørsklasser, vindsystemer, ITK, solens zenit), men er ikke kopieret fra dem.

Kør (system-python har numpy og matplotlib):
    /usr/bin/python3 geografibogen/billeder/byg_monsunkort.py
Skriver monsunkort-juli.svg og monsunkort-januar.svg ved siden af scriptet.
"""
import gzip, json, math, struct
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import PathPatch, FancyArrowPatch, Rectangle
from matplotlib.path import Path as MPath

HER = Path(__file__).resolve().parent
DATA = HER.parent.parent / "atlas" / "data"
LON0, LON1, LAT0, LAT1 = 22.0, 112.0, -27.0, 42.0
LATM = 12.0  # bredde til x-skalaen (cos)

plt.rcParams["svg.fonttype"] = "none"
plt.rcParams["font.family"] = "sans-serif"
plt.rcParams["font.sans-serif"] = ["Arial", "Helvetica", "DejaVu Sans"]

# ---------- nedbør ----------
def laes_nedboer():
    b = gzip.decompress((DATA / "nedboer.bin").read_bytes())
    assert b[:4] == b"NBR1"
    nx, ny, nm = struct.unpack("<HHH", b[4:10])
    a = np.frombuffer(b[10:], dtype="<u2").reshape(nm, ny, nx) / 10.0
    lat = 88.75 - 2.5 * np.arange(ny)
    lon = -178.75 + 2.5 * np.arange(nx)
    return a, lat, lon

def opskaler(felt, lat, lon, trin=0.5):
    """Bilineær interpolation til et finere net (kun til tegning)."""
    la = np.arange(LAT0 - 3, LAT1 + 3 + 1e-9, trin)
    lo = np.arange(LON0 - 3, LON1 + 3 + 1e-9, trin)
    latr, fr = lat[::-1], felt[::-1]            # stigende bredde
    tmp = np.array([np.interp(lo, lon, r) for r in fr])             # langs længde
    ud = np.array([np.interp(la, latr, tmp[:, j]) for j in range(tmp.shape[1])]).T
    return lo, la, ud

KLASSER = [0, 25, 50, 100, 200, 300, 400, 2000]
FARVER = ["#fff6c4", "#f8dcba", "#f3c3a4", "#b6def2", "#93aadf", "#7b78c6", "#5a3f9d"]
ETIKET = ["under 25", "25–50", "50–100", "100–200", "200–300", "300–400", "over 400"]

# ---------- land ----------
def dekod_topo(topo):
    sx, sy = topo["transform"]["scale"]; tx, ty = topo["transform"]["translate"]
    buer = []
    for bue in topo["arcs"]:
        x = y = 0; pts = []
        for dx, dy in bue:
            x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
        buer.append(pts)
    def ring(idx):
        pts = []
        for i in idx:
            p = buer[i] if i >= 0 else buer[~i][::-1]
            pts.extend(p if not pts else p[1:])
        return pts
    return ring

def lande():
    topo = json.loads((DATA / "countries-50m.json").read_text())
    ring = dekod_topo(topo)
    ud = []
    for g in topo["objects"]["countries"]["geometries"]:
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        ringe = [[ring(r) for r in poly] for poly in polys]
        ud.append((g["properties"]["name"], ringe))
    return ud

def klip(ring, x0, x1, y0, y1):
    """Sutherland–Hodgman: klip en ring til et rektangel, så SVG'en kun rummer det synlige."""
    def gaa(pts, inde, skaer):
        ud = []
        for i, b in enumerate(pts):
            a = pts[i - 1]
            if inde(b):
                if not inde(a):
                    ud.append(skaer(a, b))
                ud.append(b)
            elif inde(a):
                ud.append(skaer(a, b))
        return ud
    def sx(xv):
        return lambda a, b: (xv, a[1] + (b[1] - a[1]) * (xv - a[0]) / (b[0] - a[0]))
    def sy(yv):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (yv - a[1]) / (b[1] - a[1]), yv)
    for inde, sk in [(lambda p: p[0] >= x0, sx(x0)), (lambda p: p[0] <= x1, sx(x1)),
                     (lambda p: p[1] >= y0, sy(y0)), (lambda p: p[1] <= y1, sy(y1))]:
        if not ring:
            break
        ring = gaa(ring, inde, sk)
    return ring


def tynd(ring, d=0.12):
    if not ring:
        return []
    ud = [ring[0]]
    for p in ring[1:]:
        if abs(p[0] - ud[-1][0]) >= d or abs(p[1] - ud[-1][1]) >= d:
            ud.append(p)
    return ud


def sti(ringe_liste):
    verts, koder = [], []
    for poly in ringe_liste:
        for r in poly:
            if len(r) < 3:
                continue
            r = tynd(klip(r, LON0, LON1, LAT0, LAT1))
            if len(r) < 3:
                continue
            r = [(round(x, 2), round(y, 2)) for x, y in r]
            areal = abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2
            udstr = max(max(q[0] for q in r) - min(q[0] for q in r), max(q[1] for q in r) - min(q[1] for q in r))
            if areal < 0.02 or (udstr > 5 and areal / udstr ** 2 < 2e-3):
                continue          # klipning af ringe, der krydser 180°, kan give streger uden areal
            verts += r + [r[0]]
            koder += [MPath.MOVETO] + [MPath.LINETO] * (len(r) - 1) + [MPath.CLOSEPOLY]
    return MPath(verts, koder) if verts else None

# ---------- skitser ----------
PASSAT, MONSUN, ITKFARVE = "#d9531e", "#1d7fc0", "#b0148a"
ITK = {
    "juli": [(20, 11), (30, 11), (40, 12), (48, 13), (56, 16), (65, 21), (75, 25), (88, 26), (98, 22), (112, 18)],
    "januar": [(20, -14), (32, -12), (40, -8), (48, -4), (60, -6), (75, -6), (90, -5), (112, -3)],
}
# (fra, til, krumning, farve)
PILE = {
    "juli": [
        ((84, -22), (70, -15), 0.0, PASSAT), ((70, -24), (57, -18), 0.0, PASSAT), ((104, -20), (90, -14), 0.0, PASSAT),
        ((48, -9), (52, 2), -0.25, MONSUN), ((54, 3), (66, 12), -0.15, MONSUN),
        ((62, 1), (72, 10), -0.1, MONSUN), ((78, 4), (86, 13), -0.1, MONSUN),
        ((86, 8), (90, 19), -0.05, MONSUN), ((96, 7), (101, 16), -0.1, MONSUN),
    ],
    "januar": [
        ((82, 21), (78, 12), 0.1, MONSUN), ((95, 24), (89, 14), 0.1, MONSUN), ((66, 23), (62, 14), 0.1, MONSUN),
        ((100, 18), (96, 8), 0.1, MONSUN), ((62, 14), (55, 5), 0.1, MONSUN), ((72, 12), (64, 3), 0.1, MONSUN),
        ((80, -16), (66, -10), 0.0, PASSAT), ((104, -16), (90, -11), 0.0, PASSAT),
    ],
}
STEDER = [("Dhaka", 90.4, 23.8, 1.3, 1.0, "left"), ("Mumbai", 72.9, 19.1, -1.3, -0.4, "right"),
          ("Mogadishu", 45.3, 2.0, 1.4, -2.3, "left"), ("Addis Abeba", 38.7, 9.0, -1.3, -0.6, "right")]
LANDENAVNE = [("INDIEN", 78, 22), ("KINA", 100, 34), ("ETIOPIEN", 38.5, 6.5), ("SOMALIA", 47.8, 5.4),
              ("MYANMAR", 97.2, 19.4), ("KENYA", 38, 0.3)]
FOKUS = {"Bangladesh", "Somalia"}


def tegn(maaned_idx, navn, titel, undertitel, zenit_lat, zenit_tekst):
    a, lat, lon = laes_nedboer()
    lo, la, felt = opskaler(a[maaned_idx], lat, lon)
    L = lande()
    fig = plt.figure(figsize=(10.4, 6.0), dpi=100)
    ax = fig.add_axes([0.005, 0.01, 0.745, 0.88])
    ax.set_xlim(LON0, LON1); ax.set_ylim(LAT0, LAT1)
    ax.set_aspect(1 / math.cos(math.radians(LATM)))
    ax.set_facecolor("#e3f0f7")
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_color("#8aa5b3"); s.set_linewidth(1)

    # land: samlet sti til klipning
    alle = [r for _, ringe in L for r in ringe]
    landsti = sti(alle)
    landpatch = PathPatch(landsti, transform=ax.transData, fc="#fff6c4", ec="none")
    ax.add_patch(landpatch)
    # sæt hav ud af felten (med en celles margen), så SVG'en ikke rummer konturer over havet
    gx, gy = np.meshgrid(lo, la)
    paa_land = landsti.contains_points(np.column_stack([gx.ravel(), gy.ravel()]), radius=-0.0).reshape(gx.shape)
    n = paa_land.copy()
    for dj, di in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)]:
        n |= np.roll(np.roll(paa_land, dj, 0), di, 1)
    felt = np.ma.masked_where(~n, felt)
    cs = ax.contourf(lo, la, felt, levels=KLASSER, colors=FARVER, extend="neither", zorder=2)
    cs.set_clip_path(PathPatch(landsti, transform=ax.transData))
    # landegrænser
    for nav, ringe in L:
        p = sti(ringe)
        if p is None:
            continue
        ax.add_patch(PathPatch(p, fc="none", ec="#4a4a44" if nav in FOKUS else "#7d7d74",
                               lw=1.0 if nav in FOKUS else 0.5, zorder=3))
    # gitterlinjer, ækvator og vendekredse
    for br, tekst in [(0, "Ækvator"), (23.4, "Krebsens vendekreds"), (-23.4, "Stenbukkens vendekreds")]:
        ax.plot([LON0, LON1], [br, br], color="#3c3c36", lw=0.9, ls=(0, (6, 4)), zorder=4)
        ax.text(LON0 + 1, br + 0.7, tekst, fontsize=8.5, color="#3c3c36", zorder=6, va="bottom")
    for lg in range(30, 111, 20):
        ax.text(lg, LAT0 + 0.6, f"{lg}° Ø", fontsize=8, color="#506a76", ha="center", zorder=6)
    # solen i zenit
    ax.plot([LON1 - 5], [zenit_lat], "o", ms=14, mfc="#ffc107", mec="#e59a00", mew=1.5, zorder=7, clip_on=True)
    # ITK
    x = np.array([p[0] for p in ITK[navn]], float); y = np.array([p[1] for p in ITK[navn]], float)
    xf = np.linspace(x[0], x[-1], 200); yf = np.interp(xf, x, y)
    k = np.ones(15) / 15; yp = np.pad(yf, 7, mode="edge"); yf = np.convolve(yp, k, mode="valid")
    ax.plot(xf, yf, color=ITKFARVE, lw=3.2, ls=(0, (1.2, 1.4)), zorder=5, solid_capstyle="butt")
    # vindpile
    for fra, til, rad, farve in PILE[navn]:
        ax.add_patch(FancyArrowPatch(fra, til, arrowstyle="-|>", mutation_scale=20, lw=3.2, color=farve,
                                     connectionstyle=f"arc3,rad={rad}", zorder=6, shrinkA=0, shrinkB=0))
    # navne
    for t, lx, ly in LANDENAVNE:
        ax.text(lx, ly, t, fontsize=8.5, color="#4a4a44", ha="center", va="center", zorder=6,
                bbox=dict(boxstyle="round,pad=0.1", fc="white", ec="none", alpha=0.55))
    for t, lx, ly, dx, dy, ha in STEDER:
        ax.plot([lx], [ly], "o", ms=5, mfc="white", mec="#1b1b18", mew=1.4, zorder=8)
        ax.text(lx + dx, ly + dy, t, fontsize=10, color="#1b1b18", zorder=8, fontweight="bold", ha=ha,
                bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="none", alpha=0.8))

    # titel
    fig.text(0.012, 0.955, titel, fontsize=20, fontweight="bold", color="#1b1b18", va="center")
    fig.text(0.012, 0.915, undertitel, fontsize=11.5, color="#4f5a4f", va="center")

    # signaturforklaring (højre)
    lg = fig.add_axes([0.76, 0.01, 0.235, 0.88]); lg.set_xlim(0, 1); lg.set_ylim(0, 1); lg.axis("off")
    lg.text(0, 0.975, "Månedlig nedbør i mm", fontsize=11, fontweight="bold", va="top")
    for i, (fv, et) in enumerate(zip(FARVER, ETIKET)):
        yy = 0.915 - i * 0.052
        lg.add_patch(Rectangle((0, yy - 0.036), 0.15, 0.04, fc=fv, ec="#7d7d74", lw=.6))
        lg.text(0.21, yy - 0.016, et, fontsize=10, va="center")
    lg.text(0, 0.50, "Vind og ITK (skitse)", fontsize=11, fontweight="bold", va="top")
    for i, (fv, et) in enumerate([(PASSAT, "Passat"), (MONSUN, "Monsun")]):
        yy = 0.445 - i * 0.052
        lg.add_patch(FancyArrowPatch((0.0, yy), (0.17, yy), arrowstyle="-|>", mutation_scale=16, lw=3, color=fv))
        lg.text(0.21, yy, et, fontsize=10, va="center")
    lg.plot([0, 0.17], [0.337, 0.337], color=ITKFARVE, lw=3.2, ls=(0, (1.2, 1.4)))
    lg.text(0.21, 0.337, "ITK", fontsize=10, va="center")
    lg.plot([0.085], [0.285], "o", ms=13, mfc="#ffc107", mec="#e59a00", mew=1.5)
    lg.text(0.21, 0.275, zenit_tekst, fontsize=9.5, va="center", linespacing=1.25)
    lg.text(0, 0.21, "ITK: den intertropiske\nkonvergenszone, hvor\npassaterne mødes. Luften\nstiger, og regnen falder.",
            fontsize=8.8, color="#4f5a4f", va="top", linespacing=1.35)
    lg.text(0, 0.085, "Nedbør: GPCP v2.3, NOAA,\ngennemsnit 1991–2020.\nGrænser: Natural Earth.\nVinde og ITK er skitser.",
            fontsize=8, color="#6a756a", va="top", linespacing=1.35)

    ud = HER / f"monsunkort-{navn}.svg"
    fig.savefig(ud, format="svg", metadata={"Date": None, "Creator": "byg_monsunkort.py"})
    plt.close(fig)
    # gør SVG'en responsiv (ingen fast pt-størrelse)
    t = ud.read_text(encoding="utf-8")
    import re
    t = re.sub(r'<svg([^>]*?) width="[^"]+" height="[^"]+"', r"<svg\1", t, count=1)
    t = re.sub(r"(\d+\.\d{2})\d+", r"\1", t)   # færre decimaler i koordinaterne
    ud.write_text(t, encoding="utf-8")
    print("skrev", ud.name, ud.stat().st_size // 1024, "kB")


if __name__ == "__main__":
    tegn(6, "juli", "Nedbør i juli", "Sommer på den nordlige halvkugle", 23.4, "Solen lodret over\nKrebsens vendekreds\n21. juni")
    tegn(0, "januar", "Nedbør i januar", "Vinter på den nordlige halvkugle", -23.4, "Solen lodret over\nStenbukkens vendekreds\n21. december")
