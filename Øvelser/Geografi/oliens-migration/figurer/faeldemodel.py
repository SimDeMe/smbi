# Fældemodellen — tværsnit af modelkassen til øvelsesvejledningen
# "Oliens migration".
# Kør:  python3 faeldemodel.py     (kræver matplotlib)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

INK       = "#17211F"   # blæk
GROV      = "#F0DCBB"   # groft sand — reservoirbjergarten
GROV_KORN = "#C09A5E"
FIN       = "#FBEFDC"   # fint sand — dæklaget
FIN_KORN  = "#D8C4A2"
LER       = "#A9B8C9"   # ler — seglbjergarten
VAND      = "#C7E6F6"
OLIE      = "#E8336D"   # den farvede olie

# --- modellens geometri (kassen set fra siden) ---------------------------
X0, X1 = 0.25, 9.95          # kassens inderside
Y0, Y1 = 0.20, 5.75
SAND_TOP = 5.00              # sandets overflade
VANDSPEJL = 5.38
LER_TYK = 0.34
LER_VENSTRE, LER_HOEJRE = 2.00, 8.40

def lertop(x):
    """Lerbuens overside — en flad antiklinal med top ved x = 6,0."""
    return 2.35 + 1.55*np.exp(-((x - 6.0)**2)/3.6)

def lerbund(x):
    return lertop(x) - LER_TYK

KONTAKT = 3.00                          # olie-vand-kontakten
INDSPROJT = (3.40, 0.55)                # hvor slangen sprøjter olien ind
SPILD = (LER_HOEJRE, lerbund(LER_HOEJRE))

fig, ax = plt.subplots(figsize=(9.6, 5.8), dpi=300)
ax.set_facecolor("white")

x = np.linspace(X0, X1, 900)

# --- lagene --------------------------------------------------------------
ax.fill_between(x, Y0, lerbund(x), color=GROV, zorder=1)
ax.fill_between(x, lertop(x), SAND_TOP, color=FIN, zorder=1)
# uden for lerbuen fortsætter laggrænsen som en almindelig laggrænse
ude = (x < LER_VENSTRE) | (x > LER_HOEJRE)
ax.fill_between(x, lerbund(x), lertop(x), where=ude, color=FIN, zorder=1)
ax.fill_between([X0, X1], SAND_TOP, VANDSPEJL, color=VAND, zorder=1)

# kornstruktur
rng = np.random.default_rng(7)
px = rng.uniform(X0, X1, 9000)
py = rng.uniform(Y0, SAND_TOP, 9000)
grov = py < lerbund(px)
ax.scatter(px[grov], py[grov], s=2.2, color=GROV_KORN, alpha=.55,
           linewidths=0, zorder=2)
fin = py > lertop(px)
ax.scatter(px[fin], py[fin], s=0.45, color=FIN_KORN, alpha=.75,
           linewidths=0, zorder=2)

# --- seglbjergarten ------------------------------------------------------
xl = np.linspace(LER_VENSTRE, LER_HOEJRE, 500)
ax.fill_between(xl, lerbund(xl), lertop(xl), color=LER, zorder=3)
ax.plot(xl, lertop(xl), color=INK, lw=1.5, zorder=4)
ax.plot(xl, lerbund(xl), color=INK, lw=1.5, zorder=4)
for xe in (LER_VENSTRE, LER_HOEJRE):
    ax.plot([xe, xe], [lerbund(xe), lertop(xe)], color=INK, lw=1.5, zorder=4)

# --- olien i fælden ------------------------------------------------------
xo = np.linspace(LER_VENSTRE, LER_HOEJRE, 600)
i_olie = lerbund(xo) > KONTAKT
ax.fill_between(xo, KONTAKT, lerbund(xo), where=i_olie, color=OLIE,
                alpha=.92, zorder=3)
xk = xo[i_olie]
ax.plot([xk[0], xk[-1]], [KONTAKT, KONTAKT], color=INK, lw=1.4, zorder=4)

