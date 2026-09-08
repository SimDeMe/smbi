#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bygger sprite-billederne til aborren (Perca fluviatilis).

    python3 Assets/sprites/aborre/byg.py

Skriver aborre-01.svg … aborre-08.svg og aborre.json i denne mappe.
Ingen anden værktøjskæde: browseren rastererer selv billederne, når
Assets/sprites/sprite.js indlæser dem.

Fisken tegnes i kropskoordinater: u løber fra snuden (u = 0) mod halen
(u = 1000 er halespidsen), y er 0 i midterlinjen og positiv nedad. Hele
figuren spejles til sidst, så sprite'en vender mod højre.

Svømmetaget er én bølge, der løber fra hoved mod hale. Udsvinget vokser
med (u/L)^1.8, så hovedet står næsten stille og halen fejer — som hos en
rigtig aborre. Alt, der har et u, følger bølgen af sig selv; kun
brystfinnen roterer for sig.
"""

import json, math, os

MAPPE = os.path.dirname(os.path.abspath(__file__))

BILLEDER = 8            # billeder i ét svømmetag
BR, HO   = 1120, 640    # rammen om ét billede
OX, OY   = 1070, 330    # snudens plads i rammen (før spejling)

L      = 1000.0         # snude → halespids
AMP    = 38.0           # halens udsving
BOELGE = 1250.0         # bølgelængde
BOB    = 3.5            # hele kroppens lille løft

INK = '#17211F'

# ---------------------------------------------------------------- kroppen

RYG = [(0,-16),(42,-70),(104,-116),(176,-146),(258,-160),(340,-162),
       (430,-152),(520,-134),(624,-104),(706,-72),(772,-46),(816,-30)]

BUG = [(0,12),(48,60),(118,100),(198,124),(292,132),(392,127),
       (486,113),(580,92),(670,68),(730,50),(790,32),(816,24)]

# haleroden
HALE_U, HALE_Y = 752.0, -6.0

# halefinnen, målt fra haleroden
HALEFINNE = [(0,-52),(104,-100),(206,-118),(160,-44),(126,0),
             (160,44),(206,116),(104,98),(0,42)]

# brystfinnen, målt fra sit fæste
BRYST_FAESTE = (206.0, 4.0)
BRYSTFINNE   = [(0,-30),(44,-16),(106,26),(148,84),(92,96),(36,68),(2,24)]
BRYST_HVIL   = math.radians(9)      # finnens hvilestilling

# de mørke tværbånd
BAAND = [198,278,358,438,518,598,678]

# rygfinne 1 (pigstråler), rygfinne 2 (blødstråler), gatfinne, bugfinne
#        u0     u1    hoejde  form  slank  stråler  nedad
FINNER = [
    ('ryg1',  246.0, 512.0, 112.0, 0.78, 0.30, 13, False),
    ('ryg2',  552.0, 706.0,  88.0, 1.00, 0.26, 11, False),
    ('gat',   584.0, 700.0,  82.0, 1.05, 0.30,  9, True ),
    ('bug',   248.0, 322.0,  86.0, 1.10, 0.42,  6, True ),
]

_kasse = [1e9, 1e9, -1e9, -1e9]   # umin, ymin, umax, ymax over alle billeder


def udsving(u, faze):
    """Bølgens lodrette flytning af et punkt med kropskoordinaten u."""
    a = AMP * (max(u, 0.0) / L) ** 1.8
    return a * math.sin(2*math.pi*faze - 2*math.pi*u/BOELGE) \
         + BOB * math.sin(2*math.pi*faze + 0.6)


def P(u, y, faze, maal=True):
    """Bøjer ét punkt og holder regnskab med figurens yderpunkter."""
    yy = y + udsving(u, faze)
    if maal:
        _kasse[0] = min(_kasse[0], u);  _kasse[1] = min(_kasse[1], yy)
        _kasse[2] = max(_kasse[2], u);  _kasse[3] = max(_kasse[3], yy)
    return (u, yy)


def profil(punkter, u):
    """Kropsranden (RYG eller BUG) i punktet u."""
    if u <= punkter[0][0]:  return punkter[0][1]
    for a, b in zip(punkter, punkter[1:]):
        if a[0] <= u <= b[0]:
            t = (u - a[0]) / (b[0] - a[0])
            return a[1] + t*(b[1] - a[1])
    return punkter[-1][1]


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


def finnehoejde(s, form):
    """Finnens højde over sin rod, s = 0…1 langs roden."""
    return (math.sin(math.pi * s**form)) ** 0.85


def kropssti(faze):
    ryg = [P(u, y, faze) for u, y in RYG]
    bug = [P(u, y, faze) for u, y in reversed(BUG)]
    naese = [P(-6, 0, faze)]
    return glat(ryg + bug + naese, lukket=True)

# ------------------------------------------------------------------ finner

def finne(navn, u0, u1, hoejde, form, slank, straaler, nedad, faze):
    rand = BUG if nedad else RYG
    tegn = 1 if nedad else -1
    n = 18
    ydre, rod = [], []
    for i in range(n + 1):
        s = i / n
        u = u0 + (u1 - u0) * s
        h = hoejde * finnehoejde(s, form)
        yb = profil(rand, u)
        rod.append(P(u, yb, faze))
        ydre.append(P(u + slank*h, yb + tegn*h, faze))
    sti = glat(ydre + list(reversed(rod)), lukket=True)

    linjer = []
    for i in range(1, straaler + 1):
        s = i / (straaler + 1)
        u = u0 + (u1 - u0) * s
        h = hoejde * finnehoejde(s, form)
        yb = profil(rand, u)
        a = P(u, yb + tegn*h*0.10, faze)
        b = P(u + slank*h*0.90, yb + tegn*h*0.88, faze)
        linjer.append('M %.0f,%.0f L %.0f,%.0f' % (a[0], a[1], b[0], b[1]))
    return sti, ' '.join(linjer)


def halefinne(faze):
    p = [P(HALE_U + dx, HALE_Y + dy, faze) for dx, dy in HALEFINNE]
    sti = glat(p, lukket=True)
    linjer = []
    for i in range(9):
        t = i / 8.0
        y0 = -40 + 80*t
        y1 = -104 + 208*t
        dx = 150 - 76*(1 - abs(0.5 - t)*2)   # kortere stråler ind mod kløften
        a = P(HALE_U + 10, HALE_Y + y0*0.8, faze)
        b = P(HALE_U + dx, HALE_Y + y1*0.86, faze)
        linjer.append('M %.0f,%.0f L %.0f,%.0f' % (a[0], a[1], b[0], b[1]))
    return sti, ' '.join(linjer)


def brystfinne(faze):
    """Brystfinnen vifter om sit fæste — det eneste, bølgen ikke styrer."""
    v = BRYST_HVIL + math.radians(22) * math.sin(2*math.pi*faze + 0.9)
    fx, fy = BRYST_FAESTE
    dy = udsving(fx, faze)
    p = []
    for x, y in BRYSTFINNE:
        rx = x*math.cos(v) - y*math.sin(v)
        ry = x*math.sin(v) + y*math.cos(v)
        q = (fx + rx, fy + ry + dy)
        _kasse[0] = min(_kasse[0], q[0]); _kasse[1] = min(_kasse[1], q[1])
        _kasse[2] = max(_kasse[2], q[0]); _kasse[3] = max(_kasse[3], q[1])
        p.append(q)
    linjer = []
    for i in range(1, 7):
        t = i/7.0
        x, y = 16 + 104*t, -18 + 100*t
        a = (fx + 6*math.cos(v) - 2*math.sin(v), fy + 6*math.sin(v) + 2*math.cos(v) + dy)
        b = (fx + x*math.cos(v) - y*math.sin(v), fy + x*math.sin(v) + y*math.cos(v) + dy)
        linjer.append('M %.0f,%.0f L %.0f,%.0f' % (a[0], a[1], b[0], b[1]))
    kant = 'M %.0f,%.0f ' % p[0] + ' '.join('L %.0f,%.0f' % q for q in p[1:]) + ' Z'
    return kant, ' '.join(linjer)


def baand(faze):
    """De mørke tværbånd. Klippes til kroppen af kaldet."""
    ud = []
    for i, u in enumerate(BAAND):
        bred = 19 - 1.4*i
        bund = 74 - 3*i
        p = [P(u - bred, -168, faze, False), P(u + bred, -168, faze, False),
             P(u + bred*0.55 + 16, bund, faze, False),
             P(u - bred*0.55 + 16, bund, faze, False)]
        ud.append(glat(p, lukket=True))
    return ud

# ------------------------------------------------------------------ billede

def billede(faze, suf):
    """Ét billede af svømmetaget som SVG-indhold."""
    klip = []
    krop = kropssti(faze)
    hale_s, hale_r = halefinne(faze)
    bryst_s, bryst_r = brystfinne(faze)

    ud = ['<g fill="none" stroke="%s" stroke-width="7" '
          'stroke-linejoin="round" stroke-linecap="round">' % INK]

    # finnerne bag kroppen
    for navn, u0, u1, h, form, slank, n, ned in FINNER:
        sti, raek = finne(navn, u0, u1, h, form, slank, n, ned, faze)
        farve = 'url(#ror%s)' % suf if navn in ('gat', 'bug') else '#A3B166'
        klip.append('<clipPath id="%s%s"><path d="%s"/></clipPath>' % (navn, suf, sti))
        ud.append('<path d="%s" fill="%s"/>' % (sti, farve))
        ud.append('<g clip-path="url(#%s%s)"><path d="%s" stroke-width="4" '
                  'opacity=".45"/></g>' % (navn, suf, raek))
    klip.append('<clipPath id="hale%s"><path d="%s"/></clipPath>' % (suf, hale_s))
    ud.append('<path d="%s" fill="url(#ror%s)"/>' % (hale_s, suf))
    ud.append('<g clip-path="url(#hale%s)"><path d="%s" stroke-width="4" '
              'opacity=".4"/></g>' % (suf, hale_r))

    # pletten bagerst i den pigstrålede rygfinne
    pu, pv = P(478, profil(RYG, 478) - 26, faze, False)
    ud.append('<g clip-path="url(#ryg1%s)"><ellipse cx="%.1f" cy="%.1f" rx="30" '
              'ry="22" fill="#1D2A12" stroke="none" transform="rotate(-10 %.0f %.0f)"/>'
              '</g>' % (suf, pu, pv, pu, pv))

    # kroppen med sine tværbånd
    ud.append('<path d="%s" fill="url(#hud%s)"/>' % (krop, suf))
    ud.append('<g clip-path="url(#klip%s)" stroke="none">' % suf)
    for b in baand(faze):
        ud.append('<path d="%s" fill="#2C3E17" opacity=".6"/>' % b)
    ud.append('</g>')
    ud.append('<path d="%s"/>' % krop)

    # gællelåg, sidelinje, mund og øje
    gael = [P(u, y, faze, False) for u, y in
            [(134,-118),(180,-64),(188,10),(168,76),(140,104)]]
    ud.append('<path d="%s" stroke-width="6" opacity=".85"/>' % glat(gael))
    forg = [P(u, y, faze, False) for u, y in [(92,-106),(126,-34),(116,48)]]
    ud.append('<path d="%s" stroke-width="4" opacity=".45"/>' % glat(forg))
    side = [P(u, y, faze, False) for u, y in
            [(200,-68),(330,-62),(470,-48),(610,-32),(740,-18)]]
    ud.append('<path d="%s" stroke-width="3" opacity=".28" '
              'stroke-dasharray="14 14"/>' % glat(side))
    mund = [P(u, y, faze, False) for u, y in [(-4,0),(38,16),(84,32)]]
    ud.append('<path d="%s" stroke-width="6"/>' % glat(mund))

    ox, oy = P(88, -58, faze, False)
    ud.append('<circle cx="%.0f" cy="%.0f" r="27" fill="#F0C94A"/>' % (ox, oy))
    ud.append('<circle cx="%.0f" cy="%.0f" r="13" fill="%s" stroke="none"/>'
              % (ox - 4, oy + 1, INK))
    ud.append('<circle cx="%.0f" cy="%.0f" r="5" fill="#FFF9EE" stroke="none" '
              'opacity=".9"/>' % (ox - 11, oy - 8))

    # brystfinnen forrest
    klip.append('<clipPath id="bryst%s"><path d="%s"/></clipPath>' % (suf, bryst_s))
    ud.append('<path d="%s" fill="#F2D08A" opacity=".88"/>' % bryst_s)
    ud.append('<g clip-path="url(#bryst%s)"><path d="%s" stroke-width="4" '
              'opacity=".55"/></g>' % (suf, bryst_r))
    ud.append('</g>')

    defs = '''<defs>
<linearGradient id="hud%(s)s" x1="0" y1="-166" x2="0" y2="132" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#3D5A21"/><stop offset=".26" stop-color="#6D8C33"/>
<stop offset=".52" stop-color="#A9BC63"/><stop offset=".74" stop-color="#E4DFB4"/>
<stop offset="1" stop-color="#FFF9EE"/></linearGradient>
<linearGradient id="ror%(s)s" x1="0" y1="-120" x2="0" y2="120" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#F2A03F"/><stop offset="1" stop-color="#E24C22"/></linearGradient>
<clipPath id="klip%(s)s"><path d="%(k)s"/></clipPath>
%(c)s
</defs>''' % {'s': suf, 'k': krop, 'c': '\n'.join(klip)}
    return defs + '\n' + '\n'.join(ud)


def svg(indhold, br, ho, ekstra=''):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
            'width="%d" height="%d">%s\n%s\n</svg>\n' % (br, ho, br, ho, ekstra, indhold))


def ramme(indhold):
    return '<g transform="translate(%d,%d) scale(-1,1)">\n%s\n</g>' % (OX, OY, indhold)


def main():
    billeder = [billede(i / BILLEDER, '%d' % (i+1)) for i in range(BILLEDER)]

    titel = ('<title>Aborre, svømmende</title><desc>Sprite til 2D-animation: '
             'en aborre (Perca fluviatilis) set fra siden, ét billede af '
             'svømmetaget.</desc>')
    for i, b in enumerate(billeder):
        with open(os.path.join(MAPPE, 'aborre-%02d.svg' % (i+1)), 'w') as f:
            f.write(svg(ramme(b), BR, HO, titel))

    # figurens yderpunkter over hele svømmetaget → hvor fisken står i cellen
    umin, ymin, umax, ymax = _kasse
    kant = 4                      # halv stregbredde
    x0, x1 = OX - umax - kant, OX - umin + kant
    y0, y1 = OY + ymin - kant, OY + ymax + kant

    def sted(u, y):
        return {'x': round((OX - u)/BR, 4), 'y': round((OY + y)/HO, 4)}

    data = {
        'navn': 'aborre',
        'art': 'Perca fluviatilis',
        'vender': 'hoejre',
        'billeder': BILLEDER,
        'tempo': 1.8,
        'celle': {'bredde': BR, 'hoejde': HO},
        'filer': ['aborre-%02d.svg' % (i+1) for i in range(BILLEDER)],
        'kasse': {'x': round(x0/BR, 4), 'y': round(y0/HO, 4),
                  'bredde': round((x1-x0)/BR, 4), 'hoejde': round((y1-y0)/HO, 4)},
        'punkter': {'mund': sted(-2, 10), 'oeje': sted(88, -58),
                    'ryg': sted(320, -162), 'halerod': sted(HALE_U, HALE_Y)},
    }
    with open(os.path.join(MAPPE, 'aborre.json'), 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('yderpunkter u:%.0f…%.0f  y:%.0f…%.0f\nkasse %s' % (umin, umax, ymin, ymax, data['kasse']))


if __name__ == '__main__':
    main()
