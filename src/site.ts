// Single place for paper metadata and outbound links.
// Links set to null render as "Coming soon" instead of a dead link.

export const PAPER = {
  title: 'Seeing the Invisible: How Vision-Language Models Read, Predict and Trace Radio Fields',
  authors: [
    { name: 'Yiyang Zhu', aff: [1] },
    { name: 'Xin Li', aff: [1] },
    { name: 'Guangyuan Liu', aff: [1] },
    { name: 'Ziheng Liu', aff: [2] },
    { name: 'Jiayi Zhang', aff: [2] },
    { name: 'Chau Yuen', aff: [1] },
  ],
  affiliations: ['Nanyang Technological University', 'Beijing Jiaotong University'],
  abstract:
    'Operating in the physical world requires reasoning beyond what cameras directly capture. In a city, radio signals are invisible to the lens, yet their strength is governed by the buildings and streets an image does show. Given only these visible structures, can vision-language models (VLMs) infer the invisible radio field they shape? Probing true physical reasoning requires exact fields in real cities, alongside controlled interventions where a single physical factor changes. We build a label-free engine that turns any coordinate on Earth into a ray-traceable city, simulates matched single-factor counterfactuals, and computes every answer exactly. This yields RadioVISTA, a benchmark and training dataset for visual reasoning about invisible fields. Physically, a radio field is the sum of its propagation paths, yet across six continents we uncover a striking field-path dissociation: frontier VLMs accurately judge where a field is strong, but fail to tell whether a single direct or one-wall path exists. Open models fail even earlier at reading the field itself, and are systematically wrong, scoring below random guessing even when credited for any of four attempts. On unseen cities, fine-tuning brings a 9B open model close to frontier proprietary models on fields, yet neither supervised nor reinforcement fine-tuning improves path tracing. Supervising only final answers teaches models to approximate the field, yet leaves single-path geometry out of reach.',
}

export const LINKS = {
  github: 'https://github.com/RadioVISTA',
  arxiv: 'https://arxiv.org/abs/2611.28123',
  pdf: 'https://arxiv.org/pdf/2611.28123',
  huggingface: 'https://huggingface.co/papers/2611.28123',
  code: null as string | null,
  dataset: null as string | null,
}

export const BIBTEX = `@article{zhu2026radiovista,
  title   = {Seeing the Invisible: How Vision-Language Models
             Read, Predict and Trace Radio Fields},
  author  = {Zhu, Yiyang and Li, Xin and Liu, Guangyuan and
             Liu, Ziheng and Zhang, Jiayi and Yuen, Chau},
  journal = {arXiv preprint arXiv:2611.28123},
  year    = {2026},
  doi     = {10.48550/arXiv.2611.28123},
  url     = {https://arxiv.org/abs/2611.28123}
}`

export const GROUPS = {
  G: { name: 'Spatial recognition', color: 'var(--g)' },
  P: { name: 'Channel reasoning', color: 'var(--p)' },
  F: { name: 'Physics aggregation', color: 'var(--f-text)' },
} as const

export const TASKS: Record<string, string> = {
  G1: 'Height',
  G2: 'Line of sight',
  G3: 'Occlusion',
  G4: 'Path reachability',
  P1: 'Path loss',
  P2: 'Material',
  P3: 'Scatter',
  P4: 'Diffract',
  F1: 'Read',
  F2: 'Mode',
  F3: 'Material',
  F4: 'Joint',
}
