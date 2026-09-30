#!/usr/bin/env python3
"""Tegner de to figurer til «Tsunamibølgers hastighed» som SVG.

    python3 tegn-figurer.py        → tsunami.svg og opstilling.svg

Figurerne er tegnet fra bunden i samme stil som bjergarters-densitet/figurer/.
Bølgeformen i tsunami.svg er regnet ud: bølgelængden følger √d (som farten), og
højden vokser ind mod kysten. Skitsen er ikke målfast.
"""
import math
from pathlib import Path

HER = Path(__file__).parent
FONT = 'font-family="Carlito,Calibri,Helvetica,Arial,sans-serif"'
INK, VAND, VANDKANT = '#26332B', '#C3DAE6', '#7FA8BC'
BLAA, ROED, GRAA = '#1F5F8B', '#A8402C', '#6B7A66'
JORD, LAND = '#E4D6B8', '#D9C39A'


def tekst(x, y, s, size=12, fill=INK, anchor='start', weight=None):
    w = f' font-weight="{weight}"' if weight else ''
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'  <text x="{x:g}" y="{y:g}" {FONT} font-size="{size}"{w} fill="{fill}"{a}>{s}</text>'


def pil(x1, y1, x2, y2, farve=INK, bredde=2, marker='pil', begge=False):
    start = f' marker-start="url(#{marker})"' if begge else ''
    return (f'  <path d="M{x1:g} {y1:g} L{x2:g} {y2:g}" stroke="{farve}" stroke-width="{bredde}"'
            f'{start} marker-end="url(#{marker})"/>')


def markoerer(prefix):
    ud = []
    for navn, farve in (('pil', INK), ('bpil', BLAA), ('rpil', ROED)):
        ud.append(f'    <marker id="{prefix}-{navn}" viewBox="0 0 12 12" refX="7" refY="6" markerWidth="4.5" '
                  f'markerHeight="4.5" orient="auto-start-reverse"><path d="M1,1 L11,6 L1,11 z" fill="{farve}"/></marker>')
    return '  <defs>\n' + '\n'.join(ud) + '\n  </defs>'


def sti(punkter):
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in punkter)


