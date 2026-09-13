# Billedplader til øvelsesvejledningen "Oliens migration".
#
# Fotografierne er de originale fra den gamle vejledning
#   SM-DRIVE/forsøgsvejledninger_sm-drive/NATURGEOGRAFI/07 - Oliens migration/
#   Undervisning 2018-2019/FAG - NG/Forløb 3 - Energi/2 Oliens migration/
#   Øvelse Oliens migration 2019 (HB).doc
# hentet ud af Word-filen med
#   soffice --headless --convert-to "html:HTML (StarWriter)" --outdir <mappe> <fil>.doc
#
# Kør:  python3 billedplader.py <mappe med de udpakkede hb2019_html_*-filer>
#       (kræver matplotlib)
import sys, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import numpy as np

INK = "#26332B"     # samme blækfarve som resten af vejledningen
KILDE = sys.argv[1] if len(sys.argv) > 1 else "."

def hent(noegle):
    for f in os.listdir(KILDE):
        if noegle in f and f.startswith("hb2019_html_"):
            return mpimg.imread(os.path.join(KILDE, f))
    raise SystemExit(f"fandt ikke billedet {noegle} i {KILDE}")

def i_format(billede, forhold=4/3):
    """Lægger hvide kanter på, så alle billeder får samme format og dermed
    samme kasse i pladen — ellers står billedteksterne i forskellig højde."""
    h, b = billede.shape[:2]
    if billede.ndim == 2:
        billede = np.dstack([billede]*3)
    if billede.shape[2] == 4:
        billede = billede[:, :, :3]
    if billede.dtype != np.uint8:
        billede = (billede*255).astype(np.uint8) if billede.max() <= 1 else billede.astype(np.uint8)
    hvid = 255
    if b/h < forhold:                      # for smalt — kanter i siderne
        ny_b = int(round(h*forhold))
        pude = np.full((h, (ny_b-b)//2, 3), hvid, dtype=billede.dtype)
        billede = np.hstack([pude, billede, np.full((h, ny_b-b-pude.shape[1], 3), hvid, dtype=billede.dtype)])
    elif b/h > forhold:                    # for bredt — kanter over og under
        ny_h = int(round(b/forhold))
        pude = np.full(((ny_h-h)//2, b, 3), hvid, dtype=billede.dtype)
        billede = np.vstack([pude, billede, np.full((ny_h-h-pude.shape[0], b, 3), hvid, dtype=billede.dtype)])
    return billede

def ramme(ax, billede, titel, beskaer_bund=0.0, forhold=4/3):
    if beskaer_bund:
        billede = billede[: int(billede.shape[0] * (1 - beskaer_bund))]
    ax.imshow(i_format(billede, forhold))
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_color(INK); s.set_linewidth(1.4)
    ax.set_title(titel, color=INK, fontsize=11, pad=6)

# --- plade 1: de otte bjergarts- og sedimentprøver ------------------------
bjergarter = [
    ("f193785d", "1  Strandsand"),
    ("4028da60", "2  Strandsand"),
    ("36da7dc0", "3  Skrivekridt"),
    ("350308f3", "4  Skifer uden olie"),
    ("968ab879", "5  Stensalt"),
    ("f33c6605", "6  Olieholdig skifer"),
    ("43cacc6b", "7  Sandsten"),
    ("dd5f5260", "8  Råolie"),
]
fig, akser = plt.subplots(2, 4, figsize=(9.2, 4.3), dpi=300)
for ax, (noegle, titel) in zip(akser.ravel(), bjergarter):
    ramme(ax, hent(noegle), titel)
fig.subplots_adjust(left=.02, right=.98, top=.93, bottom=.02, wspace=.16, hspace=.22)
# fotografier gemmes som JPEG — som PNG fylder pladen mange megabyte
fig.savefig("bjergarter.jpg", dpi=220, facecolor="white", pil_kwargs={"quality":88})
print("skrev bjergarter.jpg")

# --- plade 2: forsøget i tre trin ----------------------------------------
trin = [
    ("a28f2ed9", "Først madolie"),
    ("5c129d34", "Dernæst sand"),
    ("b12064d1", "Til sidst vand"),
]
fig, akser = plt.subplots(1, 3, figsize=(9.2, 2.3), dpi=300)
for ax, (noegle, titel) in zip(akser, trin):
    # de nederste 12 % er bordkant og kameraets datostempel
    ramme(ax, hent(noegle), titel, beskaer_bund=0.12, forhold=640/422)
fig.subplots_adjust(left=.02, right=.98, top=.92, bottom=.02, wspace=.12)
fig.savefig("forsoget.jpg", dpi=220, facecolor="white", pil_kwargs={"quality":88})
print("skrev forsoget.jpg")
