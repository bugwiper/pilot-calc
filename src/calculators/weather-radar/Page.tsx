import { useEffect, useMemo, useState } from 'react'
import { Fields, Formula, Result, RuleBox, Section, Toggle } from '../../ui/Blocks'
import { NumberField } from '../../ui/NumberField'
import { fmtDec, fmtInt, fmtSigned } from '../../ui/format'
import { parseNum } from '../../ui/numbers'
import { computeRadar, EFFECTIVE_RADIUS_NM, FT_PER_NM, heightAt } from './calc'
import { Diagram } from './Diagram'

const STORAGE_KEY = 'pilot-calc:weather-radar:v1'
const DEFAULTS = { bw: '4', tilt: '-5', dist: '40', curv: false }
type Raw = typeof DEFAULTS

function load(): Raw {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...DEFAULTS, ...JSON.parse(saved) }
  } catch {
    /* storage unavailable */
  }
  return DEFAULTS
}

const trim = (n: number, d: number) => String(Number(n.toFixed(d)))

export default function WeatherRadarPage() {
  const [raw, setRaw] = useState<Raw>(load)
  const set = (k: 'bw' | 'tilt' | 'dist') => (text: string) => setRaw((s) => ({ ...s, [k]: text }))
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(raw))
    } catch {
      /* ignore */
    }
  }, [raw])

  const bw = parseNum(raw.bw)
  const tilt = parseNum(raw.tilt)
  const dist = parseNum(raw.dist)
  const valid = bw !== null && bw >= 0 && tilt !== null && dist !== null && dist > 0
  const r = useMemo(
    () => (valid ? computeRadar({ beamWidthDeg: bw, tiltDeg: tilt, distanceNm: dist, earthCurvature: raw.curv }) : null),
    [valid, bw, tilt, dist, raw.curv],
  )
  const steep = r !== null && (Math.abs(r.upperEdgeDeg) >= 45 || Math.abs(r.lowerEdgeDeg) >= 45)

  return (
    <>
      <Section title="Input" note="Tilt: + up, − down, as on the radar control. For tops: tilt down until the echo just disappears, then enter that tilt and the distance of the echo; the cloud top is at the upper edge.">
        <Fields>
          <NumberField label="Beam width" unit="°" value={raw.bw} onChange={set('bw')} />
          <NumberField label="Tilt (up + / down −)" unit="°" signed value={raw.tilt} onChange={set('tilt')} />
          <NumberField label="Object distance" unit="NM" value={raw.dist} onChange={set('dist')} />
        </Fields>
        <Toggle
          label="Earth curvature"
          hint="Off: flat-earth geometry. On: 4/3 earth radius (standard refraction)."
          checked={raw.curv}
          onChange={(on) => setRaw((s) => ({ ...s, curv: on }))}
        />
      </Section>

      <Section
        title="Result"
        note={
          raw.curv
            ? 'Height of the beam edges at the entered distance relative to your own altitude. Includes earth curvature for a 4/3 earth radius; the beam is drawn bending upward.'
            : 'Height of the beam edges at the entered distance relative to your own altitude. Flat-earth geometry: curvature is neglected, so at long range the real heights are higher than shown. Switch it on above.'
        }
      >
        {r && dist !== null ? (
          <>
            <div className="results">
              <Result big tone="accent" label="Upper coverage" value={fmtSigned(r.upperFt)} unit="ft" />
              <Result big tone="accent" label="Lower coverage" value={fmtSigned(r.lowerFt)} unit="ft" />
              {raw.curv && <Result label="Of which earth curvature" value={fmtSigned(r.curvatureFt)} unit="ft" />}
            </div>
            {steep && <p className="warning">Angles above 45° are not realistic for weather radar.</p>}
            <Diagram
              distanceNm={dist}
              upperFt={r.upperFt}
              lowerFt={r.lowerFt}
              centerFt={(r.upperFt + r.lowerFt) / 2}
              curvatureFt={r.curvatureFt}
              flat={{ upper: heightAt(dist, r.upperEdgeDeg), lower: heightAt(dist, r.lowerEdgeDeg), center: heightAt(dist, tilt!) }}
            />
          </>
        ) : (
          <p className="empty">Enter beam width, tilt and a distance above 0 NM.</p>
        )}
      </Section>

      <Section title="Formula">
        <h3>Exact</h3>
        <Formula>
          <div>α<sub>upper</sub> = tilt + ½ × beam width · α<sub>lower</sub> = tilt − ½ × beam width</div>
          <div>ΔH = d × 6,076 ft/NM × tan α{raw.curv ? ' + d² / (2 × R_eff) × 6,076 ft/NM' : ''}</div>
          {raw.curv && <div>R_eff = 4/3 × 3,440 NM = {fmtInt(EFFECTIVE_RADIUS_NM)} NM</div>}
        </Formula>
        {r && bw !== null && tilt !== null && dist !== null && (
          <Formula>
            <div>
              α<sub>upper</sub> = {fmtDec(tilt)} + {fmtDec(bw / 2)} = <b>{fmtDec(r.upperEdgeDeg)}°</b> · α<sub>lower</sub> = {fmtDec(tilt)} − {fmtDec(bw / 2)} ={' '}
              <b>{fmtDec(r.lowerEdgeDeg)}°</b>
            </div>
            <div>
              ΔH<sub>upper</sub> = {fmtInt(dist)} × {fmtInt(FT_PER_NM)} × tan({fmtDec(r.upperEdgeDeg)}°) = <b>{fmtSigned(r.upperFt - r.curvatureFt)} ft</b>
            </div>
            <div>
              ΔH<sub>lower</sub> = {fmtInt(dist)} × {fmtInt(FT_PER_NM)} × tan({fmtDec(r.lowerEdgeDeg)}°) = <b>{fmtSigned(r.lowerFt - r.curvatureFt)} ft</b>
            </div>
            {raw.curv && (
              <>
                <div>
                  Curvature: {fmtInt(dist)}² / (2 × {fmtInt(EFFECTIVE_RADIUS_NM)}) × 6,076 = <b>{fmtSigned(r.curvatureFt)} ft</b> (added to both)
                </div>
                <div>
                  ΔH<sub>upper</sub> = <b>{fmtSigned(r.upperFt)} ft</b> · ΔH<sub>lower</sub> = <b>{fmtSigned(r.lowerFt)} ft</b>
                </div>
              </>
            )}
          </Formula>
        )}

        <h3>Rule of thumb · 1 : 60</h3>
        <RuleBox title="α = 60 × ΔH / d" sub="1° ≙ 1 NM of height per 60 NM distance (ΔH and d in the same unit)" />
        {raw.curv && <p className="note">Both rules neglect earth curvature, so their difference to the exact value includes it.</p>}
        {r && dist !== null && (
          <>
            <Formula>
              <div>
                ΔH<sub>upper</sub> = {fmtInt(dist)} NM × {fmtDec(r.upperEdgeDeg)}° / 60 = {trim((dist * r.upperEdgeDeg) / 60, 2)} NM = <b>{fmtSigned(r.rule60UpperFt)} ft</b>
              </div>
              <div>
                ΔH<sub>lower</sub> = {fmtInt(dist)} NM × {fmtDec(r.lowerEdgeDeg)}° / 60 = {trim((dist * r.lowerEdgeDeg) / 60, 2)} NM = <b>{fmtSigned(r.rule60LowerFt)} ft</b>
              </div>
            </Formula>
            <div className="results">
              <Result label="Upper: rule − exact" tone={Math.abs(r.rule60UpperErrorFt) >= 500 ? 'warn' : 'neutral'} value={fmtSigned(r.rule60UpperErrorFt)} unit="ft" />
              <Result label="Lower: rule − exact" tone={Math.abs(r.rule60LowerErrorFt) >= 500 ? 'warn' : 'neutral'} value={fmtSigned(r.rule60LowerErrorFt)} unit="ft" />
            </div>
          </>
        )}

        <h3>Rule of thumb · 100 ft</h3>
        <RuleBox title="ΔH = d × α × 100 ft" sub="100 ft of height per NM of distance per degree" />
        {r && dist !== null && (
          <>
            <Formula>
              <div>
                ΔH<sub>upper</sub> = {fmtInt(dist)} × {fmtDec(r.upperEdgeDeg)} × 100 = <b>{fmtSigned(r.rule100UpperFt)} ft</b>
              </div>
              <div>
                ΔH<sub>lower</sub> = {fmtInt(dist)} × {fmtDec(r.lowerEdgeDeg)} × 100 = <b>{fmtSigned(r.rule100LowerFt)} ft</b>
              </div>
            </Formula>
            <div className="results">
              <Result label="Upper: rule − exact" tone={Math.abs(r.rule100UpperErrorFt) >= 500 ? 'warn' : 'neutral'} value={fmtSigned(r.rule100UpperErrorFt)} unit="ft" />
              <Result label="Lower: rule − exact" tone={Math.abs(r.rule100LowerErrorFt) >= 500 ? 'warn' : 'neutral'} value={fmtSigned(r.rule100LowerErrorFt)} unit="ft" />
            </div>
          </>
        )}
      </Section>
    </>
  )
}
