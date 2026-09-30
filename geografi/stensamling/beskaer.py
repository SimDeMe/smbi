#!/usr/bin/env python3
"""Beskæringsværktøj til stensamlingens fotos.

Kør fra repoets rod:

    python3 geografi/stensamling/beskaer.py

Så åbner værktøjet i browseren (http://localhost:8778). Træk en 4:3-ramme
hen over hvert foto og tryk «Gem udsnit». Et stående foto kan
drejes, så det ligger ned. Værktøjet skærer fra originalen i
billeder/originaler/ (fuld opløsning, ikke i git) og skriver webudgaven i
billeder/ — 1200 × 900 px, JPEG under 300 kB, uden EXIF. Udsnittet huskes i
billeder/udsnit.json, så det kan flyttes igen senere.

Et nyt foto: læg originalen i billeder/originaler/ med det navn, webfilen
skal have (fx MA-04-gabbro-1.jpeg), og beskær den her. Kræver Pillow (PIL).
"""

import io
import json
import re
import threading
import webbrowser
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, parse_qs, urlsplit

from PIL import Image, ImageOps

MAPPE = Path(__file__).resolve().parent
BILLEDER = MAPPE / 'billeder'
ORIGINALER = BILLEDER / 'originaler'
UDSNIT = BILLEDER / 'udsnit.json'
SIDE = MAPPE / 'beskaer.html'
PORT = 8778

WEB_MAKS = (1200, 900)        # 4:3 — som LÆS-MIG.md foreskriver
WEB_GRAENSE = 300_000         # byte
VISNING_MAKS = 1600           # forhåndsvisningen i browseren
GYLDIGT_NAVN = re.compile(r'^[\w\-æøåÆØÅ]+$')
ENDELSER = ('.jpeg', '.jpg', '.png')

_laas = threading.Lock()
_visninger = {}               # navn → (mtime, jpeg-bytes)


def laes_udsnit():
    try:
        return json.loads(UDSNIT.read_text(encoding='utf-8'))
    except FileNotFoundError:
        return {}


def original(navn):
    for e in ENDELSER:
        p = ORIGINALER / (navn + e)
        if p.exists():
            return p
    return None


def kilde(navn):
    """Originalen, hvis den findes — ellers webfilen selv."""
    return original(navn) or (BILLEDER / (navn + '.jpg'))


# drej er grader med uret: 0, 90, 180 eller 270
DREJNINGER = {90: Image.Transpose.ROTATE_270, 180: Image.Transpose.ROTATE_180,
              270: Image.Transpose.ROTATE_90}


def aabn(sti, drej=0):
    im = ImageOps.exif_transpose(Image.open(sti)).convert('RGB')
    return im.transpose(DREJNINGER[drej]) if drej else im


def tjek_drej(v):
    d = int(v or 0) % 360
    if d not in (0, 90, 180, 270):
        raise ValueError('drej skal være 0, 90, 180 eller 270')
    return d


def alle_navne():
    web = {p.stem for p in BILLEDER.glob('*.jpg')}
    orig = {p.stem for p in ORIGINALER.glob('*') if p.suffix.lower() in ENDELSER}
    return sorted(web | orig)


def liste():
    udsnit = laes_udsnit()
    ud = []
    for navn in alle_navne():
        k = kilde(navn)
        with Image.open(k) as im:
            b, h = im.size
            if ImageOps.exif_transpose(im).size != (b, h):
                b, h = h, b
        web = BILLEDER / (navn + '.jpg')
        ud.append({
            'navn': navn,
            'web': web.exists(),
            'original': original(navn) is not None,
            'bredde': b, 'hoejde': h,
            'udsnit': udsnit.get(navn + '.jpg'),
            'aendret': web.stat().st_mtime if web.exists() else 0,
        })
    return ud


def visning(navn, drej=0):
    k = kilde(navn)
    mt = k.stat().st_mtime
    gemt = _visninger.get((navn, drej))
    if gemt and gemt[0] == mt:
        return gemt[1]
    im = aabn(k, drej)
    im.thumbnail((VISNING_MAKS, VISNING_MAKS), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=85)
    _visninger[(navn, drej)] = (mt, buf.getvalue())
    return buf.getvalue()