# ---------------------------------------------------------------- tsunami.svg
def tsunami():
    ud = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 430" width="640" height="430" role="img" '
        'aria-label="Skitse i to trin: et jordskælv løfter havbunden og hele vandsøjlen over den, og bølgen bliver '
        'langsommere, kortere og højere, når den når lavt vand ved kysten">',
        '  <title>Sådan opstår en tsunami, og sådan ændrer den sig mod kysten</title>',
        '  <desc>Øverst: ved et jordskælv løftes en del af havbunden langs en forkastning. Hele vandsøjlen over den '
        'løftes med, og vandoverfladen får en lav bule, der løber ud til begge sider som en bølge. Nederst: bølgen '
        'bevæger sig fra dybhavet ind over kontinentalsoklen mod kysten. På dybt vand er den hurtig, lang og lav. '
        'Når vanddybden bliver lille, bliver den langsommere, bølgelængden bliver kortere, og bølgen bliver højere.</desc>',
        markoerer('t'),
    ]
    P = lambda n: f't-{n}'

    # --- trin 1: havbunden løftes
    ud.append(tekst(20, 22, '1 · Et jordskælv løfter havbunden — og hele vandsøjlen over den', 13, weight=700))
    flade = 72
    bule = [(x, flade - 16 * math.exp(-((x - 420) / 70) ** 2)) for x in range(20, 621, 5)]
    bund = [(20, 150), (320, 150), (320, 126), (500, 126), (560, 150), (620, 150)]
    ud.append(f'  <path d="{sti(bule)} L620 150 L560 150 L500 126 L320 126 L320 150 L20 150 Z" fill="{VAND}"/>')
    ud.append(f'  <path d="{sti(bule)}" fill="none" stroke="{VANDKANT}" stroke-width="1.6"/>')
    ud.append(f'  <path d="M20 {flade} H620" stroke="{VANDKANT}" stroke-width="1" stroke-dasharray="4 4"/>')
    ud.append(f'  <path d="{sti(bund)} L620 186 L20 186 Z" fill="{JORD}" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M320 150 L500 150 L560 150" stroke="{INK}" stroke-width="1.2" stroke-dasharray="5 4" fill="none"/>')
    ud.append(f'  <path d="M320 126 L306 186" stroke="{ROED}" stroke-width="2.2"/>')
    # epicenter
    ud.append(f'  <circle cx="312" cy="170" r="5" fill="{ROED}"/>')
    ud.append(f'  <circle cx="312" cy="170" r="10" fill="none" stroke="{ROED}" stroke-width="1.4"/>')
    ud.append(tekst(296, 176, 'jordskælv', 12, ROED, 'end'))
    ud.append(tekst(566, 170, 'havbunden før', 11, GRAA, 'middle'))
    ud.append(f'  <path d="M540 162 L520 152" stroke="{GRAA}" stroke-width="1"/>')
    for x in (370, 420, 470):
        ud.append(pil(x, 120, x, 82, BLAA, 3, P('bpil')))
    ud.append(tekst(482, 108, 'løftes', 12, BLAA))
    ud.append(pil(330, 46, 262, 46, BLAA, 2.4, P('bpil')))
    ud.append(pil(510, 46, 578, 46, BLAA, 2.4, P('bpil')))
    ud.append(tekst(420, 40, 'bølgen løber ud til begge sider', 12, BLAA, 'middle'))
    ud.append(tekst(24, 142, 'hav', 12, GRAA))

    # --- trin 2: bølgen nærmer sig kysten
    oy = 200
    ud.append(tekst(20, oy + 22, '2 · På lavt vand bliver bølgen langsommere, kortere og højere', 13, weight=700))
    s0 = oy + 74                          # havoverflade i hvile

    # soklen: fra ca. 20 px dybde ved x=450 til ca. 6 px ved x=560
    def dybde(x):
        if x <= 300: return 136.0
        if x <= 450: return 136.0 - (x - 300) / 150 * 116
        return max(20.0 - (x - 450) / 110 * 14, 6.0)

    # bølgen: fase = ∫ 2π/λ dx med λ ∝ √d; højden vokser ind mod kysten (overdrevet)
    punkter, fase, x = [], 0.0, 20.0
    while x <= 566:
        d = dybde(x)
        lam = 150 * math.sqrt(d / 136)
        amp = 7 * (136 / d) ** 0.5
        # kun ét bølgetog: dæmp forreste og bageste ende
        punkter.append((x, s0 - amp * max(0.0, math.sin(fase)) ** 1.6))
        fase += 2 * math.pi / lam * 1.0
        x += 1.0
    havbund = [(x, s0 + dybde(x)) for x in range(20, 567, 2)]
    kyst = [(566, s0 + 6), (600, s0 - 12), (620, s0 - 16)]
    vand = punkter + [(566, s0 + 6)] + havbund[::-1]
    ud.append(f'  <path d="{sti(vand)} Z" fill="{VAND}"/>')
    ud.append(f'  <path d="{sti(punkter)}" fill="none" stroke="{VANDKANT}" stroke-width="1.6"/>')
    ud.append(f'  <path d="M20 {s0} H566" stroke="{VANDKANT}" stroke-width="1" stroke-dasharray="4 4"/>')
    ud.append(f'  <path d="{sti(havbund + kyst)} L620 {oy + 226} L20 {oy + 226} Z" fill="{JORD}" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>')
    # huse på land
    for hx in (590, 606):
        hy = s0 - 12 - (hx - 566) / 54 * 4 + 6
        ud.append(f'  <path d="M{hx - 6} {hy - 4} v-8 l6 -6 l6 6 v8 z" fill="#FFFFFF" stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"/>')
    ud.append(pil(40, oy + 44, 150, oy + 44, INK, 2, P('pil')))
    ud.append(tekst(40, oy + 38, 'bølgen bevæger sig mod land', 12))
    ud.append(pil(110, s0 + 6, 110, s0 + 132, INK, 1.6, P('pil'), begge=True))
    ud.append(tekst(118, s0 + 64, 'dybhav, d ≈ 4000 m', 12))
    ud.append(tekst(118, s0 + 80, 'hurtig · lang og lav', 12, BLAA))
    ud.append(tekst(470, s0 - 50, 'lavt vand, d ≈ 10 m', 12, anchor='middle'))
    ud.append(tekst(470, s0 - 34, 'langsom · kort og høj', 12, BLAA, 'middle'))
    ud.append(tekst(300, s0 + 58, 'kontinentalskråning', 11, GRAA, 'start'))
    ud.append(tekst(620, oy + 222, 'skitse — ikke målfast', 10, GRAA, 'end'))
    ud.append('</svg>')
    (HER / 'tsunami.svg').write_text('\n'.join(ud) + '\n', encoding='utf-8')


