import json,sys,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.audit-tools'))
from playwright.sync_api import sync_playwright
out=ROOT/'docs/carousel-update';out.mkdir(parents=True,exist_ok=True)
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(channel='chrome',headless=True)
 for width,height in [(320,740),(390,844),(768,1024),(1024,768),(1440,1000)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
  carousel=page.get_by_role('region',name='Descobertas com dados demonstrativos')
  carousel.scroll_into_view_if_needed()
  page.add_script_tag(path=str(ROOT/'.audit-tools-js/node_modules/axe-core/axe.min.js'))
  stage_heights=[]
  for slide in range(3):
   if slide:page.get_by_role('button',name='Próximo exemplo').click()
   stage_heights.append(page.locator('.carousel-stage').bounding_box()['height'])
   assert page.locator('.insight-slide.is-active').count()==1
   assert page.locator('.insight-slide.is-active').get_attribute('aria-label').startswith(str(slide+1))
   axe=page.evaluate('async()=>await axe.run(document.querySelector(".insight-carousel"),{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}})')
   assert not axe['violations'],[(v['id'],[n['failureSummary'] for n in v['nodes']]) for v in axe['violations']]
   for element in carousel.locator('button, a, h3, .carousel-visual').all():
    box=element.bounding_box();assert box['x']>=-1 and box['x']+box['width']<=width+1,box
   if width in [390,1440]:carousel.screenshot(path=str(out/f'{width}-slide-{slide+1}.png'))
  assert max(stage_heights)-min(stage_heights)<1,stage_heights
  page.get_by_role('button',name='Próximo exemplo').focus();page.keyboard.press('ArrowRight')
  assert page.locator('.insight-slide.is-active').get_attribute('aria-label').startswith('1')
  page.keyboard.press('ArrowLeft')
  assert page.locator('.insight-slide.is-active').get_attribute('aria-label').startswith('3')
  assert page.get_by_role('button',name='Próximo exemplo').evaluate('(el)=>el===document.activeElement')
  page.locator('.insight-slide.is-active .carousel-cta').click();assert page.url.endswith('#demo')
  page.get_by_role('button',name='Pizza',exact=True).click()
  plot=page.locator('.chart-wrap');plot.scroll_into_view_if_needed()
  total_text=page.locator('.pie-center').inner_text()
  plot_box=plot.bounding_box();center={'x':plot_box['x']+plot_box['width']/2,'y':plot_box['y']+plot_box['height']/2}
  radius=min(138,max(68,(plot_box['width']-64)/2))*.83
  # Hover the midpoint of each wedge. Check actual geometry, not just z-index.
  values=[1186.7,734.3,418.5,393.8,179.7];names=['Alimentação','Transporte','Lazer','Outros','Assinaturas'];angle=-90
  for name,value in zip(names,values):
   span=value/2913*360;mid=math.radians(angle+span/2)
   page.mouse.move(center['x']+math.cos(mid)*radius,center['y']+math.sin(mid)*radius)
   page.wait_for_timeout(70)
   assert name in page.locator('.chart-detail').inner_text(),(width,name,page.locator('.chart-detail').inner_text())
   assert page.locator('.pie-center').inner_text()==total_text
   detail=page.locator('.chart-detail').bounding_box();chart=plot.bounding_box()
   assert detail['y']>=chart['y']+chart['height']-1,(detail,chart)
   assert page.locator('.recharts-tooltip-wrapper').count()==0
   angle+=span
  if width in [320,390,1440]:
   bounds=page.locator('.dashboard-main').bounding_box();scroll=page.evaluate('scrollY')
   page.screenshot(path=str(out/f'{width}-pie-hover.png'),full_page=True,clip={'x':bounds['x'],'y':bounds['y']+scroll,'width':bounds['width'],'height':bounds['height']})
  page.get_by_role('button',name='Ordenar por categoria',exact=True).focus();page.keyboard.press('Enter')
  assert page.get_by_role('button',name='Ordenar por categoria',exact=True).get_attribute('aria-pressed')=='true'
  page.get_by_role('button',name='Transporte').focus()
  assert '734,30' in page.locator('.chart-detail').inner_text()
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  assert not errors,errors
  checks.append({'width':width,'carousel_slides':3,'keyboard':'passed','pie_hover_all_categories':'passed','hover_overlaps':0,'axe_violations':0,'runtime_errors':errors})
  page.close()
 # Autoplay, pause, focus and reduced-motion behavior.
 page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='no-preference')
 page.goto('http://127.0.0.1:5173/',wait_until='networkidle')
 page.get_by_role('region',name='Descobertas com dados demonstrativos').scroll_into_view_if_needed()
 page.mouse.move(1,1)
 page.wait_for_timeout(9500)
 assert page.locator('.insight-slide.is-active').get_attribute('aria-label').startswith('2')
 page.get_by_role('button',name='Pausar carrossel').click()
 assert page.get_by_role('button',name='Ativar reprodução automática').count()==1
 before=page.locator('.insight-slide.is-active').get_attribute('aria-label');page.mouse.move(1,1);page.wait_for_timeout(9500)
 assert page.locator('.insight-slide.is-active').get_attribute('aria-label')==before
 page.get_by_role('button',name='Ativar reprodução automática').click()
 page.get_by_role('button',name='Próximo exemplo').focus()
 assert page.get_by_role('button',name='Ativar reprodução automática').count()==1
 page.emulate_media(reduced_motion='reduce')
 assert page.get_by_role('button',name='Ativar reprodução automática').count()==0
 page.get_by_role('button',name='Exemplo anterior').click()
 assert page.locator('.insight-slide.is-active').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
 checks.append({'autoplay':'passed','pause':'passed','focus_stops_autoplay':'passed','reduced_motion':'passed'})
 browser.close()
(out/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(checks,ensure_ascii=True,indent=2))
