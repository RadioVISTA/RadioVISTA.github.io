import { BIBTEX, LINKS, PAPER } from '../site'
import { CopyBlock, Plate, ResourceButton } from '../components/ui'

export default function Paper() {
  return (
    <>
      <div className="dark">
      <div className="wrap page-head">
        <h1 className="paper-title">{PAPER.title}</h1>
        <p className="authors">{PAPER.authors.map((a) => a.name).join(', ')}</p>
        <p className="affils">{PAPER.affiliations.join(' and ')}</p>
        <div className="btns">
          <ResourceButton href={LINKS.arxiv} primary>arXiv</ResourceButton>
          <ResourceButton href={LINKS.pdf}>PDF</ResourceButton>
          <ResourceButton href={LINKS.huggingface}>Hugging Face</ResourceButton>
          <ResourceButton href={LINKS.code}>Code</ResourceButton>
          <ResourceButton href={LINKS.dataset}>Data</ResourceButton>
        </div>
      </div>
      </div>
      <section className="band">
        <div className="wrap narrow">
          <h2 className="h2t">Abstract</h2>
          <div className="body">
            <p>{PAPER.abstract}</p>
          </div>
        </div>
      </section>
      <section className="band alt">
        <div className="wrap">
          <Plate src="/figs/fig1_teaser.webp" alt="RadioVISTA overview: global scene engine, matched ray tracing and the physics exam" />
        </div>
      </section>
      <section className="band tight">
        <div className="wrap narrow">
          <h2 className="h2t">Cite</h2>
          <CopyBlock text={BIBTEX} label="BibTeX citation" />
        </div>
      </section>
    </>
  )
}
