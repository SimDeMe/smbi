#!/usr/bin/env python3
"""Tegner opstillingen til «Drivhuseffekt i miniature» som SVG.

    python3 tegn-figurer.py        → opstilling.svg

Tegnet fra bunden i samme stil som lavas-viskositet/figurer/. NV-arket har
ingen figur.
"""
from pathlib import Path

HER = Path(__file__).parent
FONT = 'font-family="Carlito,Calibri,Helvetica,Arial,sans-serif"'
INK, GRAA, ROED = '#26332B', '#6B7A66', '#A8402C'
BORD, STOF, LYS, LAMPE = '#D9C39A', '#C7E6F6', '#FFE9A8', '#E6E2D6'


def tekst(x, y, s, size=12, fill=INK, anchor='start', weight=None):
    w = f' font-weight="{weight}"' if weight else ''
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'  <text x="{x:g}" y="{y:g}" {FONT} font-size="{size}"{w} fill="{fill}"{a}>{s}</text>'


def lampe_og_termometer(x0, bord):
    """Arkitektlampe lagt ned på bordet med skærmen mod højre, termometer foran."""
    ud = []
    ud.append(f'  <path d="M{x0 + 40} {bord - 26} L{x0 + 76} {bord - 50} L{x0 + 76} {bord - 4} L{x0 + 40} {bord - 6} Z" '
              f'fill="{LAMPE}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M{x0} {bord - 14} H{x0 + 42}" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>')
    ud.append(f'  <path d="M{x0 + 78} {bord - 48} L{x0 + 150} {bord - 64} V{bord} H{x0 + 78} Z" fill="{LYS}" opacity="0.6"/>')
    # termometer
    tx = x0 + 118
    ud.append(f'  <rect x="{tx}" y="{bord - 60}" width="7" height="52" rx="3.5" fill="#fff" stroke="{INK}" stroke-width="1.4"/>')
    ud.append(f'  <rect x="{tx + 2}" y="{bord - 34}" width="3" height="24" fill="{ROED}"/>')
    ud.append(f'  <circle cx="{tx + 3.5}" cy="{bord - 7}" r="5.5" fill="{ROED}" stroke="{INK}" stroke-width="1.4"/>')
    return ud


def opstilling():
    ud = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 210" width="640" height="210" role="img" '
        'aria-label="To billeder af opstillingen: lampen og termometeret uden viskestykke, og den samme '
        'opstilling dækket af et viskestykke">',
        '  <title>Opstillingen: lampe, termometer og viskestykke</title>',
        '  <desc>Til venstre ligger en arkitektlampe ned på bordet med skærmen vendt mod et termometer, der '
        'ligger lige foran pæren. Til højre er den samme opstilling dækket af et viskestykke, så både lampen '
        'og termometeret er under stoffet. Termometeret må ikke flyttes i løbet af forsøget.</desc>',
    ]
    bord = 170
    for x0, x1 in ((20, 300), (340, 620)):
        ud.append(f'  <rect x="{x0}" y="{bord}" width="{x1 - x0}" height="10" fill="{BORD}" stroke="{INK}" stroke-width="1.6"/>')
    ud.extend(lampe_og_termometer(60, bord))
    ud.append(tekst(160, 30, '1 · Uden viskestykke (0 lag)', 13, weight=700, anchor='middle'))
    ud.append(tekst(80, 82, 'arkitektlampe', 12, GRAA, 'middle'))
    ud.append(tekst(240, 82, 'termometer', 12, GRAA, 'middle'))
    ud.append(f'  <path d="M228 88 L184 112" stroke="{GRAA}" stroke-width="1"/>')

    ud.extend(lampe_og_termometer(380, bord))
    ud.append(f'  <path d="M392 {bord} C392 96 420 86 470 86 C520 86 548 96 548 {bord}" fill="{STOF}" '
              f'fill-opacity="0.85" stroke="{INK}" stroke-width="2"/>')
    for x in range(410, 540, 14):
        ud.append(f'  <path d="M{x} 100 v6" stroke="#7FA8BC" stroke-width="2"/>')
    ud.append(tekst(480, 30, '2 · Dækket af viskestykke', 13, weight=700, anchor='middle'))
    ud.append(tekst(560, 78, 'viskestykke', 12, GRAA, 'start'))
    ud.append(f'  <path d="M574 82 L540 110" stroke="{GRAA}" stroke-width="1"/>')
    ud.append(tekst(480, 200, 'foldes til 2, 3 og 4 lag', 12, GRAA, 'middle'))
    ud.append('</svg>')
    (HER / 'opstilling.svg').write_text('\n'.join(ud) + '\n', encoding='utf-8')


if __name__ == '__main__':
    opstilling()
