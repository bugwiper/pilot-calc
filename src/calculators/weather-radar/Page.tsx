import { useEffect, useMemo, useState } from 'react'
import { Fields, Formula, Result, RuleBox, Section, Toggle } from '../../ui/Blocks'
import { NumberField } from '../../ui/NumberField'
import { fmtDec, fmtInt, fmtSigned } from '../../ui/format'
import { parseNum } from '../../ui/numbers'
import { computeRadar, EFFECTIVE_RADIUS_NM, FT_PER_NM } from './calc'
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
      <Section title="Input" note="Tilt: + up, − down, as on the radar control. For tops, lower the tilt until the cloud just disappears from the screen, then read the tilt and the distance of the target.">
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
            ? 'The upper edge of the beam touches the cloud top. Includes earth curvature for a 4/3 earth radius; the beam is drawn bending upward relative to the aircraft level.'
            : 'The upper edge of the beam touches the cloud top. Flat-earth geometry: earth curvature is neglected, so at long range the real top is higher than shown. Switch it on above.'
        }
      >
        {r && dist !== null ? (
          <>
            <div className="results">
              <Result
                big
                tone={r.exactFt < 0 ? 'warn' : 'accent'}
                label={r.exactFt < 0 ? 'Target is below me' : r.exactFt > 0 ? 'Target is above me' : 'Target is level with me'}
                value={fmtSigned(r.exactFt)}
                unit="ft"
              />
              <Result label="Upper beam edge α" value={fmtDec(r.upperEdgeDeg)} unit="°" />
              <Result label="Beam depth at target" value={fmtInt(r.beamDepthFt)} unit="ft" />
              {raw.curv && <Result label="Of which earth curvature" value={fmtSigned(r.curvatureFt)} unit="ft" />}
            </div>
            {steep && <p className="warning">Angles above 45° are not realistic for weather radar.</p>}
            <Diagram beamWidthDeg={bw!} tiltDeg={tilt!} distanceNm={dist} heightFt={r.exactFt} curvatureFt={r.curvatureFt} />
          </>
        ) : (
          <p className="empty">Enter beam width, tilt and a distance above 0 NM.</p>
        )}
      </Section>

      <Section title="Formula">
        <h3>Exact</h3>
        <Formula>
          <div>α = tilt + ½ × beam width &nbsp;(upper beam edge)</div>
          <div>ΔH = d × 6,076 ft/NM × tan α{raw.curv ? ' + d² / (2 × R_eff) × 6,076 ft/NM' : ''}</div>
          {raw.curv && <div>R_eff = 4/3 × 3,440 NM = {fmtInt(EFFECTIVE_RADIUS_NM)} NM</div>}
        </Formula>
        {r && bw !== null && tilt !== null && dist !== null && (
          <Formula>
            <div>
              α = {fmtDec(tilt)} + {fmtDec(bw / 2)} = <b>{fmtDec(r.upperEdgeDeg)}°</b>
            </div>
            <div>
              ΔH = {fmtInt(dist)} × {fmtInt(FT_PER_NM)} × tan({fmtDec(r.upperEdgeDeg)}°) = <b>{fmtSigned(r.exactFt - r.curvatureFt)} ft</b>
            </div>
            {raw.curv && (
              <>
                <div>
                  + {fmtInt(dist)}² / (2 × {fmtInt(EFFECTIVE_RADIUS_NM)}) × 6,076 = <b>{fmtSigned(r.curvatureFt)} ft</b>
                </div>
                <div>
                  ΔH = <b>{fmtSigned(r.exactFt)} ft</b>
                </div>
              </>
            )}
          </Formula>
        )}

        <h3>Rule of thumb · 1 : 60</h3>
        {raw.curv && <p className="note">Both rules neglect earth curvature, so their difference to the exact value includes it.</p>}
        <RuleBox title="α = 60 × ΔH / d" sub="1° ≙ 1 NM of height per 60 NM distance (ΔH and d in the same unit)" />
        {r && dist !== null && (
          <>
            <Formula>
              <div>
                ΔH = {fmtInt(dist)} NM × {fmtDec(r.upperEdgeDeg)}° / 60 = <b>{trim((dist * r.upperEdgeDeg) / 60, 2)} NM</b>
              </div>
              <div>
                = <b>{fmtSigned(r.rule60Ft)} ft</b>
              </div>
            </Formula>
            <div className="results">
              <Result label="1:60 result" value={fmtSigned(r.rule60Ft)} unit="ft" />
              <Result label="Rule − exact" tone={Math.abs(r.rule60ErrorFt) >= 500 ? 'warn' : 'neutral'} value={fmtSigned(r.rule60ErrorFt)} unit="ft" />
            </div>
          </>
        )}

        <h3>Rule of thumb · 100 ft</h3>
        <RuleBox title="ΔH = d × α × 100 ft" sub="100 ft of height per NM of distance per degree" />
        {r && dist !== null && (
          <>
            <Formula>
              <div>
                ΔH = {fmtInt(dist)} × {fmtDec(r.upperEdgeDeg)} × 100 = <b>{fmtSigned(r.rule100Ft)} ft</b>
              </div>
            </Formula>
            <div className="results">
              <Result label="100 rule result" value={fmtSigned(r.rule100Ft)} unit="ft" />
              <Result label="Rule − exact" tone={Math.abs(r.rule100ErrorFt) >= 500 ? 'warn' : 'neutral'} value={fmtSigned(r.rule100ErrorFt)} unit="ft" />
            </div>
          </>
        )}
      </Section>
    </>
  )
}
