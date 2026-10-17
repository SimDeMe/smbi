"""Testbetjening gennem den synlige lagmenu; klik aldrig på skjulte lag."""
from playwright.sync_api import expect


def aabn_lag(side, knap):
    if not side.locator('#lagmenu').evaluate("e => e.matches(':popover-open')"):
        side.locator('#lag-aabn').click()
    gruppe = knap.evaluate("e => e.closest('.laggruppe').id")
    detalje = side.locator('#' + gruppe)
    if not detalje.evaluate('e => e.open'):
        detalje.locator('summary').click()
    expect(knap).to_be_visible()
    return knap


def luk_lag(side):
    if side.locator('#lagmenu').evaluate("e => e.matches(':popover-open')"):
        side.locator('#lag-luk').click()
