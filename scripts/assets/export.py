"""Export web assets for radiovista.github.io (read-only on the dataset)."""
import json, sys
from pathlib import Path
import numpy as np, yaml
from PIL import Image, ImageDraw, features

HOME = Path.home()
REPO = HOME / "doing/RadioVISTA"
sys.path.insert(0, str(REPO / "paper/fig"))
import make_figures as mf  # noqa: E402

OUT = HOME / "tmp_site_export/out"
OUT.mkdir(parents=True, exist_ok=True)
WEBP = features.check("webp")
EXT = "webp" if WEBP else "png"
BLENDER = Path("/mnt/data/yiyang/radiovista/dataset/radiovista/previews/blender")
VMIN, VMAX = -110.0, -20.0
STOPS = [(0.0, "#4C1D95"), (0.35, "#7C3AED"), (0.6, "#3B82F6"), (0.85, "#22D3EE"), (1.0, "#ECFEFF")]
BG, BLD = (255, 255, 255), (120, 128, 142)


def hex2rgb(h):
    return [int(h[i : i + 2], 16) for i in (1, 3, 5)]


def cmap(t):
    import matplotlib
    return matplotlib.colormaps["viridis"](t)[..., :3] * 255


def save(img, name, q=82):
    p = OUT / f"{name}.{EXT}"
    img.save(p, quality=q, method=6) if WEBP else img.save(p, optimize=True)
    return p.name


def field_rgba(f, mask=None, window=None, k=1):
    """Brand-coloured field, transparent where there is no signal or a building. North up."""
    if window:
        i0, i1, j0, j1 = window
        f = f[i0:i1, j0:j1]
        mask = mask[i0:i1, j0:j1] if mask is not None else None
    n = f.shape[0] // k
    f = f[: n * k, : n * k].reshape(n, k, n, k).max(axis=(1, 3))
    on = f > 0
    db = 10 * np.log10(np.where(on, f, 1)) + 30
    t = np.clip((db - VMIN) / (VMAX - VMIN), 0, 1)
    rgba = np.zeros((n, n, 4), np.uint8)
    rgba[..., :3] = cmap(t).astype(np.uint8)
    rgba[..., 3] = np.where(on, (140 + 115 * t), 0).astype(np.uint8)
    if mask is not None:
        m = mask[: n * k, : n * k].reshape(n, k, n, k).mean(axis=(1, 3)) > 0.5
        rgba[m, 3] = 0
    return Image.fromarray(rgba[::-1], "RGBA")


def raw_mask(city):
    # building_mask is drawn in field index space (rows south to north), like rf_rgb expects before its flip
    return mf.building_mask(city)[::-1]


def compose(field_img, mask_win):
    """Dark tile: navy ground, dim buildings, glowing field. mask_win is north-up."""
    n = field_img.size[0]
    base = np.zeros((n, n, 3), np.uint8)
    base[:] = BG
    if mask_win is not None:
        m = np.asarray(Image.fromarray(mask_win.astype(np.uint8) * 255).resize((n, n))) > 127
        base[m] = BLD
    out = Image.fromarray(base).convert("RGBA")
    out.alpha_composite(field_img)
    return out.convert("RGB")


def render_crop(city, window=None, size=None):
    im = Image.open(BLENDER / city / "top.png").convert("RGB").resize((2000, 2000), Image.LANCZOS)
    if window:
        i0, i1, j0, j1 = window
        im = im.crop((j0, 2000 - i1, j1, 2000 - i0))
    return im.resize((size, size), Image.LANCZOS) if size else im


def dense_window(city, w, level=2, sample=0):
    from scipy.ndimage import uniform_filter
    d = uniform_filter((mf.field(city, level, sample, 1) > 0).astype(float), 2 * w)
    i, j = np.unravel_index(d.argmax(), d.shape)
    i, j = int(np.clip(i, w, 2000 - w)), int(np.clip(j, w, 2000 - w))
    return (i - w, i + w, j - w, j + w)


manifest = {}

# 1. Cities
cfg = yaml.safe_load(open(REPO / "configs/data_cfgs/region_cfg.yaml"))
splits = json.load(open("/mnt/data/yiyang/radiovista/dataset/radiovista/processed/radiovista/splits.json"))["splits"]
which = {c: k for k, v in splits.items() for c in v["cities"]}
cities = []
for r in cfg["regions"]:
    if r["id"] not in which:
        continue
    cities.append({k: r[k] for k in ("id", "country_code", "lat", "lon") if k in r} | {
        "name": r["id"].replace("_", " ").title().replace(" De ", " de "), "split": which[r["id"]],
        "render": (BLENDER / r["id"] / "top.png").exists()})
json.dump(cities, open(OUT / "cities.json", "w"), indent=1)
manifest["cities"] = len(cities)

# 2. Hero: one city, 1 km window, render + field layers
HERO = sys.argv[1] if len(sys.argv) > 1 else "new_york"
win = dense_window(HERO, 500)
mask = raw_mask(HERO)
f = mf.field(HERO, 3, 0, 4)
manifest["hero"] = {"city": HERO, "window": win,
                    "render": save(render_crop(HERO, win, 1200), "hero_render", 80),
                    "field": save(field_rgba(f, mask, win).resize((1200, 1200), Image.LANCZOS), "hero_field", 85)}

# 3. Twelve matched fields, same city, 600 m window
win12 = dense_window(HERO, 300)
tiles = []
for level in (1, 2, 3):
    for mode in (1, 2, 3, 4):
        fi = field_rgba(mf.field(HERO, level, 0, mode), mask if level > 1 else None, win12)
        mw = mask[win12[0]:win12[1], win12[2]:win12[3]][::-1] if level > 1 else None
        tiles.append(save(compose(fi.resize((480, 480), Image.LANCZOS), mw), f"m_L{level}M{mode}", 80))
manifest["matched"] = {"window": win12, "tiles": tiles}

# 4. City gallery: render and field, full 2 km
_ONLY = "matched" in sys.argv
GALLERY = [] if _ONLY else ["new_york", "rio_de_janeiro", "paris", "cairo", "lusaka", "mumbai", "tokyo", "sydney",
           "oslo", "la_paz", "dubai", "singapore"]
gal = []
for c in GALLERY:
    if c not in which or not (BLENDER / c / "top.png").exists():
        continue
    try:
        fc = mf.field(c, 3, 0, 4)
        gal.append({"id": c, "render": save(render_crop(c, None, 720), f"city_{c}_render", 78),
                    "field": save(field_rgba(fc, raw_mask(c), None, 2).resize((720, 720), Image.LANCZOS), f"city_{c}_field", 80)})
    except Exception as e:  # noqa: BLE001
        print("skip", c, e)
manifest["gallery"] = gal
json.dump(manifest, open(OUT / "manifest.json", "w"), indent=1)
print(json.dumps(manifest)[:600])
