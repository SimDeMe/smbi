#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fiskeskabelonen — den samme krop, de samme finner, forskellige tal.

En fisk tegnes i kropskoordinater: u løber fra snuden (u = 0) mod halen, y er 0
i midterlinjen og positiv nedad. Til sidst spejles figuren, så sprite'en vender
mod højre.

Svømmetaget er én bølge, der løber fra hoved mod hale. Udsvinget vokser bagud,
så hovedet står næsten stille, mens halen fejer. Alt, der har et u, følger
bølgen af sig selv — kun brystfinnen roterer for sig.

Arterne står i aborre/byg.py, skalle/byg.py og gedde/byg.py: kropsranden,
finnernes rod og højde, tegningen på siden og farverne. Resten er fælles.
"""

import math, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tegn
from tegn import INK, glat, kant, streger, profil, roter


class Fisk:
    def __init__(self, navn, dansk, art, titel, ryg, bug, halerod, halefinne, finner,
                 bryst_faeste, brystfinne, farver, oeje, mund,
                 gael=(), forgael=(), sidelinje=(), baand=(), pletter=(),
                 finneplet=None, skael=None, bryst_hvil=9.0, bryst_slag=22.0,
                 amp=38.0, boelge=1250.0, bob=3.5, laengde=1000.0,
                 tempo=1.8, billeder=8, ramme=(1120, 640), snude=(1070, 330)):
        self.__dict__.update(locals())
        del self.self
        self.br, self.ho = ramme
        self.ox, self.oy = snude
        self.kasse = tegn.Kasse(lambda u, y: (self.ox - u, self.oy + y))

    # ── bølgen ────────────────────────────────────────────────────────────
    def udsving(self, u, faze):
        a = self.amp * (max(u, 0.0) / self.laengde) ** 1.8
        return a * math.sin(2*math.pi*faze - 2*math.pi*u/self.boelge) \
             + self.bob * math.sin(2*math.pi*faze + 0.6)

    def P(self, u, y, faze, maal=True):
        yy = y + self.udsving(u, faze)
        if maal:
            self.kasse.med(u, yy)
        return (u, yy)

    def alle(self, punkter, faze, maal=True):
        return [self.P(u, y, faze, maal) for u, y in punkter]

    # ── kroppen ───────────────────────────────────────────────────────────
    def kropssti(self, faze):
        naese = (self.ryg[0][0] - 6, (self.ryg[0][1] + self.bug[0][1]) / 2)
        return glat(self.alle(self.ryg, faze)
                    + self.alle(reversed(self.bug), faze)
                    + [self.P(naese[0], naese[1], faze)], lukket=True)

    # ── finnerne ──────────────────────────────────────────────────────────
    def finne(self, f, faze):
        """En finne, der sidder på kropsranden og følger bølgen med den."""
        rand = self.bug if f['nedad'] else self.ryg
        vej = 1 if f['nedad'] else -1
        n = 18
        ydre, rod = [], []
        for i in range(n + 1):
            s = i / n
            u = tegn.mellem(f['u0'], f['u1'], s)
            h = f['hoejde'] * (math.sin(math.pi * s**f['form'])) ** 0.85
            yb = profil(rand, u)
            rod.append(self.P(u, yb, faze))
            ydre.append(self.P(u + f['slank']*h, yb + vej*h, faze))
        sti = glat(ydre + list(reversed(rod)), lukket=True)

        par = []
        for i in range(1, f['straaler'] + 1):
            s = i / (f['straaler'] + 1)
            u = tegn.mellem(f['u0'], f['u1'], s)
            h = f['hoejde'] * (math.sin(math.pi * s**f['form'])) ** 0.85
            yb = profil(rand, u)
            par.append((self.P(u, yb + vej*h*0.10, faze),
                        self.P(u + f['slank']*h*0.90, yb + vej*h*0.88, faze)))
        return sti, streger(par)

    def hale(self, faze):
        hu, hy = self.halerod
        sti = glat([self.P(hu + dx, hy + dy, faze) for dx, dy in self.halefinne],
                   lukket=True)
        dyb = max(abs(y) for _, y in self.halefinne)
        lang = max(x for x, _ in self.halefinne)
        par = []
        for i in range(9):
            t = i / 8.0
            rod_y = -dyb*0.36 + dyb*0.72*t
            kant_y = -dyb + 2*dyb*t
            dx = lang*0.78 - lang*0.40*(1 - abs(0.5 - t)*2)
            par.append((self.P(hu + lang*0.05, hy + rod_y, faze),
                        self.P(hu + dx, hy + kant_y*0.86, faze)))
        return sti, streger(par)

    def bryst(self, faze):
        """Brystfinnen vifter om sit fæste — det eneste, bølgen ikke styrer."""
        v = math.radians(self.bryst_hvil) \
          + math.radians(self.bryst_slag) * math.sin(2*math.pi*faze + 0.9)
        fx, fy = self.bryst_faeste
        dy = self.udsving(fx, faze)
        p = [(fx + x, fy + y + dy) for x, y in
             roter(self.brystfinne, v)]
        for x, y in p:
            self.kasse.med(x, y)
        spids = max(self.brystfinne, key=lambda q: q[0]+q[1])
        par = []
        for i in range(1, 7):
            t = i/7.0
            a, b = roter([(6, 2), (spids[0]*t + 12, spids[1]*t - 14)], v)
            par.append(((fx + a[0], fy + a[1] + dy), (fx + b[0], fy + b[1] + dy)))
        return kant(p), streger(par)

    # ── tegningen på siden ────────────────────────────────────────────────
    def tvaerbaand(self, faze):
        ud = []
        for i, u in enumerate(self.baand):
            bred = 19 - 1.4*i
            bund = 74 - 3*i
            ud.append(glat(self.alle(
                [(u - bred, -168), (u + bred, -168),
                 (u + bred*0.55 + 16, bund), (u - bred*0.55 + 16, bund)],
                faze, False), lukket=True))
        return ud

    def skaelraekker(self, faze):
        """Skælmønster som små buer — klippes til kroppen af kaldet."""
        skridt, hoejde = self.skael
        par = []
        u = self.ryg[0][0] + skridt*2
        raekke = 0
        while u < self.halerod[0]:
            y = -180 + (raekke % 2)*hoejde/2
            while y < 180:
                a = self.P(u, y - hoejde*0.34, faze, False)
                b = self.P(u + skridt*0.46, y, faze, False)
                c = self.P(u, y + hoejde*0.34, faze, False)
                par.append('M %.0f,%.0f Q %.0f,%.0f %.0f,%.0f'
                           % (a[0], a[1], b[0], b[1], c[0], c[1]))
                y += hoejde
            u += skridt
            raekke += 1
        return ' '.join(par)

    # ── ét billede ────────────────────────────────────────────────────────
    def billede(self, faze, suf):
        f = self.farver
        klip = []
        krop = self.kropssti(faze)
        hale_s, hale_r = self.hale(faze)
        bryst_s, bryst_r = self.bryst(faze)

        ud = ['<g fill="none" stroke="%s" stroke-width="7" '
              'stroke-linejoin="round" stroke-linecap="round">' % INK]

        # finnerne bag kroppen
        for fin in self.finner:
            sti, raek = self.finne(fin, faze)
            farve = ('url(#ror%s)' % suf) if fin['farve'] == 'ror' else f['finne']
            klip.append('<clipPath id="%s%s"><path d="%s"/></clipPath>'
                        % (fin['navn'], suf, sti))
            ud.append('<path d="%s" fill="%s"/>' % (sti, farve))
            ud.append('<g clip-path="url(#%s%s)"><path d="%s" stroke-width="4" '
                      'opacity=".45"/></g>' % (fin['navn'], suf, raek))
        klip.append('<clipPath id="hale%s"><path d="%s"/></clipPath>' % (suf, hale_s))
        ud.append('<path d="%s" fill="url(#ror%s)"/>' % (hale_s, suf))
        ud.append('<g clip-path="url(#hale%s)"><path d="%s" stroke-width="4" '
                  'opacity=".4"/></g>' % (suf, hale_r))

        # plet i en finne (aborrens sorte bagerst i den pigstrålede)
        if self.finneplet:
            navn, u, over, rx, ry = self.finneplet
            pu, pv = self.P(u, profil(self.ryg, u) - over, faze, False)
            ud.append('<g clip-path="url(#%s%s)"><ellipse cx="%.0f" cy="%.0f" '
                      'rx="%d" ry="%d" fill="%s" stroke="none" '
                      'transform="rotate(-10 %.0f %.0f)"/></g>'
                      % (navn, suf, pu, pv, rx, ry, f['plet'], pu, pv))

        # kroppen
        ud.append('<path d="%s" fill="url(#hud%s)"/>' % (krop, suf))
        ud.append('<g clip-path="url(#klip%s)" stroke="none">' % suf)
        for b in self.tvaerbaand(faze):
            ud.append('<path d="%s" fill="%s" opacity=".6"/>' % (b, f['baand']))
        for u, y, rx, ry, v in self.pletter:
            pu, pv = self.P(u, y, faze, False)
            ud.append('<ellipse cx="%.0f" cy="%.0f" rx="%d" ry="%d" fill="%s" '
                      'opacity=".8" transform="rotate(%d %.0f %.0f)"/>'
                      % (pu, pv, rx, ry, f['plet'], v, pu, pv))
        ud.append('</g>')
        if self.skael:
            ud.append('<g clip-path="url(#klip%s)"><path d="%s" stroke="%s" '
                      'stroke-width="3" opacity=".16"/></g>'
                      % (suf, self.skaelraekker(faze), f['skael']))
        ud.append('<path d="%s"/>' % krop)

        # gællelåg, sidelinje, mund og øje
        if self.gael:
            ud.append('<path d="%s" stroke-width="6" opacity=".85"/>'
                      % glat(self.alle(self.gael, faze, False)))
        if self.forgael:
            ud.append('<path d="%s" stroke-width="4" opacity=".45"/>'
                      % glat(self.alle(self.forgael, faze, False)))
        if self.sidelinje:
            ud.append('<path d="%s" stroke-width="3" opacity=".28" '
                      'stroke-dasharray="14 14"/>'
                      % glat(self.alle(self.sidelinje, faze, False)))
        ud.append('<path d="%s" stroke-width="6"/>'
                  % glat(self.alle(self.mund, faze, False)))

        ou, oy, r = self.oeje
        ox, oyy = self.P(ou, oy, faze, False)
        ud.append('<circle cx="%.0f" cy="%.0f" r="%d" fill="%s"/>'
                  % (ox, oyy, r, f['oeje']))
        ud.append('<circle cx="%.0f" cy="%.0f" r="%d" fill="%s" stroke="none"/>'
                  % (ox - r*0.15, oyy + 1, round(r*0.48), INK))
        ud.append('<circle cx="%.0f" cy="%.0f" r="%d" fill="#FFF9EE" '
                  'stroke="none" opacity=".9"/>' % (ox - r*0.4, oyy - r*0.3, round(r*0.19)))

        # brystfinnen forrest
        klip.append('<clipPath id="bryst%s"><path d="%s"/></clipPath>' % (suf, bryst_s))
        ud.append('<path d="%s" fill="%s" opacity=".9"/>' % (bryst_s, f['bryst']))
        ud.append('<g clip-path="url(#bryst%s)"><path d="%s" stroke-width="4" '
                  'opacity=".55"/></g>' % (suf, bryst_r))
        ud.append('</g>')

        stop = ''.join('<stop offset="%s" stop-color="%s"/>' % (o, c) for o, c in f['hud'])
        defs = ('<defs><linearGradient id="hud%s" x1="0" y1="%d" x2="0" y2="%d" '
                'gradientUnits="userSpaceOnUse">%s</linearGradient>'
                '<linearGradient id="ror%s" x1="0" y1="-120" x2="0" y2="120" '
                'gradientUnits="userSpaceOnUse">'
                '<stop offset="0" stop-color="%s"/><stop offset="1" stop-color="%s"/>'
                '</linearGradient>'
                '<clipPath id="klip%s"><path d="%s"/></clipPath>%s</defs>'
                % (suf, f['hud_top'], f['hud_bund'], stop, suf,
                   f['ror'][0], f['ror'][1], suf, krop, ''.join(klip)))
        return defs + '\n' + '\n'.join(ud)

    # ── hele figuren ──────────────────────────────────────────────────────
    def byg(self, mappe):
        billeder = []
        for i in range(self.billeder):
            indre = self.billede(i / self.billeder, '%d' % (i+1))
            billeder.append('<g transform="translate(%d,%d) scale(-1,1)">\n%s\n</g>'
                            % (self.ox, self.oy, indre))
        hu, hy = self.halerod
        data = {
            'dansk': self.dansk, 'art': self.art,
            'vender': 'hoejre', 'tempo': self.tempo,
            'punkter': {
                'mund': (self.mund[0][0] + 2, self.mund[0][1] + 10),
                'oeje': (self.oeje[0], self.oeje[1]),
                'ryg':  min(self.ryg, key=lambda p: p[1]),
                'halerod': (hu, hy),
            },
        }
        return tegn.skriv(mappe, self.navn, billeder, self.br, self.ho,
                          self.kasse, data, self.titel,
                          'Sprite til 2D-animation: %s (%s) set fra siden, '
                          'ét billede af svømmetaget.' % (self.titel.lower(), self.art))
