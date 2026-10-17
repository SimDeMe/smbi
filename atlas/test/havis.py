"""Afprøv Havisens udbredelse: polygoner, måned og år, tal, graf, drejning og aflæsning."""
from lagmenu_hjaelp import aabn_lag, luk_lag
import json
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede

DATA = Path(__file__).parents[1] / 'data'


def punkt_paa_skaerm(side, lonlat, centrum, zoom):
    """Skærmpunkt for [lon, lat], når globussen er drejet til centrum med zoom."""
    boks = side.locator('#globus').bounding_box()
    x, y = side.evaluate('''([p, c, z]) => {
      const r = document.querySelector('#globus').getBoundingClientRect();
      return d3.geoOrthographic().translate([r.width / 2, r.height / 2])
        .scale(Math.min(r.width, r.height) * .455 * z).rotate([-c[0], -c[1]])(p);
    }''', [lonlat, centrum, zoom])
    return boks['x'] + x, boks['y'] + y


def afproev_havis(side, ud):
    luk_lag(side)
    data = json.loads((DATA / 'havis.json').read_text())
    sep = dict(map(tuple, data['serie']['N-9']))
    knap, signatur = side.locator('#havislag'), side.locator('#havissignatur')
    aflaesning = side.locator('#havisaflaesning')
    side.get_by_role('button', name='Nulstil', exact=True).click()
    foer = billede(side)
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(signatur).to_be_visible()
    expect(side.locator('#havistitel')).to_have_text('Havis i september 2025')
    tal = lambda v: f'{v:.1f}'.replace('.', ',')
    expect(side.locator('#havistal')).to_contain_text(f'Arktis: {tal(sep[2025])} mio. km²')
    assert billede(side) != foer, 'Havisen tegnes ikke'
    assert 'NSIDC' in side.locator('#globus').get_attribute('aria-label')
    expect(side.locator('#havisgraf polyline')).to_have_count(2)
    nu = billede(side)
    side.locator('#havisaar label', has_text='1980').click()
    expect(side.locator('#havistitel')).to_have_text('Havis i september 1980')
    expect(side.locator('#havistal')).to_contain_text(f'Arktis: {tal(sep[1980])} mio. km²')
    assert billede(side) != nu, 'Årsskift tegner ikke om'
    side.locator('#havissignatur label', has_text='Marts').click()
    expect(side.locator('#havistitel')).to_have_text('Havis i marts 1980')
    side.locator('#havissignatur label', has_text='September').click()
    # Drej til Arktis; midt i Polarhavet er der is, også i 2025.
    side.get_by_role('button', name='Vis Arktis', exact=True).click()
    side.locator('#havisaar label', has_text='2025').click()
    if side.viewport_size['width'] >= 900:
        side.mouse.move(*punkt_paa_skaerm(side, [150, 86], centrum=[-40, 78], zoom=1.15))
        expect(aflaesning).to_have_text('Ved markøren: havis i september 2025')
    side.locator('#havismedian').uncheck()
    side.locator('#havismedian').check()
    maal = side.evaluate('''() => {
      const r = document.querySelector('#havissignatur').getBoundingClientRect();
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')].map(k => k.getBoundingClientRect());
      const overlap = kontroller.some(k => !(k.right <= r.left || k.left >= r.right || k.bottom <= r.top || k.top >= r.bottom));
      const aar = document.querySelector('#havisaar');
      return {overlap, aar: aar.scrollWidth - aar.clientWidth, vandret: document.documentElement.scrollWidth - innerWidth};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0 and maal['aar'] <= 0, maal
    side.screenshot(path=str(ud / f"havis-{side.viewport_size['width']}x{side.viewport_size['height']}.png"))
    side.locator('#havisopgave').click()
    expect(side.locator('#dialogtitel')).to_have_text('Undersøg havisen')
    side.keyboard.press('Escape')
    side.get_by_role('button', name='Nulstil', exact=True).click()
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
