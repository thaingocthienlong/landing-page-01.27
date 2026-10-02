"""Export each standalone asset (#asset) as a transparent PNG at 6x (trimmed to the artwork) and a vector PDF.

Usage: python export.py            # all *.html in this folder
Needs local Chrome and network access for Google Fonts.
"""
import pathlib
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
OUT = HERE.parent.parent / "export" / "assets"
SCALE = 6
PAD = 36  # transparent margin kept around the artwork in the PNG, in output pixels


def main(patterns):
    files = sorted({p for pat in patterns for p in HERE.glob(pat)})
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome")
        for f in files:
            page = browser.new_page(viewport={"width": 1200, "height": 800}, device_scale_factor=SCALE)
            page.goto(f.resolve().as_uri())
            page.evaluate("document.fonts.ready")
            box = page.locator("#asset").bounding_box()
            w, h = round(box["width"]), round(box["height"])
            png = OUT / f"{f.stem}@{SCALE}x.png"
            page.locator("#asset").screenshot(path=str(png), omit_background=True)
            im = Image.open(png)
            x0, y0, x1, y1 = im.getchannel("A").getbbox()
            im = im.crop((max(0, x0 - PAD), max(0, y0 - PAD), min(im.width, x1 + PAD), min(im.height, y1 + PAD)))
            im.save(png, optimize=True)
            pdf = OUT / f"{f.stem}.pdf"
            page.pdf(path=str(pdf), width=f"{w}px", height=f"{h}px", print_background=True, page_ranges="1")
            print("wrote", png.name, f"{im.width}x{im.height}", "and", pdf.name, f"{w}x{h} px")
            page.close()
        browser.close()


if __name__ == "__main__":
    main(sys.argv[1:] or ["*.html"])
