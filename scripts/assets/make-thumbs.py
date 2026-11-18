"""Make the 400 px city-strip thumbnails (*_s.webp) next to the gallery images in public/rv/.

Run locally after pulling new gallery images:  python scripts/assets/make-thumbs.py
"""
import json
from pathlib import Path

from PIL import Image

RV = Path(__file__).resolve().parents[2] / "public" / "rv"
SIZE = 400

manifest = json.loads((RV / "manifest.json").read_text())
for city in manifest["gallery"]:
    for key in ("render", "field"):
        src = RV / city[key]
        dst = src.with_name(src.stem + "_s.webp")
        if not src.exists():
            print(f"missing {src.name}, keeping {dst.name}")
            continue
        Image.open(src).resize((SIZE, SIZE), Image.LANCZOS).save(dst, quality=80, method=6)
        print(f"{dst.name}")
