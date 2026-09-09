import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.path import Path
import numpy as np

# ---- palette (print-friendly, works in greyscale too) ----
INK = "#26332b"        # near-black green-grey for line art / text
GROUND = "#e4ecd9"     # very light moss green fill
GROUND_LINE = "#4a6741" # muted forest green
POLE_RED = "#b5423a"
POLE_WHITE = "#f7f5ef"
POLE_OUTLINE = "#26332b"

fig, ax = plt.subplots(figsize=(9.0, 3.4), dpi=300)

# ---- undulating terrain profile (a small mound / "vold") ----
x = np.linspace(0, 10, 400)
# base gentle slope + a mound bump
y = (0.35
     + 0.25 * np.sin((x - 1.5) / 10 * np.pi)
     + 1.35 * np.exp(-((x - 4.6) ** 2) / 3.2)
     - 0.15 * np.exp(-((x - 8.3) ** 2) / 1.4))
y = np.clip(y, 0.15, None)

ax.fill_between(x, 0, y, color=GROUND, zorder=1)
ax.plot(x, y, color=GROUND_LINE, linewidth=2.4, zorder=2, solid_capstyle="round")

# ground hatching baseline (subtle) to read as "grass/plæne"
ax.axhline(0, color=GROUND_LINE, linewidth=1.0, alpha=0.5, zorder=1)

# ---- stake positions along the profile (uneven, realistic) ----
stake_x = [0.6, 2.6, 4.6, 6.2, 7.8, 9.3]
def ground_y(xv):
    return (0.35
            + 0.25 * np.sin((xv - 1.5) / 10 * np.pi)
            + 1.35 * np.exp(-((xv - 4.6) ** 2) / 3.2)
            - 0.15 * np.exp(-((xv - 8.3) ** 2) / 1.4))

pole_h = 1.05
pole_w = 0.085

def draw_pole(ax, xc, base_y, height, n_stripes=6):
    seg_h = height / n_stripes
    for i in range(n_stripes):
        color = POLE_RED if i % 2 == 0 else POLE_WHITE
        rect = mpatches.Rectangle((xc - pole_w / 2, base_y + i * seg_h), pole_w, seg_h,
                                   facecolor=color, edgecolor=POLE_OUTLINE, linewidth=0.7, zorder=5)
        ax.add_patch(rect)
    # outline around whole pole
    outline = mpatches.Rectangle((xc - pole_w / 2, base_y), pole_w, height,
                                  facecolor="none", edgecolor=POLE_OUTLINE, linewidth=1.1, zorder=6)
    ax.add_patch(outline)

for i, sx in enumerate(stake_x, start=1):
    by = max(ground_y(sx), 0.15)
    draw_pole(ax, sx, by, pole_h)
    # number tag above pole
    ax.plot(sx, by + pole_h + 0.16, marker="o", markersize=15.5, markerfacecolor="white",
            markeredgecolor=INK, markeredgewidth=1.3, zorder=7)
    ax.text(sx, by + pole_h + 0.16, str(i), ha="center", va="center",
             fontsize=10.5, fontweight="bold", color=INK, zorder=8)

# ---- measuring direction arrow ----
arrow_y = pole_h + max(ground_y(np.array(stake_x))) + 0.62
ax.annotate("", xy=(9.6, arrow_y), xytext=(0.4, arrow_y),
            arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.8, mutation_scale=18))
ax.text((9.6 + 0.4) / 2, arrow_y + 0.14, "Måleretning", ha="center", va="bottom",
        fontsize=11, color=INK, fontstyle="italic")

ax.set_xlim(-0.3, 10.1)
ax.set_ylim(-0.35, arrow_y + 0.55)
ax.axis("off")
fig.tight_layout(pad=0.25)
fig.savefig("/tmp/build/figur1.png", dpi=300, transparent=True)
print("saved figur1")
