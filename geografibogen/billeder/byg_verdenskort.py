#!/usr/bin/env python3
"""Tegner verdenskort med nedbør og ITK i juli og december til Geografibogen (Robinson-projektion).

Nedbør: GPCP v2.3 (NOAA CDR), klimanormal 1991–2020, 2,5° × 2,5° (atlas/data/nedboer.bin).
Landegrænser: Natural Earth 1:50m via world-atlas (atlas/data/countries-50m.json).
ITK og vindpile er SKITSER. ITK-linjen er lagt langs nedbørsmaksimet i GPCP-data
(kontrolleret pr. 15° længde) og glattet; vindpilene viser hovedmønstrene (passat, vestenvind, monsun).

Kør:  /usr/bin/python3 geografibogen/billeder/byg_verdenskort.py
Skriver verdenskort-juli.svg og verdenskort-december.svg ved siden af scriptet.
"""
import math, re, sys
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import PathPatch, FancyArrowPatch, Rectangle, Polygon
from matplotlib.path import Path as MPath

sys.path.insert(0, str(Path(__file__).resolve().parent))
import byg_monsunkort as B

HER = Path(__file__).resolve().parent
LAT_S, LAT_N = -60.0, 84.0

# ---------- Robinson ----------
_L = np.arange(0, 95, 5)
_X = np.array([1.0000, .9986, .9954, .9900, .9822, .9730, .9600, .9427, .9216, .8962, .8679, .8350, .7986, .7597, .7186, .6732, .6213, .5722, .5322])
_Y = np.array([0.0000, .0620, .1240, .1860, .2480, .3100, .3720, .4340, .4958, .5571, .6176, .6769, .7346, .7903, .8435, .8936, .9394, .9761, 1.0000])

def rob(lon, lat):
    lon = np.asarray(lon, float); lat = np.asarray(lat, float)
    a = np.abs(lat)
    x = 0.8487 * np.interp(a, _L, _X) * np.radians(lon)
    y = 1.3523 * np.interp(a, _L, _Y) * np.sign(lat)
    return x, y

def pakk_ud(r):
    """Ringe, der krydser 180°, hopper fra +180 til -180. Gør længden sammenhængende, og returnér de stykker,
    der ligger i [-180, 180] (selve ringen og kopier forskudt 360°)."""
    u = [r[0]]
    for lo, la in r[1:]:
        k = round((u[-1][0] - lo) / 360.0)
        u.append((lo + 360.0 * k, la))
    return [[(lo + sh, la) for lo, la in u] for sh in (-360, 0, 360)]


def sti_verden(ringe_liste):
    verts, koder = [], []
    stykker = [st for poly in ringe_liste for r in poly if len(r) >= 3 for st in pakk_ud(r)]
    for poly in [[st] for st in stykker]:
        for r in poly:
            r = B.tynd(B.klip(r, -180, 180, LAT_S, LAT_N), 0.4)
            if len(r) < 3:
                continue
            areal = abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2
            ud = max(max(q[0] for q in r) - min(q[0] for q in r), max(q[1] for q in r) - min(q[1] for q in r))
            if areal < 0.05 or (ud > 5 and areal / ud ** 2 < 2e-3):
                continue
            x, y = rob([q[0] for q in r], [q[1] for q in r])
            pts = list(zip(np.round(x, 4), np.round(y, 4)))
            verts += pts + [pts[0]]
            koder += [MPath.MOVETO] + [MPath.LINETO] * (len(pts) - 1) + [MPath.CLOSEPOLY]
    return MPath(verts, koder) if verts else None

# ---------- skitser ----------
ITK = {
    "juli": [(-180, 6), (-160, 6.5), (-140, 8.5), (-120, 9), (-100, 9), (-85, 7), (-70, 6), (-55, 5), (-40, 6), (-25, 8.5),
             (-10, 11), (5, 9), (20, 10), (35, 11), (48, 12), (58, 16), (66, 21), (75, 25), (88, 26), (98, 23), (110, 21),
             (125, 14), (140, 7), (155, 5), (170, 6), (180, 6)],
    "december": [(-180, 6), (-160, 6), (-140, 7), (-120, 8), (-100, 6.5), (-85, 6), (-72, 3), (-65, -3), (-55, -6), (-45, -4),
                 (-35, 2), (-25, 4), (-10, 3.5), (5, 0), (15, -5), (25, -10), (35, -13), (45, -12), (55, -8), (70, -6),
                 (85, -5), (100, -4), (110, -6), (125, -9), (140, -8), (150, -4), (160, 4), (170, 6), (180, 6)],
}
P, M, V = B.PASSAT, B.MONSUN, "#6b6b63"
PASSATER = [((-120, 20), (-142, 12)), ((-150, 24), (-172, 15)), ((-96, 16), (-112, 11)), ((-28, 25), (-46, 16)), ((-60, 22), (-76, 14)),
            ((-100, -17), (-122, -9)), ((-138, -16), (-160, -8)), ((-10, -18), (-28, -8)), ((-38, -24), (-52, -14)),
            ((82, -20), (64, -12)), ((108, -25), (90, -17)), ((148, 22), (132, 13))]
