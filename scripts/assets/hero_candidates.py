"""Pick, per city, the 1 km window with the fullest field and render a preview tile like the site hero."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance
from scipy.ndimage import uniform_filter
import matplotlib

sys.path.insert(0, str(Path.home() / "doing/RadioVISTA/paper/fig"))
import make_figures as mf  # noqa: E402

OUT = Path.home() / "tmp_site_export/cand"
OUT.mkdir(exist_ok=True)
BL = Path("/mnt/data/yiyang/radiovista/dataset/radiovista/previews/blender")
CITIES = sys.argv[1:] or ["paris", "barcelona", "hong_kong", "tokyo", "singapore", "dubai", "london", "rome",
                          "amsterdam", "istanbul", "seoul", "sydney"]
W, N = 500, 360
vir = matplotlib.colormaps["viridis"]
res, tiles = {}, []
for c in CITIES:
    try:
        f = mf.field(c, 3, 0, 4)
        mask = mf.building_mask(c)[::-1]
        on = f > 0
        db = np.where(on, 10 * np.log10(np.where(on, f, 1)) + 30, -np.inf)
        cov = (db >= -100) & ~mask
        d = uniform_filter(cov.astype(float), 2 * W)
        i, j = np.unravel_index(d[W:2000 - W, W:2000 - W].argmax(), (1000, 1000))
        i, j = i + W, j + W
        i0, i1, j0, j1 = i - W, i + W, j - W, j + W
        frac = float(d[i, j]) / max(float(uniform_filter((~mask).astype(float), 2 * W)[i, j]), 1e-6)
        render = Image.open(BL / c / "top.png").convert("RGB").resize((2000, 2000), Image.LANCZOS).crop((j0, 2000 - i1, j1, 2000 - i0))
        dark = ImageEnhance.Brightness(ImageEnhance.Color(render).enhance(0.5)).enhance(0.62)
        t = np.clip((db[i0:i1, j0:j1] - -110) / 90, 0, 1)
        a = np.where(np.isfinite(db[i0:i1, j0:j1]) & ~mask[i0:i1, j0:j1], 0.55 + 0.45 * t, 0)[::-1]
        rgb = (vir(t)[..., :3] * 255)[::-1]
        base = np.asarray(dark).astype(float)
        comp = base * (1 - a[..., None]) + rgb * a[..., None]
        half = np.concatenate([np.asarray(dark)[:, :W], comp[:, W:].astype(np.uint8)], axis=1)
        tile = Image.fromarray(half.astype(np.uint8)).resize((N, N), Image.LANCZOS)
        ImageDraw.Draw(tile).text((8, 8), f"{c}  cov {100*frac:.0f}%", fill=(255, 255, 255))
        tiles.append(tile)
        res[c] = {"window": [int(i0), int(i1), int(j0), int(j1)], "coverage_window": round(100 * frac, 1)}
        print(c, res[c], flush=True)
    except Exception as e:  # noqa: BLE001
        print("skip", c, e, flush=True)
cols = 4
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (N + 6), rows * (N + 6)), "black")
for k, t in enumerate(tiles):
    sheet.paste(t, ((k % cols) * (N + 6), (k // cols) * (N + 6)))
sheet.save(OUT / "candidates.jpg", quality=80)
json.dump(res, open(OUT / "candidates.json", "w"), indent=1)
