"""Matched-field tiles for the site: signal strength and what each mechanism adds, plus coverage stats."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
import matplotlib

HOME = Path.home()
sys.path.insert(0, str(HOME / "doing/RadioVISTA/paper/fig"))
import make_figures as mf  # noqa: E402

OUT = HOME / "tmp_site_export/out"
CITY, SAMPLE, W = "new_york", 0, 300
TAU = -90.0  # dBm, coverage threshold used in the paper
VMIN, VMAX = -110.0, -20.0
WHITE = np.array([255, 255, 255])
BLD = np.array([196, 202, 211])      # buildings: present but quiet
EARLIER = np.array([168, 196, 214])  # covered by an earlier mechanism
NEW = np.array([33, 145, 140])       # newly covered by this mechanism (viridis teal)
SIZE = 480


def dense_window(city, w):
    from scipy.ndimage import uniform_filter
    d = uniform_filter((mf.field(city, 2, SAMPLE, 1) > 0).astype(float), 2 * w)
    i, j = np.unravel_index(d.argmax(), d.shape)
    i, j = int(np.clip(i, w, 2000 - w)), int(np.clip(j, w, 2000 - w))
    return i - w, i + w, j - w, j + w


i0, i1, j0, j1 = dense_window(CITY, W)
mask = mf.building_mask(CITY)[::-1][i0:i1, j0:j1]  # field index space, south to north
free = ~mask


def dbm(level, mode):
    f = mf.field(CITY, level, SAMPLE, mode)[i0:i1, j0:j1]
    on = f > 0
    return np.where(on, 10 * np.log10(np.where(on, f, 1)) + 30, -np.inf)


def save(rgb, name):
    Image.fromarray(rgb[::-1].astype(np.uint8)).resize((SIZE, SIZE), Image.LANCZOS).save(OUT / f"{name}.webp", quality=82, method=6)
    return f"{name}.webp"


vir = matplotlib.colormaps["viridis"]
stats, fields, adds = {}, [], []
for level in (1, 2, 3):
    prev, union, prev_pct = None, None, 0.0
    for mode in (1, 2, 3, 4):
        d = dbm(level, mode)
        bmask = mask if level > 1 else np.zeros_like(mask)
        area = free if level > 1 else np.ones_like(free)
        cov = (d >= TAU) & area
        pct = 100 * cov.sum() / area.sum()
        # signal strength
        rgb = np.tile(WHITE, (*d.shape, 1)).astype(float)
        on = np.isfinite(d) & area
        t = np.clip((d - VMIN) / (VMAX - VMIN), 0, 1)
        a = np.where(on, 0.55 + 0.45 * t, 0)[..., None]
        rgb = rgb * (1 - a) + vir(t)[..., :3] * 255 * a
        rgb[bmask] = BLD
        fields.append(save(rgb, f"m_L{level}M{mode}"))
        # what this mechanism adds
        rgb = np.tile(WHITE, (*d.shape, 1)).astype(float)
        if union is None:
            rgb[cov] = NEW
            union = cov.copy()
        else:
            rgb[cov & union] = EARLIER
            rgb[cov & ~union] = NEW
            union |= cov
        added = pct - prev_pct
        prev_pct = pct
        rgb[bmask] = BLD
        adds.append(save(rgb, f"a_L{level}M{mode}"))
        stats[f"L{level}M{mode}"] = {"coverage": round(float(pct), 1), "added": round(float(added), 1)}

m = json.load(open(OUT / "manifest.json"))
m["matched"] = {"window": [i0, i1, j0, j1], "tiles": fields, "adds": adds, "stats": stats, "tau_dbm": TAU}
json.dump(m, open(OUT / "manifest_matched.json", "w"), indent=1)
print(json.dumps(stats))
