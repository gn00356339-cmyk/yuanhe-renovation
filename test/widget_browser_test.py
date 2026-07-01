from playwright.sync_api import sync_playwright
import time
URL="https://yuanhe-renovation.pages.dev/?cb="+str(int(time.time()))
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page()
    errs=[]; logs=[]
    pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL, wait_until="networkidle", timeout=30000)
    # live 程式是哪版?
    api = pg.evaluate("()=>{var s=[...document.scripts].map(x=>x.textContent).join('');var m=s.match(/var API = \"([^\"]+)\"/);return m?m[1]:'(找不到 API const)'}")
    has_hide = pg.evaluate("()=>[...document.scripts].some(x=>x.textContent.includes('function hide()'))")
    print("live API URL:", api)
    print("live 有 function hide():", has_hide)
    # 點開
    pg.click("#yhc-fab"); pg.wait_for_timeout(2500)
    panel_vis_after_open = pg.is_visible("#yhc-panel")
    print("點開後 panel 可見:", panel_vis_after_open)
    msgs = pg.eval_on_selector("#yhc-msgs", "el=>el.innerText")
    print("面板訊息(前120字):", msgs[:120].replace("\n","｜"))
    # 在瀏覽器 context 直接測 /health(看 CORS/網路)
    health = pg.evaluate(f"async()=>{{try{{const r=await fetch('{api}/health');return 'HTTP '+r.status}}catch(e){{return 'ERR '+e.message}}}}")
    print("瀏覽器內 fetch /health:", health)
    # 點 ✕ 關閉
    pg.click("#yhc-close"); pg.wait_for_timeout(500)
    panel_vis_after_close = pg.is_visible("#yhc-panel")
    fab_vis_after_close = pg.is_visible("#yhc-fab")
    print("按✕後 panel 可見:", panel_vis_after_close, "| fab 可見:", fab_vis_after_close)
    print("--- pageerror ---"); [print(" ", e) for e in errs] or print("  (無)")
    print("--- console(尾5)---"); [print(" ", l) for l in logs[-5:]] or print("  (無)")
    b.close()
