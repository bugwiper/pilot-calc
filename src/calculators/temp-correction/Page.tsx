import { useEffect, useMemo, useState } from 'react'
import { Formula, LinkedGroup, Result, Section } from '../../ui/Blocks'
import { NumberField } from '../../ui/NumberField'
import { fmtDec, fmtInt, fmtSigned } from '../../ui/format'
import { computeCorrection, isaTempC, ISA_LAPSE_PER_FT, ISA_SL_TEMP_K } from './calc'
import { Diagram } from './Diagram'
import { type Field, type FormState, makeState, update } from './model'

const STORAGE_KEY = 'pilot-calc:temp-correction:v1'
const DEFAULTS = { ref: 1000, ac: 5000, temp: -10 }

function load(): FormState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const p = JSON.parse(saved)
      return makeState(p.nums, p.anchor)
    }
  } catch {
    /* storage unavailable → fall back to defaults */
  }
  return makeState(DEFAULTS)
}

export default function TempCorrectionPage() {
  const [form, setForm] = useState<FormState>(load)
  const set = (f: Field) => (text: string) => setForm((s) => update(s, f, text))

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nums: form.nums, anchor: form.anchor }))
    } catch {
      /* ignore */
    }
  }, [form])

  const { ref, ac, dev } = form.nums
  const r = useMemo(
    () => (ref !== null && ac !== null && dev !== null ? computeCorrection({ refFt: ref, indicatedFt: ac, isaDev: dev }) : null),
    [ref, ac, dev],
  )

  return (
    <>
      <Section title="Input">
        <LinkedGroup title="Temperature at reference">
          <NumberField label="Temperature" unit="°C" signed value={form.raw.temp} onChange={set('temp')} />
          <NumberField label="Deviation from ISA" unit="°C" signed value={form.raw.dev} onChange={set('dev')} />
        </LinkedGroup>
        {ref !== null && (
          <p className="hint">ISA at {fmtInt(ref)} ft is {fmtDec(isaTempC(ref))} °C (15 °C − 1.98 °C per 1000 ft).</p>
        )}
        <LinkedGroup title="Altitudes">
          <NumberField label="Reference" unit="ft MSL" hint="Station of the altimeter setting" value={form.raw.ref} onChange={set('ref')} />
          <NumberField label="Aircraft (indicated)" unit="ft MSL" value={form.raw.ac} onChange={set('ac')} />
          <NumberField label="Aircraft above reference" unit="ft" signed value={form.raw.above} onChange={set('above')} />
        </LinkedGroup>
      </Section>

      <Section
        title="Result"
        note="Assumes the altimeter is set to the QNH of the reference and that the ISA deviation stays constant over the whole layer. Cold air: you are lower than indicated. Warm air: higher."
      >
        {r ? (
          <>
            <div className="results">
              <Result big tone="accent" label="True altitude" value={fmtInt(r.trueAltFt)} unit="ft MSL" />
              <Result
                big
                tone={r.correctionFt < 0 ? 'warn' : 'neutral'}
                label="Difference to indicated"
                value={fmtSigned(r.correctionFt)}
                unit="ft"
              />
              <Result label="True height above reference" value={fmtInt(r.trueHeightAboveRef)} unit="ft" />
            </div>
            {r.outsideValidRange && <p className="warning">Layer reaches above 36,089 ft – the ISA lapse rate used here no longer applies.</p>}
            <Diagram refFt={ref!} indicatedFt={ac!} trueFt={r.trueAltFt} />
          </>
        ) : (
          <p className="empty">Enter temperature (or deviation) and both altitudes.</p>
        )}
      </Section>

      <Section title="Formula">
        <h3>Exact (ISA layer model)</h3>
        <Formula>
          <div>h<sub>true</sub> = h<sub>ref</sub> + (h<sub>ind</sub> − h<sub>ref</sub>) × (T̄<sub>ISA</sub> + ΔISA) / T̄<sub>ISA</sub></div>
          <div>T̄<sub>ISA</sub> = 288.15 K − 1.98 K/1000 ft × (h<sub>ref</sub> + h<sub>ind</sub>) / 2</div>
        </Formula>
        {r && ref !== null && ac !== null && dev !== null && (
          <Formula>
            <div>
              T̄<sub>ISA</sub> = {ISA_SL_TEMP_K} − {ISA_LAPSE_PER_FT * 1000} × ({fmtInt(ref)} + {fmtInt(ac)}) / 2000 ={' '}
              <b>{fmtDec(r.meanIsaTempK)} K</b>
            </div>
            <div>
              h<sub>true</sub> = {fmtInt(ref)} + {fmtInt(r.heightAboveRef)} × ({fmtDec(r.meanIsaTempK)} {dev < 0 ? '−' : '+'} {fmtDec(Math.abs(dev))}) /{' '}
              {fmtDec(r.meanIsaTempK)} = <b>{fmtInt(r.trueAltFt)} ft</b>
            </div>
          </Formula>
        )}

        <h3>Rule of thumb</h3>
        <p className="note">4 ft per 1000 ft above the reference per 1 °C deviation (ICAO: 4 % per 10 °C).</p>
        <Formula>
          <div>Δh ≈ 4 ft × (h<sub>ind</sub> − h<sub>ref</sub>) / 1000 × ΔISA</div>
        </Formula>
        {r && dev !== null && (
          <>
            <Formula>
              <div>
                Δh ≈ 4 × {fmtDec(r.heightAboveRef / 1000)} × {fmtDec(dev)} = <b>{fmtSigned(r.ruleCorrectionFt)} ft</b>
              </div>
              <div>
                h<sub>true</sub> ≈ <b>{fmtInt(r.ruleTrueAltFt)} ft</b>
              </div>
            </Formula>
            <div className="results">
              <Result label="Rule of thumb result" value={fmtInt(r.ruleTrueAltFt)} unit="ft MSL" />
              <Result
                label="Rule − exact"
                tone={Math.abs(r.ruleErrorFt) >= 50 ? 'warn' : 'neutral'}
                value={fmtSigned(r.ruleErrorFt)}
                unit="ft"
              />
            </div>
          </>
        )}
      </Section>
    </>
  )
}
