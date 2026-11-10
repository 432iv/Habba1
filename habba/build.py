#!/usr/bin/env python3
"""
HABBA — single-file build.

يجمّع CSS + الخطوط + JS + الصور في ملف HTML واحد
(HABBA-standalone.html) يمكن فتحه مباشرة بدون سيرفر
أو مشاركته كما هو.

التشغيل:  python3 build.py
"""
import base64, mimetypes, pathlib, re

ROOT = pathlib.Path(__file__).parent
OUT_FILE = ROOT / "HABBA-standalone.html"

def data_uri(path: pathlib.Path) -> str:
    mime, _ = mimetypes.guess_type(path.name)
    mime = mime or "application/octet-stream"
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:{mime};base64,{b64}"

def inline_fonts(css: str) -> str:
    def repl(m):
        rel = m.group(1)
        f = (ROOT / "css" / rel).resolve()
        return f'url("{data_uri(f)}")'
    css = re.sub(r'url\("([^"]+woff2)"\)', repl, css)
    return re.sub(r"url\((?!['\"])([^)'\"]+woff2)\)", repl, css)

def main() -> None:
    css = (ROOT / "css" / "fonts.css").read_text() + "\n" + (ROOT / "css" / "habba.css").read_text()
    css = inline_fonts(css)

    js = "\n".join((ROOT / "js" / f).read_text() for f in ("config.js", "data.js", "app.js"))

    # replace every image reference with an embedded data URI
    images = sorted((ROOT / "assets" / "img").rglob("*.jpg")) + sorted((ROOT / "assets" / "img").rglob("*.png"))
    for img in images:
        rel = img.relative_to(ROOT).as_posix()
        js = js.replace(rel, data_uri(img))
        css = css.replace(rel, data_uri(img))

    html = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#F8F6F1">
<title>هبّة HABBA — عطور من علامات مختارة</title>
<meta name="description" content="هبّة — متجر عطور متعدد العلامات في ليبيا. عطور نسائية من لافيرن، إبراق، جامبول وعلامات أخرى.">
<style>
{css}
</style>
</head>
<body>
<a class="skip-link" href="#main">تجاوز إلى المحتوى</a>
<div id="app" role="main"></div>
<div id="chrome"></div>
<script>
{js}
</script>
</body>
</html>
"""
    OUT_FILE.write_text(html, encoding="utf-8")
    size = OUT_FILE.stat().st_size / 1024
    print(f"✓ {OUT_FILE.name} — {size:,.0f} KB (خطوط + صور مضمّنة)")

if __name__ == "__main__":
    main()
