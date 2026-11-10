"""HABBA admin dashboard — browser regression suite.

Run (server must already be serving the project root):
    python3 -m http.server 8080 --bind 0.0.0.0 --directory /home/user/habba
    python3 admin/tests/admin_test.py
"""
import sys
from playwright.sync_api import sync_playwright
BASE = "http://127.0.0.1:8080/admin/"
res, errs = [], []
def chk(n, c, x=""): res.append(("PASS" if c else "FAIL", n, x))

with sync_playwright() as pw:
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={"width":1440,"height":1000}, locale="ar-LY")
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE, wait_until="networkidle"); pg.evaluate("localStorage.clear()"); pg.reload(wait_until="networkidle"); pg.wait_for_timeout(400)

    # --- auth gate
    chk("dashboard requires login", pg.locator(".login-card").count() == 1)
    pg.goto(BASE + "#/orders"); pg.wait_for_timeout(400)
    chk("protected route shows login when signed out", pg.locator(".login-card").count() == 1)

    # --- invalid login
    pg.fill("#email", "owner@habba.store"); pg.fill("#password", "123")
    pg.click("#loginBtn"); pg.wait_for_timeout(400)
    chk("short password rejected", pg.locator("#loginErr").is_visible())

    # --- valid login
    pg.fill("#password", "owner123"); pg.click("#loginBtn"); pg.wait_for_timeout(1200)
    chk("login succeeds", pg.locator(".side").count() == 1)
    chk("dashboard stats render", pg.locator(".stat").count() >= 4)
    chk("no sales chart (explicitly excluded)", pg.locator("canvas, .chart, svg.chart").count() == 0)

    # --- orders
    pg.goto(BASE + "#/orders"); pg.wait_for_timeout(700)
    rows = pg.locator("table.adm tbody tr").count()
    chk("orders listed", rows == 6, f"rows={rows}")
    pg.locator("[data-ofilter='new']").click(); pg.wait_for_timeout(400)
    chk("status filter works", pg.locator("table.adm tbody tr").count() == 2)
    pg.locator("[data-ofilter='all']").click(); pg.wait_for_timeout(300)

    # --- order detail + status workflow + whatsapp
    pg.locator("a[href^='#/orders/']").first.click(); pg.wait_for_timeout(700)
    chk("order detail opens", pg.locator(".detail").count() == 1)
    wa = pg.locator("a[href^='https://wa.me/']").first.get_attribute("href")
    chk("whatsapp link uses customer number", wa and "wa.me/218" in wa, wa[:60])
    chk("whatsapp number is normalised (no double 218, 11-15 digits)",
        bool(wa) and not wa.startswith("https://wa.me/218218")
        and 11 <= len(wa.split("wa.me/")[1].split("?")[0]) <= 15, wa[:60])
    chk("whatsapp message is percent-encoded",
        "?text=" in wa and "%" in wa.split("?text=")[1], wa[:80])
    chk("order items snapshot shown", pg.locator(".items-table tbody tr").count() >= 1)
    if pg.locator("#statusSelect").count():
        pg.select_option("#statusSelect", pg.eval_on_selector("#statusSelect", "s=>s.options[1].value")); pg.wait_for_timeout(200)
        pg.click("#applyStatus"); pg.wait_for_timeout(900)
        chk("status update applies", pg.locator(".tag--green, .tag--blue").count() >= 1)

    # --- products
    pg.goto(BASE + "#/products"); pg.wait_for_timeout(800)
    chk("products listed", pg.locator("table.adm tbody tr").count() == 9)
    pg.locator("[data-pfilter='hidden']").click(); pg.wait_for_timeout(400)
    chk("hidden filter shows 1", pg.locator("table.adm tbody tr").count() == 1)
    pg.locator("[data-pfilter='discount']").click(); pg.wait_for_timeout(400)
    chk("discount filter shows 1", pg.locator("table.adm tbody tr").count() == 1)

    # --- toggle visibility
    pg.locator("[data-pfilter='all']").click(); pg.wait_for_timeout(300)
    before = pg.locator(".tag--muted").count()
    pg.locator("[data-toggle-visible]").first.click(); pg.wait_for_timeout(700)
    chk("visibility toggle changes state", pg.locator(".tag--muted").count() != before)

    # --- create product with discount validation
    pg.goto(BASE + "#/product-new"); pg.wait_for_timeout(800)
    pg.fill("#f-name_ar", "عطر تجريبي")
    pg.select_option("#f-brand", index=1)
    pg.select_option("#f-category", index=1)
    pg.fill("#f-size", "100 مل")
    pg.fill("#f-price", "200")
    pg.fill("#f-discount", "250")     # invalid: above price
    pg.click("#saveProduct"); pg.wait_for_timeout(700)
    chk("discount above price blocked in UI", pg.locator(".err").count() >= 1)

    pg.fill("#f-discount", "150")
    pg.click("#saveProduct"); pg.wait_for_timeout(1100)
    chk("product created and redirected", "#/products" in pg.url)
    chk("new product row exists", pg.locator("text=عطر تجريبي").count() >= 1)
    chk("discount badge shown", pg.locator(".tag--gold").count() >= 1)
    chk("new arrival badge (3-day rule)", pg.locator(".tag--blue").count() >= 1)

    # --- edit product
    pg.locator("a[href^='#/product-edit/']").first.click(); pg.wait_for_timeout(800)
    chk("edit form loads values", pg.input_value("#f-name_ar") != "")
    pg.fill("#f-price", "999"); pg.click("#saveProduct"); pg.wait_for_timeout(1000)
    chk("edit saves", "#/products" in pg.url)

    # --- brands: add + hide
    pg.goto(BASE + "#/brands"); pg.wait_for_timeout(700)
    chk("brands listed", pg.locator("table.adm tbody tr").count() == 3)
    chk("brand product counts are real, not 0",
        pg.evaluate("() => [...document.querySelectorAll('table.adm tbody tr')].map(r => parseInt(r.children[2].textContent.trim(), 10)).every(n => n > 0)"))
    pg.locator("[data-new-brand]").click(); pg.wait_for_timeout(400)
    pg.fill("#b-name_ar", "علامة جديدة"); pg.fill("#b-name_en", "Nova")
    pg.locator("[data-modal-ok]").click(); pg.wait_for_timeout(900)
    chk("brand created", pg.locator("table.adm tbody tr").count() == 4)
    pg.locator("[data-toggle-brand]").first.click(); pg.wait_for_timeout(700)
    chk("brand hidden state toggles", pg.locator(".tag--muted").count() >= 1)

    # --- delete brand with products must fail (FK restrict)
    pg.locator("[data-delete-brand]").nth(1).click(); pg.wait_for_timeout(400)
    pg.locator("[data-modal-ok]").click(); pg.wait_for_timeout(900)
    chk("brand with products cannot be deleted", pg.locator("table.adm tbody tr").count() == 4)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)

    # --- categories
    pg.goto(BASE + "#/categories"); pg.wait_for_timeout(700)
    n0 = pg.locator("table.adm tbody tr").count()
    pg.locator("[data-new-category]").click(); pg.wait_for_timeout(400)
    pg.fill("#c-name_ar", "فئة جديدة")
    pg.locator("[data-modal-ok]").click(); pg.wait_for_timeout(900)
    chk("category created", pg.locator("table.adm tbody tr").count() == n0 + 1)

    # --- settings
    pg.goto(BASE + "#/settings"); pg.wait_for_timeout(800)
    pg.fill("#s-whatsapp", "218911234567")
    pg.fill("#s-fee", "20"); pg.fill("#s-threshold", "500")
    pg.fill("#s-address", "طرابلس - شارع عمر المختار")
    pg.fill("#s-hours", "السبت – الخميس · 10 ص – 9 م")
    pg.locator("label.switch:has(#s-enabled)").click()
    pg.click("#saveSettings"); pg.wait_for_timeout(900)
    chk("settings saved", pg.locator(".toast").count() >= 1)
    pg.reload(wait_until="networkidle"); pg.wait_for_timeout(900)
    chk("settings persist after reload", pg.input_value("#s-whatsapp") == "218911234567")
    chk("orders-enabled persisted", pg.is_checked("#s-enabled"))

    # --- invalid whatsapp rejected
    pg.fill("#s-whatsapp", "abc123"); pg.click("#saveSettings"); pg.wait_for_timeout(600)
    chk("invalid whatsapp rejected", pg.locator(".toast--error").count() >= 1)

    # --- logout
    pg.locator("[data-logout]").click(); pg.wait_for_timeout(800)
    chk("logout returns to login", pg.locator(".login-card").count() == 1)

    # mobile
    ctx2 = b.new_context(viewport={"width":390,"height":844}, locale="ar-LY")
    m = ctx2.new_page()
    m.goto(BASE, wait_until="networkidle")
    m.fill("#email","o@h.co"); m.fill("#password","secret1"); m.click("#loginBtn"); m.wait_for_timeout(1000)
    m.goto(BASE + "#/orders", wait_until="networkidle"); m.wait_for_timeout(700)
    chk("mobile: sidebar off-canvas by default", m.locator(".side.is-open").count() == 0 and m.evaluate("getComputedStyle(document.querySelector('.side')).transform") != "none")
    m.locator("[data-menu]").click(); m.wait_for_timeout(500)
    chk("mobile: sidebar opens", m.locator(".side.is-open").count() == 1)
    chk("mobile: no horizontal overflow", m.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"))
    m.screenshot(path="/tmp/shots/adm-mobile-orders.png")

    b.close()

for s, n, x in res:
    print(f"{s}  {n}" + (f"   [{x}]" if x and s == "FAIL" else ""))

passed = sum(1 for r in res if r[0] == "PASS")
failed = [r for r in res if r[0] != "PASS"]
print("\npage errors:", errs[:6] or "none")
print(f"{passed}/{len(res)} passed")

# A page that dies before the assertions must not look like a pass.
EXPECTED_MIN = 30
if len(res) < EXPECTED_MIN:
    print(f"\n✗ only {len(res)} assertions ran (expected at least {EXPECTED_MIN}) "
          "— the UI failed before the checks")
    sys.exit(1)

# A test run must be able to FAIL the shell. Without this the suite always
# exits 0 and any pipeline reports success no matter what broke.
if failed or errs:
    if errs:
        print(f"✗ {len(errs)} uncaught page error(s)")
    if failed:
        print("✗ failing assertions:")
        for s, n, x in failed:
            print(f"   - {n}" + (f"  [{x}]" if x else ""))
    sys.exit(1)
print("✓ ALL GREEN")
sys.exit(0)