# --- migrationsvejen -----------------------------------------------------
# olien stiger lodret op gennem reservoirbjergarten og følger derefter
# seglets underside op mod fældens top
xm = np.linspace(INDSPROJT[0], xk[0], 300)
# et lille knæk ud til siden, så vejen ikke forsvinder bag slangen
vej_x = np.concatenate([[INDSPROJT[0], INDSPROJT[0] + 0.16], xm[xm > INDSPROJT[0] + 0.16]])
vej_y = np.concatenate([[INDSPROJT[1], INDSPROJT[1] + 0.30],
                        lerbund(xm[xm > INDSPROJT[0] + 0.16]) - 0.13])
ax.plot(vej_x, vej_y, color=OLIE, lw=2.6, ls=(0, (5, 3)), zorder=5,
        solid_capstyle="round")
ax.annotate("", xy=(xk[0] + 0.30, lerbund(xk[0] + 0.30) - 0.13),
            xytext=(vej_x[-6], vej_y[-6]),
            arrowprops=dict(arrowstyle="-|>", color=OLIE, lw=2.6,
                            mutation_scale=17), zorder=5)
ax.plot(*INDSPROJT, marker="o", ms=7, color=OLIE, mec=INK, mew=1.2, zorder=6)
ax.text(INDSPROJT[0] + 0.52, 1.55, "Migration", color=OLIE, fontsize=11,
        fontweight="bold", ha="left", va="center", zorder=6)

# --- sprøjte og slange ---------------------------------------------------
sx = INDSPROJT[0]
ax.plot([sx, sx], [INDSPROJT[1], 6.30], color="#566B68", lw=2.4, zorder=4)
ax.add_patch(mpatches.FancyBboxPatch((sx - 0.34, 6.30), 0.68, 0.95,
             boxstyle="round,pad=0.02,rounding_size=0.06",
             facecolor="white", edgecolor=INK, lw=1.6, zorder=7))
ax.add_patch(mpatches.Rectangle((sx - 0.34, 6.30), 0.68, 0.42,
             facecolor=OLIE, alpha=.85, edgecolor="none", zorder=8))
ax.plot([sx - 0.50, sx + 0.50], [7.25, 7.25], color=INK, lw=2.0, zorder=9)
ax.plot([sx, sx], [7.25, 7.62], color=INK, lw=2.0, zorder=9)

# --- kassen --------------------------------------------------------------
ax.plot([X0, X0, X1, X1], [Y1, Y0, Y0, Y1], color=INK, lw=3.0,
        solid_joinstyle="miter", zorder=10)

# --- mærkater ------------------------------------------------------------
def maerkat(tekst, pil, tekstpos, ha):
    ax.annotate(tekst, xy=pil, xytext=tekstpos, ha=ha, va="center",
                fontsize=11, color=INK, linespacing=1.25, zorder=11,
                arrowprops=dict(arrowstyle="-", color=INK, lw=1.0,
                                shrinkA=4, shrinkB=2))

maerkat("Sprøjte med\nfarvet olie", (sx + 0.36, 6.75), (sx + 1.30, 7.00), "left")
maerkat("Dæklag\n(fint sand)", (1.20, 4.35), (-0.55, 4.60), "right")
maerkat("Reservoirbjergart\n(groft sand)", (1.30, 1.30), (-0.55, 1.30), "right")
maerkat("Seglbjergart\n(ler)", (7.78, 2.90), (10.55, 2.95), "left")
maerkat("Fælde — olien\nsamler sig i toppen", (6.00, 3.30), (10.55, 4.35), "left")
maerkat("Olie-vand-kontakt", (4.95, 3.00), (-0.55, 2.85), "right")
maerkat("Spildepunkt", (SPILD[0] - 0.04, SPILD[1] + 0.06), (10.55, 1.45), "left")
ax.text(X0 + 0.15, VANDSPEJL + 0.16, "Vandspejl", fontsize=9.5, color="#2E6E8E",
        ha="left", va="bottom", zorder=11)

ax.set_xlim(-3.6, 13.7)
ax.set_ylim(-0.25, 7.95)
ax.set_aspect("equal")
ax.axis("off")
fig.subplots_adjust(left=0.01, right=0.99, top=0.99, bottom=0.01)
fig.savefig("faeldemodel.png", dpi=300, facecolor="white")
print("skrev faeldemodel.png")
