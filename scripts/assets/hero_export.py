"""Hero layers for the site: engine render crop and a transparent viridis field, pixel aligned."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
import matplotlib

sys.path.insert(0, str(Path.home() / "doing/RadioVISTA/paper/fig"))
import make_figures as mf  # noqa: E402

OUT = Path.home() / "tmp_site_export/out"
BL = Path("/mnt/data/yiyang/radiovista/dataset/radiovista/previews/blender")
city, i0, i1, j0, j1 = sys.argv[1], *map(int, sys.argv[2:6])
SIZE = 1200
vir = matplotlib.colormaps["viridis"]
f = mf.field(city, 3, 0, 4)[i0:i1, j0:j1]
mask = mf.building_mask(city)[::-1][i0:i1, j0:j1]
on = (f > 0) & ~mask
db = 10 * np.log10(np.where(on, f, 1)) + 30
t = np.clip((db + 110) / 90, 0, 1)
rgba = np.zeros((*f.shape, 4), np.uint8)
rgba[..., :3] = (vir(t)[..., :3] * 255).astype(np.uint8)
rgba[..., 3] = np.where(on, 140 + 115 * t, 0).astype(np.uint8)
Image.fromarray(rgba[::-1], "RGBA").resize((SIZE, SIZE), Image.LANCZOS).save(OUT / "hero_field.webp", quality=85, method=6)
im = Image.open(BL / city / "top.png").convert("RGB").resize((2000, 2000), Image.LANCZOS).crop((j0, 2000 - i1, j1, 2000 - i0))
im.resize((SIZE, SIZE), Image.LANCZOS).save(OUT / "hero_render.webp", quality=82, method=6)
m = json.load(open(OUT / "manifest.json"))
m["hero"] = {"city": city, "window": [i0, i1, j0, j1], "render": "hero_render.webp", "field": "hero_field.webp"}
json.dump(m, open(OUT / "manifest_hero.json", "w"), indent=1)
print("ok", city, [i0, i1, j0, j1])
