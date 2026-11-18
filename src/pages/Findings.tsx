import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ErrorSources, FineTuneRadar } from '../components/FindingCharts'
import { CopyRefTable, RetryTable } from '../components/PaperTables'
import CaseCompare from '../components/CaseCompare'
import Dissociation from '../components/Dissociation'

export default function Findings() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])

  return (
    <>
      <div className="dark">
      <div className="wrap page-head">
        <h1>What models see, and what they learn</h1>
        <p>
          Geometry determines each path, materials govern attenuation along it, and the field sums thousands of such
          paths. A model following physics would trace paths first. Exact labels let us test whether VLMs do.
        </p>
      </div>
      </div>

      <div className="band finding" id="f1">
        <div className="wrap split">
          <div>
            <span className="num">Finding 1 of 3</span>
            <h2>The strongest models read fields but miss paths</h2>
            <div className="body">
              <p>
                GPT-6-Astra and GPT-6.1-Sol rank regions of a hidden field at 94.8%, and all five proprietary models
                apply the free-space law on P1 with at least 98.0% accuracy. On G4, a binary question about a single
                direct or one-wall path, the same five average 62.4%, and GPT-6-Luna falls below a coin flip.
              </p>
              <p>
                Changing propagation physics rarely moves the best-covered region, so a field can largely be read from
                the reference provided. A path is never shown and must be traced.
              </p>
            </div>
            <p className="takeaway">
              Recalling a propagation formula is solved.
              <br />
              Judging whether a signal clears a building is not.
            </p>
          </div>
          <Dissociation />
        </div>
      </div>

      <div className="band finding alt">
        <div className="wrap split">
          <div>
            <h2>Hidden targets separate copying from tracking</h2>
            <div className="body">
              <p>
                A hidden-target question shows one field and asks which region wins after an intervention. On the 11
                questions where the winner changes, copying the reference scores zero. Proprietary models find the new
                winner on four to seven of them. In one case, GPT-6.1-Sol follows the winner from R1 to R2 once walls
                reflect, while Claude-Opus-5.5 keeps R1.
              </p>
            </div>
            <CopyRefTable />
          </div>
          <CaseCompare />
        </div>
      </div>

      <div className="band finding" id="f2">
        <div className="wrap split">
          <div>
            <span className="num">Finding 2 of 3</span>
            <h2>Open models fail one step earlier</h2>
            <div className="body">
              <p>
                The strongest open model, MiniCPM-V-4.7-35B, reaches 47.4% overall, and none exceeds 36.3% on physics
                aggregation against a 25.0% random baseline. Sampling does not rescue them. Credited for any of four
                answers, every open model stays below the 70.7% that four uniform guesses would reach.
              </p>
              <p>
                Feedback does not either. Told their first answer is wrong, open models correct 29.8% of their errors,
                below the 34.1% of guessing among the remaining options.
              </p>
            </div>
          </div>
          <RetryTable />
        </div>
        <div className="wrap split">
          <div>
          <div className="body">
            <p>
              Exact labels let every error be attributed without human annotation. For open models, a favourite option
              letter explains a third of their errors: they misread the field and fall back on fixed preferences.
            </p>
          </div>
          <p className="takeaway">Training removes the letter bias but leaves a fixed answer on G4.</p>
          </div>
          <ErrorSources />
        </div>
      </div>

      <div className="band finding alt" id="f3">
        <div className="wrap split">
          <div>
            <span className="num">Finding 3 of 3</span>
            <h2>Training teaches the field, not the path</h2>
            <div className="body">
              <p>
                Post-training Qwen3.5-9B on 68 cities lifts it from 36.0% to 77.5% overall on 17 unseen cities, ahead of
                Gemini-3.8-Flash and GPT-6-Luna. Physics aggregation rises from 27.9% to 89.7%, close to GPT-6-Astra’s
                94.9%, and the model overtakes GPT-6-Astra on P2 and P3.
              </p>
              <p>
                Neither SFT nor GRPO improves path reachability. The fine-tuned model answers No on every G4 question.
                Outcome supervision conveys the field but not single-path geometry, which the reflection points computed
                by the engine can supply.
              </p>
            </div>
            <p className="takeaway">Fields can be read, whereas paths must be traced.</p>
          </div>
          <FineTuneRadar />
        </div>
      </div>
    </>
  )
}
