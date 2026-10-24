"""Lagmenu: underpunkter, direkte nøgletalsvalg, lagstatus og tastatur/mobil."""
import os
import re
from pathlib import Path
from playwright.sync_api import expect, sync_playwright
from lagmenu_hjaelp import aabn_lag, luk_lag
from piletaster import billede

SKAERME = [(1280, 577), (1366, 625), (1536, 730), (390, 750), (640, 625)]


def afproev_lagmenu(browser, adresse, ud):
    for w, h in SKAERME:
        side = browser.new_page(viewport={'width': w, 'height': h}, has_touch=w == 390, reduced_motion='reduce')
        fejl = []
        side.on('pageerror', lambda e: fejl.append(str(e)))
        side.goto(adresse + '/atlas/')
        side.wait_for_function("document.querySelector('#kortstatus').hidden")
        side.evaluate('document.fonts.ready')
        ud.mkdir(parents=True, exist_ok=True)
        trigger = side.locator('#lag-aabn')
        menu = side.locator('#lagmenu')
        figur = side.locator('#globus').bounding_box()
        expect(side.locator('.vaerktoejer .lagknap')).to_have_count(0)
        expect(menu).to_be_hidden()
        trigger.focus(); side.keyboard.press('Enter')
        expect(trigger).to_have_attribute('aria-expanded', 'true')
        expect(menu).to_be_visible()
        assert side.locator('#globus').bounding_box() == figur, 'menuen må ikke ændre figurens størrelse'
        assert menu.bounding_box()['y'] >= 0
        assert menu.bounding_box()['y'] + menu.bounding_box()['height'] <= h
        # Pile i underpunkterne flytter fokus, aldrig globussen.
        geologi = side.locator('#lag-geologi summary')
        geologi.focus(); foer = billede(side)
        side.keyboard.press('ArrowDown')
        expect(side.locator('#lag-klima summary')).to_be_focused()
        assert billede(side) == foer
        side.keyboard.press('End'); side.keyboard.press('Enter')
        expect(side.locator('#lag-demografi')).to_have_attribute('open', '')
        expect(side.locator('#lag-indikator')).to_be_enabled()
        expect(side.locator('#lag-indikator option')).to_have_count(21)
        assert not side.evaluate("performance.getEntriesByType('resource').some(r => r.name.endsWith('/data/demografi.json'))")
        # En indikator vælges direkte i menuen og synkroniseres med signaturen.
        side.locator('#lag-indikator').select_option('hdi')
        expect(side.locator('#temalag')).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('#temaindikator')).to_have_value('hdi')
        expect(side.locator('#lag-antal')).to_have_text('1')
        expect(side.locator('#lagmenu-status')).to_contain_text('HDI')
        side.keyboard.press('Escape')
        expect(trigger).to_be_focused(); expect(menu).to_be_hidden()
        side.locator('#temaindikator').select_option('cbr')
        aabn_lag(side, side.locator('#temalag'))
        expect(side.locator('#lag-indikator')).to_have_value('cbr')
        # Klima udelukker landenes temafarver, men kan kombineres med geologi.
        side.locator('#lag-klima summary').click()
        side.locator('#lag-klimasystem').select_option('koppen')
        expect(side.locator('#klimalag')).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('#temalag')).to_have_attribute('aria-pressed', 'false')
        luk_lag(side)
        expect(side.locator('[name="klimasystem"][value="koppen"]')).to_be_checked()
        side.locator('[name="klimasystem"][value="vahl"]').check()
        aabn_lag(side, side.locator('#klimalag'))
        expect(side.locator('#lag-klimasystem')).to_have_value('vahl')
        for id_ in ['pladelag', 'skaelvlag', 'vulkanlag', 'havbundlag']:
            k = aabn_lag(side, side.locator('#' + id_))
            k.tap() if w == 390 else k.click()
            expect(k).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('#lag-antal')).to_have_text('5')
        expect(side.locator('#lag-geologi .gruppe-antal')).to_have_text('4 valgt')
        side.wait_for_function("document.querySelector('#lagmenu').getBoundingClientRect().bottom <= innerHeight")
        side.screenshot(path=str(ud / f'lagmenu-geologi-{w}.png'))
        luk_lag(side)
        # Menuknap og antal er bevaret i fokusvisning. Escape lukker først menuen.
        side.locator('#fokus').click(); trigger.click()
        side.keyboard.press('Escape')
        expect(menu).to_be_hidden(); expect(side.locator('body')).to_have_class(re.compile('fokus'))
        side.keyboard.press('Escape'); expect(side.locator('.site-header')).to_be_visible()
        assert side.evaluate('document.documentElement.scrollWidth === innerWidth')
        # En indlæsningsfejl skal kunne læses uden først at lukke menuen.
        if w == 390:
            aabn_lag(side, side.locator('#vulkanlag')).click()
            expect(side.locator('#vulkanlag')).to_have_attribute('aria-pressed', 'false')
            luk_lag(side)
            side.route('**/data/jordskaelv.json', lambda r: r.fulfill(status=500, body=''))
            # Nyt dokument, så det allerede hentede katalog ikke skjuler fejlprøven.
            side.reload(); side.wait_for_function("document.querySelector('#kortstatus').hidden")
            aabn_lag(side, side.locator('#skaelvlag')).click()
            expect(side.locator('#lagmenu-fejl')).to_be_visible()
            expect(side.locator('#lagmenu-fejl')).to_contain_text('kunne ikke indlæses')
            side.unroute('**/data/jordskaelv.json')
            aabn_lag(side, side.locator('#skaelvlag')).click()
            expect(side.locator('#skaelvlag')).to_have_attribute('aria-pressed', 'true')
            expect(side.locator('#lagmenu-fejl')).to_be_hidden()
        assert not fejl, fejl
        print(f'{w}×{h}: lagmenu, kategorier, 17 nøgletal, synkronisering, kombinationer og fokus OK', flush=True)
        side.close()


if __name__ == '__main__':
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/usr/bin/chromium'), headless=True)
        afproev_lagmenu(browser, os.environ.get('ATLAS_URL', 'http://localhost:8777'), Path('/tmp/smbi-lagmenu-test'))
        browser.close()