# ------------------------------------------------------------- opstilling.svg
def opstilling():
    ud = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400" role="img" '
        'aria-label="Opstillingen i to trin: karret løftes i den ene ende, og når det sættes ned, løber en bølge '
        'frem og tilbage mellem enderne, mens man tager tid på fem banelængder">',
        '  <title>Opstillingen: vandkar, der løftes og sættes ned</title>',
        '  <desc>Øverst står karret med den venstre ende A løftet ca. 5 cm på en klods. Vandet samler sig i den højre '
        'ende B. Nederst er karret sat ned igen. En bølge starter i ende B og løber mod A, bliver kastet tilbage, og '
        'sådan fortsætter den. Karrets længde L er én banelængde, og vanddybden d måles med tommestokken. Fem pile '
        'viser de fem banelængder, man tager tid på: B til A, A til B, B til A, A til B og B til A.</desc>',
        markoerer('o'),
    ]
    P = lambda n: f'o-{n}'

    # --- trin 1: karret løftes
    ud.append(tekst(20, 22, '1 · Løft ende A ca. 5 cm, og vent, til vandet står stille', 13, weight=700))
    bord = 150
    x0, x1, loeft, h = 90, 560, 24, 46
    yb = lambda x: bord - loeft + (x - x0) / (x1 - x0) * loeft     # karrets bund
    niveau = bord - 12
    xv = x0 + (niveau - (bord - loeft)) / loeft * (x1 - x0)
    ud.append(f'  <path d="M{xv:.1f} {niveau} L{x1} {niveau} L{x1} {bord} Z" fill="{VAND}"/>')
    ud.append(f'  <path d="M{xv:.1f} {niveau} H{x1}" stroke="{VANDKANT}" stroke-width="1.4"/>')
    ud.append(f'  <path d="M{x0} {yb(x0) - h} L{x0} {yb(x0)} L{x1} {yb(x1)} L{x1} {yb(x1) - h}" fill="none" '
              f'stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>')
    ud.append(f'  <rect x="{x0 - 4}" y="{yb(x0) + 1:.1f}" width="44" height="{bord - yb(x0) - 1:.1f}" fill="{LAND}" stroke="{INK}" stroke-width="1.6"/>')
    ud.append(f'  <path d="M40 {bord} H600" stroke="{INK}" stroke-width="2.4"/>')
    ud.append(pil(70, yb(x0) + 2, 70, bord - 2, INK, 1.4, P('pil'), begge=True))
    ud.append(tekst(62, yb(x0) + 16, 'ca. 5 cm', 12, anchor='end'))
    ud.append(tekst(x0, yb(x0) - h - 8, 'A', 14, weight=700, anchor='middle'))
    ud.append(tekst(x1, yb(x1) - h - 8, 'B', 14, weight=700, anchor='middle'))
    ud.append(tekst(330, bord + 20, 'vandet samler sig i ende B', 12, GRAA, 'middle'))

    # --- trin 2: karret sat ned
    oy = 186
    ud.append(tekst(20, oy + 22, '2 · Sæt karret ned — tag tid, mens bølgen løber fem banelængder', 13, weight=700))
    bund = oy + 108
    top = bund - h
    s = bund - 14
    bolge = [(x, s - 9 * math.exp(-((x - 470) / 26) ** 2)) for x in range(x0, x1 + 1, 2)]
    ud.append(f'  <path d="{sti(bolge)} L{x1} {bund} L{x0} {bund} Z" fill="{VAND}"/>')
    ud.append(f'  <path d="{sti(bolge)}" fill="none" stroke="{VANDKANT}" stroke-width="1.6"/>')
    ud.append(f'  <path d="M{x0} {top} V{bund} H{x1} V{top}" fill="none" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M40 {bund} H600" stroke="{INK}" stroke-width="2.4"/>')
    ud.append(pil(452, s - 20, 400, s - 20, BLAA, 2.4, P('bpil')))
    ud.append(tekst(460, s - 30, 'bølgen', 12, BLAA))
    ud.append(pil(x1 - 24, s + 1, x1 - 24, bund - 1, INK, 1.4, P('pil'), begge=True))
    ud.append(tekst(x1 - 32, s + 11, 'd', 13, weight=700, anchor='end'))
    ud.append(tekst(x0, top - 8, 'A', 14, weight=700, anchor='middle'))
    ud.append(tekst(x1, top - 8, 'B', 14, weight=700, anchor='middle'))
    ud.append(pil(x0 + 2, bund + 16, x1 - 2, bund + 16, INK, 1.4, P('pil'), begge=True))
    ud.append(f'  <rect x="262" y="{bund + 8}" width="136" height="16" fill="#FFFFFF"/>')
    ud.append(tekst(330, bund + 20, 'L = 1 banelængde', 12, anchor='middle'))
    # de fem banelængder
    for i in range(5):
        y = bund + 44 + i * 13
        venstre = (i % 2 == 0)            # 1, 3, 5: fra B mod A
        a, b = (x1 - 4, x0 + 4) if venstre else (x0 + 4, x1 - 4)
        ud.append(pil(a, y, b, y, BLAA if i < 4 else ROED, 1.8, P('bpil' if i < 4 else 'rpil')))
        ud.append(tekst(x1 + 14 if venstre else x0 - 14, y + 4, str(i + 1), 12, BLAA if i < 4 else ROED,
                        'start' if venstre else 'end', 700))
    ud.append(tekst(x0 - 10, bund + 44 + 4 * 13 + 4, 'stop', 12, ROED, 'end', 700))
    ud.append(tekst(x1 + 30, bund + 48, 'start', 12, BLAA, 'start', 700))
    ud.append('</svg>')
    (HER / 'opstilling.svg').write_text('\n'.join(ud) + '\n', encoding='utf-8')


if __name__ == '__main__':
    tsunami()
    opstilling()
