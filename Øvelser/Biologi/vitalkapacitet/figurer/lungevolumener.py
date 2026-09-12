# Lungevolumener — spirogram til øvelsesvejledningen "Vitalkapacitet".
# Kør:  python3 lungevolumener.py     (kræver matplotlib)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

INK   = "#17211F"   # blæk
BAND  = "#DCEDF7"   # lys blå flade bag kurven
CURVE = "#E8336D"   # pink — selve åndedrætskurven
ARROW = "#0E86C8"   # blå — pile og målebetegnelser

# volumener i liter
RV, ERV, TV, IRV = 1.2, 1.0, 0.5, 3.0
hvile_bund = RV + ERV            # 2,2 L — niveauet efter en almindelig udånding
hvile_top  = hvile_bund + TV     # 2,7 L
maks_top   = hvile_top + IRV     # 5,7 L — maksimal indånding
maks_bund  = RV                  # 1,2 L — maksimal udånding

X_SLUT = 13.0                    # kurven fylder kun venstre del af feltet
X_MAX  = 23.5

t = np.linspace(0, X_SLUT, 1600)
y = hvile_bund + TV/2 - TV/2*np.cos(2*np.pi*t/2.0)      # roligt åndedræt

# én maksimal ind- og udånding lægges ind midt i forløbet
t0, t1 = 6.0, 10.0
m = (t >= t0) & (t <= t1)
u = (t[m] - t0) / (t1 - t0)
y[m] = np.where(
    u < 0.35,
    hvile_bund + (maks_top - hvile_bund) * (1 - np.cos(np.pi*u/0.35))/2,
    np.where(
        u < 0.70,
        maks_bund + (maks_top - maks_bund) * (1 + np.cos(np.pi*(u-0.35)/0.35))/2,
        hvile_bund + (maks_bund - hvile_bund) * (1 + np.cos(np.pi*(u-0.70)/0.30))/2,
    ),
)

fig, ax = plt.subplots(figsize=(9.0, 4.6), dpi=300)
ax.set_facecolor("white")

# de fire volumenbånd
graenser = [0, RV, RV+ERV, RV+ERV+TV, maks_top]
navne = ["Residualluft", "Ekspiratorisk\nreserveluft", "Åndingsluft",
         "Inspiratorisk\nreserveluft"]
ax.axhspan(0, maks_top, color=BAND, zorder=0)
for g in graenser[1:]:
    ax.plot([0, X_MAX], [g, g], color="white", lw=2.2, zorder=2)

ax.plot(t, y, color=CURVE, lw=2.4, zorder=4, solid_capstyle="round")

def lodret_pil(x, y0, y1, tekst, y_tekst):
    ax.annotate("", xy=(x, y1), xytext=(x, y0),
                arrowprops=dict(arrowstyle="<->", color=ARROW, lw=1.8,
                                shrinkA=0, shrinkB=0), zorder=5)
    ax.text(x+0.3, y_tekst, tekst, color=ARROW, fontsize=11, fontweight="bold",
            ha="left", va="center", zorder=6, linespacing=1.2)

lodret_pil(14.0, maks_bund, maks_top, "Vital-\nkapacitet", 3.45)
lodret_pil(17.4, 0, maks_top, "Total lunge-\nkapacitet", 1.25)

# navne på de fire volumener yderst til højre
for lo, hi, navn in zip(graenser[:-1], graenser[1:], navne):
    ax.text(X_MAX+0.7, (lo+hi)/2, navn, color=INK, fontsize=10.5,
            ha="left", va="center", linespacing=1.2, clip_on=False)
    ax.plot([X_MAX, X_MAX+0.5], [(lo+hi)/2]*2, color=INK, lw=1.0, clip_on=False)

ax.set_xlim(0, X_MAX)
ax.set_ylim(0, 6.2)
ax.set_yticks(np.arange(0, 6.1, 1))
ax.set_ylabel("Lungevolumen (L)", color=INK, fontsize=11.5)
ax.set_xticks([])
ax.set_xlabel("Tid", color=INK, fontsize=11.5, loc="right")
ax.tick_params(colors=INK, labelsize=10.5)
for s in ("top", "right"):
    ax.spines[s].set_visible(False)
for s in ("left", "bottom"):
    ax.spines[s].set_color(INK)
    ax.spines[s].set_linewidth(1.2)

fig.subplots_adjust(left=0.08, right=0.72, top=0.97, bottom=0.11)
fig.savefig("lungevolumener.png", dpi=300, facecolor="white")
print("skrev lungevolumener.png")