def beskaer(navn, x, y, b, drej=0):
    """x, y, b er brøkdele af den drejede kildes bredde og højde;
    højden følger af 4:3."""
    web = BILLEDER / (navn + '.jpg')
    # Uden original bliver den ubeskårne webfil gemt som original først —
    # ellers ville næste beskæring skære i et allerede beskåret billede.
    if original(navn) is None:
        if not web.exists():
            raise ValueError('ingen kilde')
        ORIGINALER.mkdir(exist_ok=True)
        (ORIGINALER / (navn + '.jpg')).write_bytes(web.read_bytes())
    im = aabn(original(navn), drej)
    W, H = im.size
    bp = round(b * W)
    hp = round(bp * 3 / 4)
    if not (0 < bp <= W and 0 < hp <= H):
        raise ValueError('udsnittet er større end billedet')
    xp = min(max(0, round(x * W)), W - bp)
    yp = min(max(0, round(y * H)), H - hp)
    ud = im.crop((xp, yp, xp + bp, yp + hp))
    ud.thumbnail(WEB_MAKS, Image.LANCZOS)
    for q in (82, 78, 74, 70, 65):
        buf = io.BytesIO()
        ud.save(buf, 'JPEG', quality=q, optimize=True, progressive=True)
        if buf.tell() < WEB_GRAENSE:
            break
    web.write_bytes(buf.getvalue())

    alle = laes_udsnit()
    alle[navn + '.jpg'] = {'x': round(xp / W, 4), 'y': round(yp / H, 4), 'b': round(bp / W, 4)}
    if drej:
        alle[navn + '.jpg']['drej'] = drej
    UDSNIT.write_text(json.dumps(dict(sorted(alle.items())), ensure_ascii=False, indent=1) + '\n',
                      encoding='utf-8')
    return {'bredde': ud.size[0], 'hoejde': ud.size[1], 'kb': buf.tell() // 1000, 'kvalitet': q}


class Handler(BaseHTTPRequestHandler):
    def send(self, kode, data, type_='application/json; charset=utf-8'):
        if isinstance(data, (dict, list)):
            data = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(kode)
        self.send_header('Content-Type', type_)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def navn_fra(self, sti, praefiks):
        navn = unquote(sti[len(praefiks):])
        if not GYLDIGT_NAVN.match(navn) or navn not in alle_navne():
            return None
        return navn

    def do_GET(self):
        sti = self.path.split('?')[0]
        if sti in ('/', '/beskaer.html'):
            return self.send(200, SIDE.read_bytes(), 'text/html; charset=utf-8')
        if sti == '/api/billeder':
            return self.send(200, liste())
        if sti.startswith('/visning/'):
            navn = self.navn_fra(sti, '/visning/')
            if navn:
                q = parse_qs(urlsplit(self.path).query)
                try:
                    drej = tjek_drej(q.get('drej', ['0'])[0])
                except ValueError as e:
                    return self.send(400, {'fejl': str(e)})
                return self.send(200, visning(navn, drej), 'image/jpeg')
        if sti.startswith('/web/'):
            navn = self.navn_fra(sti, '/web/')
            web = navn and BILLEDER / (navn + '.jpg')
            if web and web.exists():
                return self.send(200, web.read_bytes(), 'image/jpeg')
        self.send(404, {'fejl': 'findes ikke'})

    def do_POST(self):
        if self.path != '/api/beskaer':
            return self.send(404, {'fejl': 'findes ikke'})
        try:
            d = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
            navn = d['navn']
            if not GYLDIGT_NAVN.match(navn) or navn not in alle_navne():
                raise ValueError('ukendt billede')
            with _laas:
                svar = beskaer(navn, float(d['x']), float(d['y']), float(d['b']), tjek_drej(d.get('drej')))
            print(f'  {navn}.jpg  {svar["bredde"]} × {svar["hoejde"]} px, {svar["kb"]} kB')
            self.send(200, svar)
        except (KeyError, ValueError, TypeError) as e:
            self.send(400, {'fejl': str(e)})

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    url = f'http://localhost:{PORT}/'
    print(f'Beskæringsværktøjet kører på {url} — stop med Ctrl+C.')
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStoppet. Husk at committe de beskårne billeder og udsnit.json.')
