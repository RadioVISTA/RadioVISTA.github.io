"""Render the paper's overview figure for the site (public/figs/fig1_teaser.webp).

Usage: python scripts/convert-figs.py   (needs PyMuPDF and Pillow; reads ../RadioVISTA-paper/fig)
The other paper figures are redrawn as SVG components in src/components/, not rasterised.
"""
from pathlib import Path

import pymupdf
from PIL import Image

HERE = Path(__file__).resolve().parent
PAPER = HERE.parent.parent / "RadioVISTA-paper" / "fig"
OUT = HERE.parent / "public" / "figs"
OUT.mkdir(parents=True, exist_ok=True)

WIDTH = 2800  # crisp at full width on retina screens when enlarged

page = pymupdf.open(PAPER / "main" / "fig1_teaser.pdf")[0]
zoom = WIDTH / page.rect.width
pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
img.save(OUT / "fig1_teaser.webp", quality=90, method=6)
print(f"fig1_teaser.webp {img.size}")
