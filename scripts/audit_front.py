"""Capture current UI; run with --verify after improvements."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.audit-tools'))
from playwright.sync_api import sync_playwright

stage = 'after' if '--verify' in sys.argv else 'before'
out = ROOT / 'docs' / 'front-audit' / stage
out.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    for name, width, height in [('desktop', 1440, 1000), ('mobile', 390, 844), ('small', 320, 740), ('tablet', 768, 1024)]:
        page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:5173/', wait_until='networkidle')
        page.screenshot(path=str(out / f'01-{name}-home.png'), full_page=True)
        if stage == 'after' and name == 'small':
            page.screenshot(path=str(out / '09-small-hero.png'))
        if stage == 'after' and name == 'mobile':
            page.locator('.dashboard').screenshot(path=str(out / '10-mobile-dashboard.png'))
        results.append({'viewport':name, 'overflow':page.evaluate('document.documentElement.scrollWidth > innerWidth'), 'main_sections':page.locator('main section').count(), 'controls':page.locator('button').all_text_contents()})
        if name in ['desktop', 'mobile']:
            page.locator('#demo').scroll_into_view_if_needed()
            page.screenshot(path=str(out / f'02-{name}-demo.png'))
            page.get_by_role('button', name='Junho', exact=True).click()
            assert page.locator('.metric-primary strong .sr-only').inner_text() == 'R$\xa02.976,00'
            page.get_by_role('button', name='3 meses', exact=True).click()
            assert page.locator('.metric-primary strong .sr-only').inner_text() == 'R$\xa09.100,00'
            page.get_by_role('button', name='Assinaturas').click()
            assert page.get_by_role('heading', name='Lançamentos em Assinaturas').is_visible()
            assert page.locator('.transaction').count() == 3
            page.screenshot(path=str(out / f'03-{name}-filtered.png'))
            page.get_by_role('button', name='Assinaturas').click()
            assert page.locator('.transaction').count() == 4
            page.get_by_role('button', name='Agosto', exact=True).click()
            assert page.locator('.metric-primary strong .sr-only').inner_text() == 'R$\xa02.913,00'
            if name == 'mobile':
                page.evaluate('scrollTo(0,0)')
                page.get_by_role('button', name='Abrir menu').click()
                page.screenshot(path=str(out / '04-mobile-menu.png'))
                if stage == 'after':
                    page.keyboard.press('Escape')
                    assert page.get_by_role('button', name='Abrir menu').get_attribute('aria-expanded') == 'false'
                    page.get_by_role('button', name='Abrir menu').click()
                page.get_by_role('navigation').get_by_role('link', name='Como funciona', exact=True).click()
                assert page.get_by_role('button', name='Abrir menu').get_attribute('aria-expanded') == 'false'
                assert page.url.endswith('#como-funciona')
            for route in ['login', 'register']:
                page.goto(f'http://127.0.0.1:5173/{route}', wait_until='networkidle')
                assert page.get_by_role('link', name='Explorar demonstração').is_visible()
                page.screenshot(path=str(out / f'05-{name}-{route}.png'))
                page.get_by_role('link', name='Explorar demonstração').click()
                page.wait_for_url('**/#demo')
                assert page.get_by_role('heading', name='Um extrato. Várias descobertas.').is_visible()
            if stage == 'after':
                page.goto('http://127.0.0.1:5173/', wait_until='networkidle')
                page.keyboard.press('Tab')
                assert page.get_by_role('link', name='Pular para o conteúdo').evaluate('(e)=>e===document.activeElement')
                page.screenshot(path=str(out / f'06-{name}-focus.png'))
                page.keyboard.press('Enter')
                assert page.locator('#main-content').evaluate('(e)=>e===document.activeElement')
        assert not errors, errors
        page.close()
    browser.close()
(out / 'checks.json').write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps(results, indent=2, ensure_ascii=False))
