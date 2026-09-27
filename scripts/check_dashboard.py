import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.audit-tools'))
from playwright.sync_api import sync_playwright
out=ROOT/'docs/dashboard-update';out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True)
 for width,height in [(320,740),(390,844),(768,1024),(1024,768),(1440,1000)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
  page.locator('.dashboard').scroll_into_view_if_needed()
  assert '93,97' in page.locator('.metric-secondary').nth(1).inner_text()
  assert page.locator('.recharts-bar-rectangle').count()==5
  for element in page.locator('.dashboard button, .dashboard select, .dashboard h4').all():
   if element.is_visible():
    box=element.bounding_box();assert box['x']>=-1 and box['x']+box['width']<=width+1,box
  if width in [390,1440]: page.locator('.dashboard').screenshot(path=str(out/f'{width}-bars.png'))
  page.get_by_role('button',name='Pizza',exact=True).focus();page.keyboard.press('Enter')
  assert page.get_by_role('button',name='Pizza',exact=True).get_attribute('aria-pressed')=='true'
  assert page.locator('.recharts-pie-sector').count()==5
  assert len(page.locator('.recharts-pie-label-text').all_text_contents())==5
  page.add_script_tag(path=str(ROOT/'.audit-tools-js/node_modules/axe-core/axe.min.js'))
  for mode in ['pie','bar']:
   if mode=='bar':page.get_by_role('button',name='Barras',exact=True).click()
   axe=page.evaluate('async()=>await axe.run(document.querySelector(".dashboard"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}})')
   assert not axe['violations'],[(v['id'],[n['failureSummary'] for n in v['nodes']]) for v in axe['violations']]
  page.get_by_role('button',name='Pizza',exact=True).click()
  if width in [320,390,1440]: page.locator('.dashboard').screenshot(path=str(out/f'{width}-pie.png'))
  sector=page.locator('.recharts-pie-sector path').first
  box=sector.bounding_box()
  sector.click(position={'x':box['width']*.85,'y':box['height']*.4})
  assert page.locator('.transaction').count()==1
  assert '1.186,70' in page.locator('.pie-center').inner_text()
  page.get_by_role('button',name='Barras',exact=True).click()
  assert page.get_by_role('button',name='Alimenta\u00e7\u00e3o').get_attribute('aria-pressed')=='true'
  page.get_by_role('button',name='Mostrar todas as categorias').click()
  page.locator('.recharts-bar-rectangle path').first.click()
  assert page.locator('.transaction').count()==1
  page.get_by_role('button',name='Junho',exact=True).click()
  assert '99,20' in page.locator('.metric-secondary').nth(1).inner_text()
  assert '30 dias' in page.locator('.metric-secondary').nth(1).inner_text()
  page.get_by_role('button',name='3 meses',exact=True).click()
  assert '98,91' in page.locator('.metric-secondary').nth(1).inner_text()
  assert '92 dias' in page.locator('.metric-secondary').nth(1).inner_text()
  page.get_by_role('button',name='Ordenar por categoria',exact=True).click()
  assert 'Assinaturas' in page.locator('.breakdown-list button').nth(1).inner_text()
  page.get_by_role('button',name='Assinaturas').click()
  assert page.locator('.transaction').count()==3
  page.get_by_role('button',name='Pizza',exact=True).click()
  assert '539,10' in page.locator('.pie-center').inner_text()
  if width in [390,1440]:page.locator('.dashboard').screenshot(path=str(out/f'{width}-filtered.png'))
  page.reload(wait_until='networkidle')
  assert page.get_by_role('button',name='Pizza',exact=True).get_attribute('aria-pressed')=='true'
  assert page.get_by_role('button',name='Ordenar por categoria',exact=True).get_attribute('aria-pressed')=='true'
  assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
  assert not errors,errors
  results.append({'width':width,'modes':'bar,pie','daily_average':'passed','filter_clicks':'passed','keyboard':'passed','preference_reload':'passed','axe_violations':0,'page_errors':errors})
  page.close()
 # Live resize must update chart geometry without replacing the chosen view.
 page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
 page.get_by_role('button',name='Pizza',exact=True).click()
 page.set_viewport_size({'width':320,'height':740})
 page.wait_for_timeout(300)
 chart=page.locator('.chart-wrap').bounding_box()
 assert chart['x']>=0 and chart['x']+chart['width']<=320
 assert page.locator('.recharts-pie-sector').count()==5
 # Storage denial must not break the customization controls.
 page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
 page.add_init_script('Object.defineProperty(window,"localStorage",{get(){throw new DOMException("Storage denied","SecurityError")}})')
 page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
 page.get_by_role('button',name='Pizza',exact=True).click()
 assert page.locator('.recharts-pie-sector').count()==5
 browser.close()
(out/'checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,indent=2))
