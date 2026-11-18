# Site assets from the engine

The images and JSON in `public/rv/` are exported from the engine's outputs on the experiment server
(`yc-gpu-1`), not drawn by hand. These scripts are the record of how.

## Where they run

On the experiment server, from `~/doing/RadioVISTA/paper/fig` with the `RadioVISTA` conda env. They
import the paper's `make_figures.py` and `make_scene_figs.py` (field loading, building masks) and
write to `~/tmp_site_export/out/`. They only read the dataset.

| Script | Writes | Notes |
|---|---|---|
| `export.py` | `cities.json`, `city_<id>_{render,field}.webp` (gallery), first `manifest.json` | its hero section is superseded by `hero_export.py` |
| `land.py` | `land.json` | 2° dot grid of land for the world map |
| `matched.py` | `m_L*M*.webp` (signal strength), `a_L*M*.webp` (what each mechanism adds), `manifest_matched.json` | New York, 600 m window, coverage at −90 dBm |
| `hero_candidates.py` | a contact sheet of candidate hero windows | used once to pick Rome |
| `hero_export.py rome 0 1000 477 1477` | `hero_{render,field}.webp` | the hero lens layers |
| `case_export.py` | `case_{render,ref,tgt}.webp`, `case.json` | the hidden-target case (F2, level 2, sample 1) |

Field layers use viridis from −110 to −20 dBm and are transparent where there is no signal or a
building.

## Getting them here

1. Upload from the server to the private Hugging Face dataset `CalvinGu/radiovista-site-assets`
   (folder `v1/`).
2. Download with `huggingface_hub.snapshot_download(..., allow_patterns=["v1/*"])` (WSL has the
   token) and copy into `public/rv/`.
3. `public/rv/manifest.json` in this repo is the merged, authoritative manifest (gallery, matched
   tiles and stats, hero). Merge new `manifest_*.json` sections into it by hand.
4. Run `python scripts/assets/make-thumbs.py` for the city-strip thumbnails.

Only the files the site uses are committed; full-size gallery images are kept just for the cities
shown in the overview cards (Tokyo, Lusaka, Sydney).
