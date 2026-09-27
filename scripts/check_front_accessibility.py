import sys, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'.audit-tools'))
from playwright.sync_api import sync_playwright
out=ROOT/'docs/front-audit'
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True)
 for width,height in [(320,740),(390,844),(568,320),(768,1024),(820,900),(1024,768),(1440,1000)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
  page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
  page.add_script_tag(path=str(ROOT/'.audit-tools-js/node_modules/axe-core/axe.min.js'))
  axe=page.evaluate('async()=>await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}})')
  violations=[{'id':v['id'],'impact':v['impact'],'nodes':[{'target':n['target'],'summary':n['failureSummary']} for n in v['nodes']]} for v in axe['violations']]
  assert not violations, violations
  for element in page.locator('h1, .hero-copy > p, button, .button, .text-link').all():
   if element.is_visible():
    bounds=element.bounding_box()
    assert bounds['x'] >= -1 and bounds['x']+bounds['width'] <= width+1, bounds
  for target in ['porque-usar','como-funciona','relatorios','demo']:
   if width<=1000: page.get_by_role('button',name='Abrir menu').click()
   page.locator(f'nav a[href="#{target}"]').click()
   assert page.url.endswith('#'+target)
  page.get_by_role('button',name='Julho',exact=True).click()
  assert page.locator('.metric-primary strong .sr-only').inner_text()=='R$\xa03.211,00'
  page.get_by_role('button',name='Outros').focus()
  page.keyboard.press('Enter')
  assert page.locator('.transaction').count()==1
  assert '1 de 1' in page.get_by_role('status').inner_text()
  page.get_by_role('button',name='Mostrar todas as categorias').click()
  assert page.locator('.transaction').count()==4
  assert not page.get_by_role('button',name='Outros').get_attribute('aria-pressed')=='true'
  overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth')
  assert not overflow
  results.append({'width':width,'height':height,'overflow':overflow,'violations':violations})
  if width==390:
   page.evaluate('scrollTo(0,0)')
   page.get_by_role('button',name='Abrir menu').click()
   page.locator('.mobile-auth a').last.focus()
   page.keyboard.press('Tab')
   assert page.get_by_role('button',name='Abrir menu').get_attribute('aria-expanded')=='false'
   for route in ['login','register']:
    page.goto('http://127.0.0.1:5173/'+route,wait_until='networkidle')
    page.add_script_tag(path=str(ROOT/'.audit-tools-js/node_modules/axe-core/axe.min.js'))
    access=page.evaluate('async()=>await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}})')
    assert not access['violations'], access['violations']
    results.append({'route':route,'violations':[{'id':v['id'],'nodes':[n['target'] for n in v['nodes']]} for v in access['violations']]})
  if width==1440:
   zoom=browser.new_page(viewport={'width':720,'height':500},device_scale_factor=2,reduced_motion='reduce')
   zoom.goto('http://127.0.0.1:5173/',wait_until='networkidle')
   assert not zoom.evaluate('document.documentElement.scrollWidth > innerWidth')
   for element in zoom.locator('h1, .hero-copy > p, button, .button, .text-link').all():
    if element.is_visible():
     bounds=element.bounding_box()
     assert bounds['x']>=-1 and bounds['x']+bounds['width']<=721, bounds
   zoom.screenshot(path=str(out/'after/07-desktop-zoom.png'))
   zoom.close()
  page.close()
 page=browser.new_page(viewport={'width':1440,'height':1000})
 page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
 page.get_by_role('button',name='Junho',exact=True).click()
 page.wait_for_timeout(1000)
 assert page.locator('.metric-primary strong .sr-only').inner_text()=='R$\xa02.976,00'
 page.locator('.chart-panel').scroll_into_view_if_needed()
 page.locator('.recharts-bar-rectangle path').first.hover()
 page.locator('.chart-detail strong').wait_for(state='visible')
 page.screenshot(path=str(out/'after/08-desktop-tooltip.png'))
 browser.close()
(out/'accessibility-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=True,indent=2))
