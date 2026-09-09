import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

INK = "#26332b"
GROUND = "#e4ecd9"
GROUND_LINE = "#4a6741"
POLE_RED = "#b5423a"
POLE_WHITE = "#f7f5ef"
POLE_OUTLINE = "#26332b"
STRING = "#1f5f8b"
PLUS = "#3b6e3f"
MINUS = "#a13a2d"

pole_w = 0.075

def draw_pole(ax, xc, base_y, height, n_stripes=5):
    seg_h = height / n_stripes
    for i in range(n_stripes):
        color = POLE_RED if i % 2 == 0 else POLE_WHITE
        rect = mpatches.Rectangle((xc - pole_w / 2, base_y + i * seg_h), pole_w, seg_h,
                                   facecolor=color, edgecolor=POLE_OUTLINE, linewidth=0.7, zorder=5)
        ax.add_patch(rect)
    outline = mpatches.Rectangle((xc - pole_w / 2, base_y), pole_w, height,
                                  facecolor="none", edgecolor=POLE_OUTLINE, linewidth=1.0, zorder=6)
    ax.add_patch(outline)

def panel(ax, base_left, base_right, label_left, label_right, sign, title):
    x_left, x_right = 0.9, 3.9
    pole_h = 1.5

    xs = np.linspace(-0.3, 5.3, 100)
    ys = np.interp(xs, [x_left, x_right], [base_left, base_right])
    ys_full = np.where(xs < x_left, base_left, np.where(xs > x_right, base_right, ys))
    ax.fill_between(xs, -0.55, ys_full, color=GROUND, zorder=1)
    ax.plot(xs, ys_full, color=GROUND_LINE, linewidth=2.2, zorder=2, solid_capstyle="round")

    draw_pole(ax, x_left, base_left, pole_h)
    draw_pole(ax, x_right, base_right, pole_h)
    ax.text(x_left, base_left - 0.16, label_left, ha="center", va="top", fontsize=10.5,
            fontweight="bold", color=INK)
    ax.text(x_right, base_right - 0.16, label_right, ha="center", va="top", fontsize=10.5,
            fontweight="bold", color=INK)

    # string level (horizontal), placed so it is reachable on both poles
    string_y = max(base_left, base_right) + 0.55
    ax.plot([x_left, x_right], [string_y, string_y], color=STRING, linewidth=2.0,
            linestyle=(0, (5, 2)), zorder=7)
    ax.plot((x_left + x_right) / 2, string_y, marker="o", markersize=5, color=STRING, zorder=8)

    # height bracket (snorens hoejde) — only on the left pole, to keep the panel legible
    dx = -0.34
    ax.annotate("", xy=(x_left + dx, string_y), xytext=(x_left + dx, base_left),
                arrowprops=dict(arrowstyle="<->", color=INK, lw=1.1))
    ax.plot([x_left, x_left + dx * 0.8], [base_left, base_left], color=INK, lw=0.8)
    ax.plot([x_left, x_left + dx * 0.8], [string_y, string_y], color=INK, lw=0.8)
    ax.text(x_left + dx - 0.10, (base_left + string_y) / 2, "snorens\nhøjde", ha="right",
            va="center", fontsize=8.6, color=INK, linespacing=1.15)

    # afstand (horizontal distance) at bottom
    dist_y = -0.32
    ax.annotate("", xy=(x_right, dist_y), xytext=(x_left, dist_y),
                arrowprops=dict(arrowstyle="<->", color=INK, lw=1.1))
    ax.plot([x_left, x_left], [dist_y, base_left], color=INK, lw=0.6, linestyle=(0, (1, 2)))
    ax.plot([x_right, x_right], [dist_y, base_right], color=INK, lw=0.6, linestyle=(0, (1, 2)))
    ax.text((x_left + x_right) / 2, dist_y - 0.15, "afstand", ha="center", va="top",
            fontsize=9.5, color=INK, fontstyle="italic")

    # slope-following arrow (visualises direction of change) + sign badge, tucked top-right
    color = PLUS if sign == "+" else MINUS
    badge_x, badge_y = 4.75, max(base_left, base_right) + pole_h * 0.62
    ax.add_patch(mpatches.Circle((badge_x, badge_y), 0.30, facecolor="white",
                                  edgecolor=color, linewidth=1.8, zorder=9))
    ax.text(badge_x, badge_y, sign, ha="center", va="center", fontsize=19,
            fontweight="bold", color=color, zorder=10)

    ax.text((x_left + x_right) / 2, pole_h + max(base_left, base_right) + 0.35, title,
            ha="center", va="bottom", fontsize=10.3, color=INK)

    ax.set_xlim(-0.3, 5.3)
    ax.set_ylim(-0.62, pole_h + max(base_left, base_right) + 0.75)
    ax.axis("off")

fig, axes = plt.subplots(1, 2, figsize=(9.2, 3.05), dpi=300)

panel(axes[0], base_left=0.15, base_right=0.95, label_left="Stok 7", label_right="Stok 8",
      sign="+", title="Terrænet stiger → højdeændring positiv")
panel(axes[1], base_left=0.95, base_right=0.30, label_left="Stok 8", label_right="Stok 9",
      sign="–", title="Terrænet falder → højdeændring negativ")

fig.tight_layout(pad=0.4, w_pad=2.4)
fig.savefig("/tmp/build/figur2.png", dpi=300, transparent=True)
print("saved figur2")
