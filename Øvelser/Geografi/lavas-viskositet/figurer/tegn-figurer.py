#!/usr/bin/env python3
"""Tegner de to figurer til «Lavas viskositet» som SVG.

    python3 tegn-figurer.py        → opstilling.svg og vulkaner.svg

Tegnet fra bunden i samme stil som bjergarters-densitet/figurer/ — originalens
engelske illustrationer er ikke genbrugt.
"""
import math
from pathlib import Path

HER = Path(__file__).parent
FONT = 'font-family="Carlito,Calibri,Helvetica,Arial,sans-serif"'
INK, GRAA, BLAA, ROED = '#26332B', '#6B7A66', '#1F5F8B', '#A8402C'
TRAE, PAPIR, BAKKE = '#D9C39A', '#FFFFFF', '#E7E2D6'
VANDF, OLIE, SAEBE, SIRUP = '#9CC7E0', '#E8C75A', '#8FC98A', '#B8743A'


def tekst(x, y, s, size=12, fill=INK, anchor='start', weight=None):
    w = f' font-weight="{weight}"' if weight else ''
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'  <text x="{x:g}" y="{y:g}" {FONT} font-size="{size}"{w} fill="{fill}"{a}>{s}</text>'


def pil(x1, y1, x2, y2, farve=INK, bredde=1.4, marker='pil', begge=False):
    start = f' marker-start="url(#{marker})"' if begge else ''
    return (f'  <path d="M{x1:g} {y1:g} L{x2:g} {y2:g}" stroke="{farve}" stroke-width="{bredde}"'
            f'{start} marker-end="url(#{marker})"/>')


def defs(prefix):
    return (f'  <defs>\n    <marker id="{prefix}-pil" viewBox="0 0 12 12" refX="7" refY="6" markerWidth="4.5" '
            f'markerHeight="4.5" orient="auto-start-reverse"><path d="M1,1 L11,6 L1,11 z" fill="{INK}"/></marker>\n  </defs>')


def sti(punkter):
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in punkter)


# ------------------------------------------------------------- opstilling.svg
def opstilling():
    ud = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" width="640" height="300" role="img" '
        'aria-label="Opstillingen set fra siden og oppefra: et skråt skærebræt med papir, støttet af en træklods, '
        'står i en bakke, og væskerne løber fra startlinjen ved 0 cm mod målstregen ved 25 cm">',
        '  <title>Opstillingen: skråt bræt med papir, startlinje og målstreg</title>',
        '  <desc>Til venstre ses opstillingen fra siden. Skærebrættet står skråt med den øverste ende hvilende på en '
        'træklods, og den nederste ende står i en bakke med køkkenrulle. Papiret er tapet fast på brættet. Til højre '
        'ses papiret oppefra med startlinjen 0 cm øverst og målstregen 25 cm længere nede. Fire væsker er kommet på ved '
        'startlinjen, og de er nået forskellig afstand ned ad papiret.</desc>',
        defs('o'),
    ]
    P = 'o-pil'
    # --- set fra siden
    ud.append(tekst(20, 22, '1 · Set fra siden', 13, weight=700))
    bund = 240
    ud.append(f'  <path d="M30 {bund - 24} L40 {bund} H300 L310 {bund - 24}" fill="{BAKKE}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')
    ud.append(tekst(170, bund + 18, 'bakke med køkkenrulle', 12, GRAA, 'middle'))
    ud.append(f'  <rect x="214" y="120" width="70" height="{bund - 120}" fill="{TRAE}" stroke="{INK}" stroke-width="2"/>')
    ud.append(tekst(249, 184, 'klods', 12, anchor='middle'))
    # brættet: fra (60, bund-4) til (270, 110)
    x1, y1, x2, y2 = 58, bund - 4, 272, 112
    vink = math.atan2(y1 - y2, x2 - x1)
    nx, ny = math.sin(vink) * 9, math.cos(vink) * 9
    ud.append(f'  <path d="M{x1} {y1} L{x2} {y2} L{x2 + nx:.1f} {y2 + ny:.1f} L{x1 + nx:.1f} {y1 + ny:.1f} Z" '
              f'fill="{TRAE}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M{x1 + 14} {y1 - 8.5:.1f} L{x2 - 10} {y2 + 5.5:.1f}" stroke="{GRAA}" stroke-width="3"/>')
    ud.append(tekst(30, 100, 'papir, tapet på skærebrættet', 12))
    ud.append(f'  <path d="M60 106 L100 200" stroke="{INK}" stroke-width="1"/>')
    # dråbe ved start
    ud.append(f'  <ellipse cx="238" cy="134" rx="9" ry="4" fill="{SIRUP}" stroke="{INK}" stroke-width="1" transform="rotate(-31 238 134)"/>')
    ud.append(tekst(236, 104, 'start', 12, ROED, 'middle', 700))
    ud.append(pil(206, 136, 160, 163, BLAA, 2.2, P))
    ud.append(tekst(200, 124, 'væsken løber ned', 12, BLAA, 'end'))

    # --- papiret oppefra
    ud.append(tekst(360, 22, '2 · Papiret set oppefra', 13, weight=700))
    px, py, pw, ph = 380, 40, 230, 240
    ud.append(f'  <rect x="{px - 12}" y="{py - 8}" width="{pw + 24}" height="{ph + 16}" rx="6" fill="{TRAE}" stroke="{INK}" stroke-width="2"/>')
    ud.append(f'  <rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="{PAPIR}" stroke="{INK}" stroke-width="1.4"/>')
    for tx in (px + 10, px + pw - 40):
        ud.append(f'  <rect x="{tx}" y="{py - 6}" width="30" height="12" fill="#F4EFC8" opacity="0.9"/>')
    start, maal = py + 30, py + 210
    ud.append(f'  <path d="M{px + 8} {start} H{px + pw - 8}" stroke="{INK}" stroke-width="1.6"/>')
    ud.append(f'  <path d="M{px + 8} {maal} H{px + pw - 8}" stroke="{ROED}" stroke-width="1.6"/>')
    ud.append(tekst(px + 12, start - 6, '0 cm · start', 11))
    ud.append(tekst(px + 12, maal + 16, '25 cm · mål', 11, ROED))
    # fire spor
    for i, (farve, laengde, navn) in enumerate(((VANDF, 190, 'vand'), (OLIE, 120, 'olie'),
                                               (SAEBE, 80, 'sæbe'), (SIRUP, 36, 'sirup'))):
        cx = px + 38 + i * 52
        top = start - 4
        ud.append(f'  <path d="M{cx - 8} {top} Q{cx - 7} {top + laengde * 0.7} {cx} {top + laengde} '
                  f'Q{cx + 7} {top + laengde * 0.7} {cx + 8} {top} Z" fill="{farve}" stroke="{INK}" stroke-width="1"/>')
        if laengde < 150:
            ud.append(tekst(cx, top + laengde + 16, navn, 11, anchor='middle'))
        else:
            ud.append(tekst(cx + 12, top + laengde / 2, navn, 11))
    ud.append('</svg>')
    (HER / 'opstilling.svg').write_text('\n'.join(ud) + '\n', encoding='utf-8')