VESTENVINDE = [((-150, 42), (-124, 50)), ((-48, 40), (-22, 49)), ((-10, 50), (14, 55)), ((148, 38), (172, 46)),
               ((-150, -42), (-120, -47)), ((-62, -44), (-34, -50)), ((30, -42), (58, -48)), ((100, -44), (128, -50)), ((158, -45), (178, -50))]
MONSUNER = {
    "juli": [((58, 3), (70, 14)), ((78, 3), (86, 12)), ((88, 7), (91, 19)), ((132, 14), (119, 25)), ((-6, 1), (2, 10)), ((10, 0), (15, 9)), ((100, 8), (104, 17))],
    "december": [((82, 22), (77, 12)), ((96, 24), (89, 14)), ((66, 23), (60, 14)), ((116, 38), (127, 28)), ((132, 36), (141, 27)), ((122, -7), (134, -14))],
}
STEDER = [("København", 12.6, 55.7, 0.04, 0.03), ("Dakar", -17.4, 14.7, -0.05, 0.03), ("Mogadishu", 45.3, 2.0, 0.05, -0.12),
          ("Dhaka", 90.4, 23.8, 0.05, 0.03), ("Manaus", -60.0, -3.1, 0.05, -0.12), ("Jakarta", 106.8, -6.2, -0.05, -0.12)]


