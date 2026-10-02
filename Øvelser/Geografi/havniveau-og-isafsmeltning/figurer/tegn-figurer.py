#!/usr/bin/env python3
"""Tegner opstillingen til «Havniveau og isafsmeltning» som SVG.

    python3 tegn-figurer.py        → opstilling.svg

Tegnet fra bunden i samme stil som lavas-viskositet/figurer/ — NV-arkets fotos
og klimasystemfiguren fra klimaforandringer.science.ku.dk er ikke genbrugt.
Figuren viser kun opstillingen, ikke resultatet.
"""
from pathlib import Path

HER = Path(__file__).parent
FONT = 'font-family="Carlito,Calibri,Helvetica,Arial,sans-serif"'
INK, GRAA, BLAA, ROED = '#26332B', '#6B7A66', '#1F5F8B', '#A8402C'
VAND, STEN, IS, LYS = '#D9E9F0', '#B9A48C', '#FAFBF9', '#FFE9A8'


def tekst(x, y, s, size=12, fill=INK, anchor='start', weight=None):
    w = f' font-weight="{weight}"' if weight else ''
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'  <text x="{x:g}" y="{y:g}" {FONT} font-size="{size}"{w} fill="{fill}"{a}>{s}</text>'


def isterning(x, y, w=20, h=16):
    return f'  <rect x="{x:g}" y="{y:g}" width="{w}" height="{h}" rx="3" fill="{IS}" stroke="{INK}" stroke-width="1.4"/>'


def kar(x0, bogstav, navn, is_paa_land):
    """Ét kar: 230 bredt, bund ved y=250, vandspejl ved y=196."""
    ud = []
    bund, spejl, b = 250, 196, 230
    ud.append(f'  <rect x="{x0}" y="{spejl}" width="{b}" height="{bund - spejl}" fill="{VAND}"/>')
    ud.append(f'  <path d="M{x0 + 2} {spejl} H{x0 + b - 2}" stroke="#7FA8BC" stroke-width="1.6"/>')
    # kontinentet: to mursten oven på hinanden i venstre side
    for i in range(2):
        ud.append(f'  <rect x="{x0 + 14}" y="{bund - 34 * (i + 1)}" width="96" height="34" fill="{STEN}" '
                  f'stroke="{INK}" stroke-width="1.6"/>')
    top = bund - 68
    if is_paa_land:
        for i, (dx, dy) in enumerate(((0, 0), (24, 0), (48, 0), (72, 0), (12, -16), (38, -16), (62, -16))):
            ud.append(isterning(x0 + 18 + dx, top - 16 + dy))
    else:
        for dx, dy in ((126, -9), (150, -7), (174, -10), (198, -8), (138, -21), (164, -20), (186, -22)):
            ud.append(isterning(x0 + dx - 6, spejl + dy, 19, 15))
    # selve karret
    ud.append(f'  <path d="M{x0} 128 V{bund} H{x0 + b} V128" fill="none" stroke="{INK}" stroke-width="2.2" '
              f'stroke-linejoin="round"/>')
    # lineal ved højre væg
    lx = x0 + b - 12
    ud.append(f'  <rect x="{lx - 4}" y="140" width="8" height="{bund - 140}" fill="#F4EFC8" stroke="{INK}" stroke-width="1"/>')
    for i, y in enumerate(range(bund - 6, 142, -8)):
        ud.append(f'  <path d="M{lx - 4} {y} h{5 if i % 5 else 8}" stroke="{INK}" stroke-width="0.8"/>')
    ud.append(tekst(x0 + b / 2, 290, f'{bogstav} · {navn}', 13, weight=700, anchor='middle'))
    return ud


def opstilling():
    ud = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" width="640" height="300" role="img" '
        'aria-label="To ens kar under en lampe. I kar A ligger isterningerne tørt oven på murstenene, '
        'i kar B flyder de på vandet">',
        '  <title>Opstillingen: is på land og is i havet</title>',
        '  <desc>To gennemsigtige kar står ved siden af hinanden under en lampe. I begge kar står to mursten '
        'som et kontinent, og vandet står lige højt. I kar A ligger isterningerne oven på murstenene, over '
        'vandspejlet, som en gletsjer på land. I kar B flyder isterningerne på vandet ved siden af '
        'murstenene som havis. En lineal er sat op ad hver kars væg, så vandstanden kan aflæses.</desc>',
    ]
    # lampen
    ud.append(f'  <path d="M320 0 V34" stroke="{INK}" stroke-width="2"/>')
    ud.append(f'  <path d="M278 62 L300 34 H340 L362 62 Z" fill="#E6E2D6" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M180 120 L282 64 H358 L460 120 Z" fill="{LYS}" opacity="0.55"/>')
    ud.append(tekst(372, 30, 'lampe, 50–60 W', 12, GRAA))
    ud.extend(kar(60, 'A', 'is på land (gletsjer)', True))
    ud.extend(kar(350, 'B', 'is i havet (havis)', False))
    ud.append(tekst(130, 120, 'mursten = kontinent', 11, GRAA, 'middle'))
    ud.append(f'  <path d="M130 124 L130 176" stroke="{GRAA}" stroke-width="1"/>')
    ud.append(tekst(568, 133, 'lineal', 11, GRAA, 'middle'))
    ud.append('</svg>')
    (HER / 'opstilling.svg').write_text('\n'.join(ud) + '\n', encoding='utf-8')


if __name__ == '__main__':
    opstilling()
