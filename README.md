<p align="center"><img src="public/brand/icon-192.png" width="72" alt="RadioVISTA"></p>

# RadioVISTA website

Project site for **RadioVISTA** and the paper *Seeing the Invisible: How Vision-Language Models Read,
Predict and Trace Radio Fields*. Served at **https://radiovista.github.io**.

Paper: [arXiv:2611.28123](https://arxiv.org/abs/2611.28123) · [PDF](https://arxiv.org/pdf/2611.28123) · [Hugging Face](https://huggingface.co/papers/2611.28123).

Vite, React and TypeScript; charts are hand-built SVG redraws of the paper's figures.

## Develop

Requires Node 22 (see `.nvmrc`).

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # type-check, bundle to dist/, add dist/404.html for client-side routes
npm run lint       # ESLint; CI fails on any warning
```

## Layout

```
public/
  brand/      logo, icons, partner logos, social preview image
  data/       results.json (leaderboard), generated from the paper
  figs/       paper overview figure
  rv/         engine renders, field layers, cities and manifest (see scripts/assets)
scripts/
  extract-results.mjs   paper Table 2 -> public/data/results.json
  convert-figs.py       paper teaser PDF -> public/figs/fig1_teaser.webp
  spa-fallback.mjs      copies dist/index.html to dist/404.html for GitHub Pages
  assets/               how public/rv/ is exported from the engine (run on the experiment server)
src/
  pages/      Home, Leaderboard, Findings, Paper, NotFound
  components/ field lens, world map, city strip, matched-field grid, charts, tables
  site.ts     paper metadata and outbound links (set LINKS.* when they go live)
  styles.css  design tokens and all styles
```

## Release status

The paper and [benchmark dataset](https://huggingface.co/datasets/ScreeperC/radiovista-bench)
are available. The dataset contains 6,990 questions: 4,735 training, 1,055 validation and
1,200 test questions, split across 68 / 15 / 17 disjoint cities. Evaluation tools,
training recipes and LoRA weights, the scene engine and raw fields are coming in stages.
Dataset counts, splits and loading examples follow the live
[Hugging Face dataset card](https://huggingface.co/datasets/ScreeperC/radiovista-bench).
Tool release status follows the adjacent `radiovista-bench` and `RadioVISTA` repository READMEs.

## Content updates

| To change | Edit or run |
|---|---|
| Leaderboard numbers | `npm run data:results` (reads `../RadioVISTA-paper/sec/4_benchmark.tex`) |
| Paper overview figure | `npm run data:figs` |
| arXiv, PDF, code and data links | `LINKS` in `src/site.ts`; buttons switch from "soon" to live |
| Engine images | see `scripts/assets/README.md` |

## Deploy

Pushing to `main` builds and publishes with GitHub Actions (`.github/workflows/deploy.yml`).
One-time setup: repository Settings → Pages → Source: **GitHub Actions**.

## Related repositories

- `radiovista-bench`: evaluation and training baselines
- `radiovista-engine`: the scene engine

## License

[MIT](LICENSE)