# --------------------------------------------------------------- vulkaner.svg
def vulkaner():
    ud = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 250" width="640" height="250" role="img" '
        'aria-label="To vulkaner i profil: en bred, flad skjoldvulkan med svage skråninger og en høj, stejl keglevulkan">',
        '  <title>To vulkantyper: skjoldvulkan og keglevulkan</title>',
        '  <desc>Til venstre en skjoldvulkan som Mauna Loa på Hawaii: meget bred og flad med svage skråninger. '
        'Til højre en keglevulkan (stratovulkan) som Mount St. Helens i USA: smal og høj med stejle skråninger. '
        'Skitsen er ikke målfast.</desc>',
        defs('v'),
    ]
    jord = 210
    # skjoldvulkan
    sk = [(x, jord - 46 * max(0.0, 1 - abs(x - 180) / 160) ** 1.15) for x in range(20, 341, 4)]
    ud.append(f'  <path d="{sti(sk)} Z" fill="#8C6A4E" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M170 {jord - 45} h20" stroke="{ROED}" stroke-width="3"/>')
    # keglevulkan
    kg = []
    for x in range(400, 621, 2):
        u = abs(x - 510) / 110
        kg.append((x, jord - 150 * (1 - u) ** 1.35 if u < 1 else jord))
    kg = [(x, max(y, jord - 142)) for x, y in kg]     # krateret
    ud.append(f'  <path d="{sti(kg)} Z" fill="#9A8F86" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M500 {jord - 142} h20" stroke="{ROED}" stroke-width="3"/>')
    ud.append(f'  <path d="M14 {jord} H626" stroke="{INK}" stroke-width="2"/>')
    ud.append(tekst(180, 110, 'A · Skjoldvulkan', 13, weight=700, anchor='middle'))
    ud.append(tekst(180, 126, 'fx Mauna Loa, Hawaii', 12, GRAA, 'middle'))
    ud.append(tekst(510, 22, 'B · Keglevulkan (stratovulkan)', 13, weight=700, anchor='middle'))
    ud.append(tekst(510, 38, 'fx Mount St. Helens, USA', 12, GRAA, 'middle'))
    ud.append(tekst(626, jord + 20, 'skitse — ikke målfast', 10, GRAA, 'end'))
    ud.append('</svg>')
    (HER / 'vulkaner.svg').write_text('\n'.join(ud) + '\n', encoding='utf-8')


if __name__ == '__main__':
    opstilling()
    vulkaner()
