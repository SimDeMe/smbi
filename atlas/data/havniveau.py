#!/usr/bin/env python3
"""Danner havniveau.json til atlassets lag «Havniveau ved kysten» (Klimaforandringer).

Kilde: Permanent Service for Mean Sea Level (PSMSL), Revised Local Reference
(RLR), årlige middelvandstande fra tidevandsstationer (Holgate m.fl. 2013).
  https://psmsl.org/data/obtaining/rlr.annual.data/rlr_annual.zip
Uden argument hentes filen til raa-psmsl/ ved siden af scriptet (ikke i git).

Brug:
  python -I atlas/data/havniveau.py [rlr_annual.zip]

Bearbejdning:
- Tendensen er hældningen af en ret linje (mindste kvadraters metode) gennem
  stationens årsmidler 1960–2024, i mm pr. år.
- Kun stationer, der ikke er markeret til opmærksomhed i PSMSL's liste, med
  mindst 40 år med data i perioden, første år senest 1975 og sidste år
  tidligst 2010. Så dækker alle tendenser stort set samme tidsrum.
- Årsmidler med en markering for opmærksomhed (sidste kolonne ≠ 000)
  udelades.
- Tallene er relative: de viser havets stigning i forhold til land ved
  stationen. Hæver landet sig (fx efter istiden i Skandinavien), falder
  havet; synker landet (fx ved store deltaer), stiger det ekstra.
- Stationen gemmes med navn, position, tendens, antal år, første og sidste
  år og årsmidlerne (afvigelse fra stationens middel i mm) til en lille graf.
"""
import io, json, sys, urllib.request, zipfile
from pathlib import Path

HER = Path(__file__).parent
URL = 'https://psmsl.org/data/obtaining/rlr.annual.data/rlr_annual.zip'
FRA, TIL = 1960, 2024
MIN_AAR, SENEST_START, TIDLIGST_SLUT = 40, 1975, 2010
INGEN = -99999


def hent():
    sti = HER / 'raa-psmsl' / 'rlr_annual.zip'
    if not sti.exists():
        sti.parent.mkdir(exist_ok=True)
        urllib.request.urlretrieve(URL, sti)
    return sti


# PSMSL skriver uden æ, ø og å; de danske stationer får deres rigtige navne.
DANSKE = {'Kobenhavn': 'København', 'Hornbaek': 'Hornbæk', 'Korsor': 'Korsør', 'Rodbyhavn': 'Rødbyhavn'}


def navn(raa):
    # PSMSL skriver navne med versaler; »CUXHAVEN 2« → »Cuxhaven 2«.
    romertal = {'II', 'III', 'IV', 'VI'}
    ord_ = [o if o.rstrip(',') in romertal else '-'.join(d.capitalize() for d in o.split('-')) for o in raa.strip().split()]
    tekst = ' '.join(ord_)
    return DANSKE.get(tekst, tekst)


def main():
    sti = Path(sys.argv[1]) if len(sys.argv) > 1 else hent()
    z = zipfile.ZipFile(sti)
    liste = z.read('rlr_annual/filelist.txt').decode('latin-1').splitlines()
    stationer = []
    for linje in liste:
        f = [x.strip() for x in linje.split(';')]
        if len(f) < 7 or f[6] == 'Y':
            continue
        id_, lat, lon = int(f[0]), float(f[1]), float(f[2])
        try:
            data = z.read(f'rlr_annual/data/{id_}.rlrdata').decode('latin-1').splitlines()
        except KeyError:
            continue
        punkter = []
        for r in data:
            d = [x.strip() for x in r.split(';')]
            aar, v = int(d[0]), int(d[1])
            if FRA <= aar <= TIL and v != INGEN and d[3] == '000':
                punkter.append((aar, v))
        if len(punkter) < MIN_AAR or punkter[0][0] > SENEST_START or punkter[-1][0] < TIDLIGST_SLUT:
            continue
        n = len(punkter)
        mx = sum(a for a, _ in punkter) / n
        my = sum(v for _, v in punkter) / n
        haeldning = sum((a - mx) * (v - my) for a, v in punkter) / sum((a - mx) ** 2 for a, _ in punkter)
        stationer.append({'id': id_, 'navn': navn(f[3]), 'punkt': [round(lon, 3), round(lat, 3)],
                          'mm': round(haeldning, 2), 'n': n, 'fra': punkter[0][0], 'til': punkter[-1][0],
                          'serie': [[a, round(v - my)] for a, v in punkter]})
    stationer.sort(key=lambda s: s['mm'])
    ud = {'kilde': 'PSMSL Revised Local Reference (RLR), årsmidler', 'periode': [FRA, TIL], 'stationer': stationer}
    (HER / 'havniveau.json').write_text(json.dumps(ud, ensure_ascii=False, separators=(',', ':')))
    mm = sorted(s['mm'] for s in stationer)
    print(len(stationer), 'stationer; median', mm[len(mm) // 2], 'mm/år; min', mm[0], 'maks', mm[-1])
    for s in stationer:
        if s['navn'].split()[0] in {'Esbjerg', 'Frederikshavn', 'Hornbæk', 'Gedser', 'Stockholm', 'Bangkok', 'Aarhus', 'Kobenhavn'}:
            print(s['navn'], s['mm'], s['n'], s['fra'], s['til'])
    print('havniveau.json', (HER / 'havniveau.json').stat().st_size, 'byte')


if __name__ == '__main__':
    main()
