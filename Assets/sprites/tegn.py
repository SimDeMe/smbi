#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fælles tegneværktøj for sprite-mappen.

Her ligger det, alle figurerne bruger: bløde kurver gennem punkter, SVG-rammen
om hvert billede, og skrivningen af billederne og JSON-filen. Selve arterne
ligger i fisk.py, plante.py og i den enkelte mappes byg.py.

Hver figur tegnes i sine egne koordinater — for en fisk løber u fra snuden mod
halen, for en plante løber v opad fra roden — og en `Kasse` kender vejen fra
dem til billedets ramme. Det er den, der holder regnskab med figurens
yderpunkter over hele bevægelsen, så JSON-filen kan fortælle, hvor stor
figuren er, og hvor dens anker sidder.
"""

import json, math, os

INK = '#17211F'


class Kasse:
    """Figurens yderpunkter i rammens koordinater, samlet over alle billeder."""

    def __init__(self, vej):
        self.vej = vej                      # figurens koordinater → rammens
        self.x0 = self.y0 = 1e9
        self.x1 = self.y1 = -1e9

    def med(self, x, y):
        rx, ry = self.vej(x, y)
        self.x0 = min(self.x0, rx);  self.y0 = min(self.y0, ry)
        self.x1 = max(self.x1, rx);  self.y1 = max(self.y1, ry)
        return (x, y)

    def alle(self, punkter):
        for x, y in punkter:
            self.med(x, y)
        return list(punkter)

    def andele(self, br, ho, kant=4):
        return {'x': round((self.x0-kant)/br, 4), 'y': round((self.y0-kant)/ho, 4),
                'bredde': round((self.x1-self.x0+2*kant)/br, 4),
                'hoejde': round((self.y1-self.y0+2*kant)/ho, 4)}


def glat(p, lukket=False):
    """Blød kurve gennem punkterne (Catmull-Rom skrevet som Bézier)."""
    n = len(p)
    if n < 3:
        return 'M ' + ' L '.join('%.0f,%.0f' % q for q in p)
    d = ['M %.0f,%.0f' % p[0]]
    for i in range(n if lukket else n-1):
        p0 = p[(i-1) % n] if lukket else p[max(i-1, 0)]
        p1 = p[i % n]
        p2 = p[(i+1) % n]
        p3 = p[(i+2) % n] if lukket else p[min(i+2, n-1)]
        d.append('C %.0f,%.0f %.0f,%.0f %.0f,%.0f' % (
            p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6,
            p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6,
            p2[0], p2[1]))
    if lukket:
        d.append('Z')
    return ' '.join(d)


def kant(p, lukket=True):
    """Lige linjer gennem punkterne — til skarpe former."""
    d = 'M %.0f,%.0f ' % p[0] + ' '.join('L %.0f,%.0f' % q for q in p[1:])
    return d + (' Z' if lukket else '')


def streger(par):
    """Flere løse streger i én sti: [((x0,y0),(x1,y1)), …]"""
    return ' '.join('M %.0f,%.0f L %.0f,%.0f' % (a[0], a[1], b[0], b[1])
                    for a, b in par)


def roter(p, v, om=(0.0, 0.0)):
    """Drejer punkterne v radianer om et punkt."""
    c, s = math.cos(v), math.sin(v)
    return [(om[0] + (x-om[0])*c - (y-om[1])*s,
             om[1] + (x-om[0])*s + (y-om[1])*c) for x, y in p]


def mellem(a, b, t):
    return a + (b - a) * t


def profil(punkter, u):
    """Slår en rand op i punktet u — punkterne skal ligge efter voksende u."""
    if u <= punkter[0][0]:
        return punkter[0][1]
    for a, b in zip(punkter, punkter[1:]):
        if a[0] <= u <= b[0]:
            return mellem(a[1], b[1], (u - a[0]) / (b[0] - a[0]))
    return punkter[-1][1]


def svg(indhold, br, ho, titel, beskrivelse):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
            'width="%d" height="%d"><title>%s</title><desc>%s</desc>\n%s\n</svg>\n'
            % (br, ho, br, ho, titel, beskrivelse, indhold))


def skriv(mappe, navn, billeder, br, ho, kasse, data, titel, beskrivelse):
    """Skriver <navn>-01.svg … og <navn>.json i mappen."""
    filer = []
    for i, indhold in enumerate(billeder):
        fil = '%s-%02d.svg' % (navn, i+1)
        filer.append(fil)
        with open(os.path.join(mappe, fil), 'w') as f:
            f.write(svg(indhold, br, ho, titel, beskrivelse))

    def andel(p):
        x, y = kasse.vej(*p)
        return {'x': round(x/br, 4), 'y': round(y/ho, 4)}

    ud = {'navn': navn}
    ud.update({n: data[n] for n in ('dansk', 'art', 'vender', 'tempo') if n in data})
    ud['billeder'] = len(billeder)
    ud['celle'] = {'bredde': br, 'hoejde': ho}
    ud['filer'] = filer
    ud['kasse'] = kasse.andele(br, ho)
    if 'anker' in data:
        ud['anker'] = andel(data['anker'])
    if 'punkter' in data:
        ud['punkter'] = {n: andel(p) for n, p in data['punkter'].items()}

    with open(os.path.join(mappe, navn + '.json'), 'w') as f:
        json.dump(ud, f, ensure_ascii=False, indent=2)
        f.write('\n')

    with open(os.path.join(mappe, navn + '.js'), 'w') as f:
        f.write("/**\n * %s — sprite til 2D-animationer.\n *\n"
                " *   import {indlaes%s} from '/Assets/sprites/%s/%s.js';\n"
                " *   const %s = await indlaes%s();\n *\n"
                " * Se Assets/sprites/README.md.\n */\n"
                "import {indlaesSprite} from '../sprite.js';\n\n"
                "export function indlaes%s() {\n"
                "  return indlaesSprite(new URL('./%s.json', import.meta.url));\n}\n\n"
                "export default indlaes%s;\n"
                % (titel, navn.capitalize(), navn, navn, navn, navn.capitalize(),
                   navn.capitalize(), navn, navn.capitalize()))
    print('%-16s %d billeder · kasse %s' % (navn, len(billeder), ud['kasse']))
    return ud
