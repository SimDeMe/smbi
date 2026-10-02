#!/usr/bin/env python3
"""Tegner opstillingen til «Albedo og overfladetemperatur» som SVG.

    python3 tegn-figurer.py        → opstilling.svg

Tegnet fra bunden i samme stil som lavas-viskositet/figurer/. NV-arket har
ingen figur.
"""
from pathlib import Path

HER = Path(__file__).parent
FONT = 'font-family="Carlito,Calibri,Helvetica,Arial,sans-serif"'
INK, GRAA, ROED = '#26332B', '#6B7A66', '#A8402C'
FLAMINGO, LYS, LAMPE = '#F2F4F1', '#FFE9A8', '#E6E2D6'


def tekst(x, y, s, size=12, fill=INK, anchor='start', weight=None):
    w = f' font-weight="{weight}"' if weight else ''
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'  <text x="{x:g}" y="{y:g}" {FONT} font-size="{size}"{w} fill="{fill}"{a}>{s}</text>'


def opstilling():
    ud = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="640" height="260" role="img" '
        'aria-label="En lampe lyser ned på et papir med fem felter i gråtonerne 0, 25, 50, 75 og 100 procent, '
        'der ligger på en flamingoplade. Temperaturen måles med et IR-termometer">',
        '  <title>Opstillingen: gråtoneark under lampe</title>',
        '  <desc>Papiret med fem gråtonefelter ligger på en flamingoplade. Feltet til venstre er hvidt (0 %), '
        'feltet til højre er sort (100 %), og imellem ligger 25, 50 og 75 % grå. En lampe hænger over midten '
        'af papiret i fast afstand og vinkel. Et IR-termometer peger på ét felt ad gangen.</desc>',
    ]
    # lampen
    ud.append(f'  <path d="M320 0 V30" stroke="{INK}" stroke-width="2"/>')
    ud.append(f'  <path d="M282 58 L302 30 H338 L358 58 Z" fill="{LAMPE}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M90 170 L284 60 H356 L550 170 Z" fill="{LYS}" opacity="0.5"/>')
    ud.append(tekst(368, 28, 'lampe — samme afstand og vinkel hele tiden', 12, GRAA))
    # afstandspil
    ud.append(f'  <path d="M590 60 V168" stroke="{GRAA}" stroke-width="1.2" stroke-dasharray="4 3"/>')
    ud.append(tekst(598, 118, 'fast', 11, GRAA))
    ud.append(tekst(598, 132, 'afstand', 11, GRAA))
    # flamingoplade og felter
    ud.append(f'  <rect x="70" y="190" width="500" height="26" fill="{FLAMINGO}" stroke="{INK}" stroke-width="1.8"/>')
    ud.append(tekst(320, 234, 'flamingoplade', 11, GRAA, 'middle'))
    graa = ['#FFFFFF', '#BFBFBF', '#808080', '#404040', '#000000']
    for i, (g, p) in enumerate(zip(graa, (0, 25, 50, 75, 100))):
        x = 90 + i * 94
        ud.append(f'  <rect x="{x}" y="170" width="84" height="20" fill="{g}" stroke="{INK}" stroke-width="1.4"/>')
        ud.append(tekst(x + 42, 160, f'{p} %', 12, weight=700, anchor='middle'))
    # IR-termometer
    ud.append(f'  <path d="M28 96 L66 116 L60 128 L22 108 Z" fill="#E7F4FB" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M34 112 L28 140 H40 L46 118" fill="#E7F4FB" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>')
    ud.append(f'  <path d="M66 122 L128 168" stroke="{ROED}" stroke-width="1.4" stroke-dasharray="5 3"/>')
    ud.append(tekst(20, 86, 'IR-termometer', 12, GRAA))
    ud.append(tekst(20, 256, 'skitse — ikke målfast', 10, GRAA))
    ud.append('</svg>')
    (HER / 'opstilling.svg').write_text('\n'.join(ud) + '\n', encoding='utf-8')


if __name__ == '__main__':
    opstilling()
