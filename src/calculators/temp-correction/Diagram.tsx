import { fmtInt, fmtSigned } from '../../ui/format'
import { computeCorrection } from './calc'

interface Props {
  refFt: number
  indicatedFt: number
  isaDev: number
}

const W = 360
const H = 290
const TOP = 26
const BOTTOM = 246
const L = 40 // plot left (true-altitude ticks in the left gutter)
const R = 322 // plot right (indicated-altitude ticks in the right gutter)
const PLANE_X = 212

/** Spacing of the equal-pressure lines: ~3–6 lines between reference and aircraft. */
function niceStep(span: number): number {
  return [250, 500, 1000, 2000, 5000, 10000].find((s) => span / s <= 6) ?? 10000
}

/**
 * Side view anchored at the reference: with QNH set the altimeter is exact there, so ISA (dashed) and actual
 * (solid) pressure surfaces coincide at the reference and drift apart with height above it.
 */
export function Diagram({ refFt, indicatedFt, isaDev }: Props) {
  const trueFt = computeCorrection({ refFt, indicatedFt, isaDev }).trueAltFt
  const delta = indicatedFt - refFt
  const dir = delta >= 0 ? 1 : -1

  const lo = Math.min(refFt, indicatedFt, trueFt)
  const hi = Math.max(refFt, indicatedFt, trueFt)
  const span = hi - lo || 1000
  const pad = span * 0.12
  const min = lo - pad
  const max = hi + pad
  const y = (ft: number) => BOTTOM - ((ft - min) / (max - min)) * (BOTTOM - TOP)

  // equal-pressure pairs between reference and aircraft
  const step = niceStep(Math.abs(delta) || 1000)
  const pairs: { ind: number; act: number }[] = []
  for (let k = 1; k * step < Math.abs(delta) - 1e-6; k++) {
    const ind = refFt + dir * k * step
    pairs.push({ ind, act: computeCorrection({ refFt, indicatedFt: ind, isaDev }).trueAltFt })
  }

  const yRef = y(refFt)
  const yInd = y(indicatedFt)
  const yTrue = y(trueFt)
  const trueIsHigher = trueFt > indicatedFt
  const corr = trueFt - indicatedFt
  const refBelow = refFt <= indicatedFt

  return (
    <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Altitude diagram">
      {/* terrain at the reference station */}
      <path d={`M${L} ${H} L${L} ${yRef} L110 ${yRef} L146 ${H} Z`} className="dg-terrain" />
      <line x1={L} x2="110" y1={yRef} y2={yRef} className="dg-grass" />

      <text x="4" y="14" className="dg-tick strong">true</text>
      <text x={W - 4} y="14" textAnchor="end" className="dg-tick muted">indicated</text>

      {/* equal-pressure lines: dashed = ISA (what the altimeter shows), solid = actual atmosphere */}
      {pairs.map(({ ind, act }) => (
        <g key={ind}>
          <line x1={L} x2={R} y1={y(ind)} y2={y(ind)} className="dg-baro isa" />
          <text x={W - 4} y={y(ind) + 3.5} textAnchor="end" className="dg-tick muted">{fmtInt(ind)}</text>
          <line x1={L} x2={R} y1={y(act)} y2={y(act)} className="dg-baro act" />
          <text x="4" y={y(act) + 3.5} className="dg-tick strong">{fmtInt(act)}</text>
        </g>
      ))}

      {/* reference: altimeter set to QNH, so indicated = true here */}
      <line x1={L} x2={R} y1={yRef} y2={yRef} className="dg-line true" />
      <text x={R - 6} y={yRef + (refBelow ? 15 : -7)} textAnchor="end" className="dg-label halo">
        Reference {fmtInt(refFt)} ft
      </text>

      {/* indicated (ISA, dashed) */}
      <line x1={L} x2={R} y1={yInd} y2={yInd} className="dg-line isa" />
      <text x={L + 6} y={yInd + (trueIsHigher ? 15 : -7)} className="dg-label halo muted">
        Indicated {fmtInt(indicatedFt)} ft
      </text>

      {/* true (actual atmosphere, solid) */}
      <line x1={L} x2={R} y1={yTrue} y2={yTrue} className="dg-line true" />
      <text x={L + 6} y={yTrue + (trueIsHigher ? -7 : 15)} className="dg-label halo strong">
        True {fmtInt(trueFt)} ft
      </text>

      {Math.abs(yTrue - yInd) > 3 && (
        <g className="dg-dim">
          <line x1="306" x2="306" y1={yInd} y2={yTrue} />
          <path d={`M301 ${yTrue + (yInd < yTrue ? -6 : 6)} L306 ${yTrue} L311 ${yTrue + (yInd < yTrue ? -6 : 6)}`} fill="none" />
          <text x="298" y={(yInd + yTrue) / 2 + 4} textAnchor="end" className="dg-label halo warn">
            {fmtSigned(corr)} ft
          </text>
        </g>
      )}

      <g transform={`translate(${PLANE_X} ${yTrue})`} className="dg-plane">
        <path d="M-26 -6 Q-26 -12 -14 -12 L16 -12 Q28 -12 32 -6 Q28 0 16 0 L-14 0 Q-26 0 -26 -6 Z" />
        <path d="M-2 -6 L-12 -28 L-4 -28 L10 -6 Z" />
        <path d="M-22 -10 L-30 -24 L-24 -24 L-14 -10 Z" />
      </g>
    </svg>
  )
}