def tegn(maaned_idx, navn, titel, undertitel):
    a, lat, lon = B.laes_nedboer()
    glon = np.arange(-180, 180.01, 1.0); glat = np.arange(LAT_S - 2, LAT_N + 0.01, 1.0)
    rows = np.array([np.interp(glon, lon, r, period=360) for r in a[maaned_idx][::-1]])      # (lat stigende, lon)
    felt = np.array([np.interp(glat, lat[::-1], rows[:, j]) for j in range(rows.shape[1])]).T
    gx, gy = np.meshgrid(glon, glat); X, Y = rob(gx, gy)

    L = [(n, r) for n, r in B.lande() if n != "Antarctica"]
    landsti = sti_verden([rr for _, ringe in L for rr in ringe])
    fig = plt.figure(figsize=(10.8, 7.0), dpi=100)
    ax = fig.add_axes([0.01, 0.20, 0.98, 0.66])
    xmax = float(rob(180, 0)[0]); ys = rob(np.full(2, 180), np.array([LAT_S, LAT_N]))[1]
    ax.set_xlim(-xmax - 0.03, xmax + 0.03); ax.set_ylim(ys[0], ys[1]); ax.set_aspect("equal", anchor="C"); ax.axis("off")
    # hav: Robinson-omrids
    la = np.linspace(LAT_S, LAT_N, 80); ex, ey = rob(np.full(80, 180), la)
    ax.add_patch(Polygon(np.column_stack([np.r_[ex, -ex[::-1]], np.r_[ey, ey[::-1]]]), fc="#e3f0f7", ec="#8aa5b3", lw=1.2, zorder=0))
    # gradnet
    for lg in range(-150, 180, 30):
        gla = np.linspace(LAT_S, LAT_N, 60); gxx, gyy = rob(np.full(60, lg), gla)
        ax.plot(gxx, gyy, color="#8aa5b3", lw=0.5, zorder=1)
    for br in (-60, -30, 30, 60):
        gxx, gyy = rob(np.linspace(-180, 180, 100), np.full(100, br)); ax.plot(gxx, gyy, color="#8aa5b3", lw=0.5, zorder=1)
    ax.add_patch(PathPatch(landsti, fc="#fff6c4", ec="none", zorder=1.5))
    # nedbør (kun på land)
    land_mask = landsti.contains_points(np.column_stack([X.ravel(), Y.ravel()])).reshape(X.shape)
    n = land_mask.copy()
    for dj, di in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)]:
        n |= np.roll(np.roll(land_mask, dj, 0), di, 1)
    cs = ax.contourf(X, Y, np.ma.masked_where(~n, felt), levels=B.KLASSER, colors=B.FARVER, zorder=2)
    cs.set_clip_path(PathPatch(landsti, transform=ax.transData))
    for nav, ringe in L:
        p = sti_verden(ringe)
        if p is not None:
            ax.add_patch(PathPatch(p, fc="none", ec="#7d7d74", lw=0.35, zorder=3))
    # ækvator og vendekredse
    for br, tekst in [(0, "Ækvator"), (23.4, "Krebsens vendekreds"), (-23.4, "Stenbukkens vendekreds")]:
        gxx, gyy = rob(np.linspace(-180, 180, 200), np.full(200, br))
        ax.plot(gxx, gyy, color="#3c3c36", lw=0.9, ls=(0, (6, 4)), zorder=4)
        tx, ty = rob(-176, br)
        ax.text(float(tx) + 0.04, float(ty) + 0.03, tekst, fontsize=8, color="#3c3c36", zorder=6)
    # ITK
    pts = np.array(ITK[navn], float)
    lf = np.linspace(-180, 180, 600); bf = np.interp(lf, pts[:, 0], pts[:, 1])
    k = np.ones(17) / 17; bf = np.convolve(np.pad(bf, 8, mode="edge"), k, mode="valid")
    ix, iy = rob(lf, bf)
    ax.plot(ix, iy, color=B.ITKFARVE, lw=3.0, ls=(0, (1.2, 1.4)), zorder=5, solid_capstyle="butt")
    # vind
    def pil(fra, til, farve, rad=0.0, lw=2.6, ms=15):
        fx, fy = rob(*fra); tx, ty = rob(*til)
        ax.add_patch(FancyArrowPatch((fx, fy), (tx, ty), arrowstyle="-|>", mutation_scale=ms, lw=lw, color=farve,
                                     connectionstyle=f"arc3,rad={rad}", zorder=6, shrinkA=0, shrinkB=0))
    for f, t in PASSATER: pil(f, t, P)
    for f, t in VESTENVINDE: pil(f, t, V, 0.08)
    for f, t in MONSUNER[navn]: pil(f, t, M, 0.1, 3.0, 17)
    for t, lx, ly, dx, dy in STEDER:
        px, py = rob(lx, ly)
        ax.plot([px], [py], "o", ms=4.5, mfc="white", mec="#1b1b18", mew=1.2, zorder=8)
        ax.text(float(px) + dx, float(py) + dy, t, fontsize=8.5, fontweight="bold", color="#1b1b18", zorder=8,
                ha="left" if dx > 0 else "right", bbox=dict(boxstyle="round,pad=0.1", fc="white", ec="none", alpha=0.8))
    # titel
    fig.text(0.012, 0.955, titel, fontsize=20, fontweight="bold", color="#1b1b18", va="center")
    fig.text(0.012, 0.915, undertitel, fontsize=11.5, color="#4f5a4f", va="center")
    # signaturforklaring (nederst)
    lg = fig.add_axes([0.01, 0.01, 0.98, 0.18]); lg.set_xlim(0, 100); lg.set_ylim(0, 20); lg.axis("off")
    lg.text(0, 18.5, "Månedlig nedbør i mm", fontsize=10.5, fontweight="bold", va="center")
    for i, (fv, et) in enumerate(zip(B.FARVER, B.ETIKET)):
        x0 = i * 13.2
        lg.add_patch(Rectangle((x0, 10.2), 2.4, 4.4, fc=fv, ec="#7d7d74", lw=.6)); lg.text(x0 + 3.2, 12.4, et, fontsize=9.5, va="center")
    lg.text(0, 5.3, "Vind og ITK (skitse)", fontsize=10.5, fontweight="bold", va="center")
    for x0, (fv, et) in zip((24, 36, 48), [(P, "Passat"), (V, "Vestenvinde"), (M, "Monsun")]):
        lg.add_patch(FancyArrowPatch((x0, 5.3), (x0 + 3.6, 5.3), arrowstyle="-|>", mutation_scale=14, lw=2.6, color=fv))
        lg.text(x0 + 4.6, 5.3, et, fontsize=9.5, va="center")
    lg.plot([62, 66], [5.3, 5.3], color=B.ITKFARVE, lw=3, ls=(0, (1.2, 1.4))); lg.text(67, 5.3, "ITK", fontsize=9.5, va="center")
    lg.text(0, 0.9, "Nedbør: GPCP v2.3, NOAA, gennemsnit 1991–2020. Landegrænser: Natural Earth. Vinde og ITK er skitser.",
            fontsize=8, color="#6a756a", va="center")
    ud = HER / f"verdenskort-{navn}.svg"
    fig.savefig(ud, format="svg", metadata={"Date": None, "Creator": "byg_verdenskort.py"})
    plt.close(fig)
    t = ud.read_text(encoding="utf-8")
    t = re.sub(r'<svg([^>]*?) width="[^"]+" height="[^"]+"', r"<svg\1", t, count=1)
    t = re.sub(r"(\d+\.\d{2})\d+", r"\1", t)
    ud.write_text(t, encoding="utf-8")
    print("skrev", ud.name, ud.stat().st_size // 1024, "kB")


if __name__ == "__main__":
    tegn(6, "juli", "Nedbør og ITK i juli", "Sommer på den nordlige halvkugle, vinter på den sydlige")
    tegn(11, "december", "Nedbør og ITK i december", "Vinter på den nordlige halvkugle, sommer på den sydlige")
