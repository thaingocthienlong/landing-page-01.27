"""Export each ad artboard to PNG at 2x (2160 x 2700).

Usage: python render.py            # all *.html in this folder
       python render.py A-*.html   # selected files
Needs local Chrome and network access for Google Fonts.
"""
import glob
import pathlib
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent / "export"


def main(patterns):
    files = sorted({p for pat in patterns for p in HERE.glob(pat)})
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=2)
        for f in files:
            page.goto(f.resolve().as_uri())
            page.evaluate("document.fonts.ready")
            ad = page.locator("#ad")
            box = ad.bounding_box()
            assert (round(box["width"]), round(box["height"])) == (1080, 1350), f"{f.name}: artboard {box}"
            overflow = page.evaluate("(() => { const a = document.getElementById('ad'); return a.scrollHeight - a.clientHeight; })()")
            assert overflow <= 0, f"{f.name}: content overflows artboard by {overflow}px"
            target = OUT / (f.stem + ".png")
            ad.screenshot(path=str(target))
            print("wrote", target.relative_to(HERE.parent))
        browser.close()


if __name__ == "__main__":
    main(sys.argv[1:] or ["*.html"])
