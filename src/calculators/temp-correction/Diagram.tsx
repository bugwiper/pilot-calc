import { fmtInt, fmtSigned } from '../../ui/format'
import { computeCorrection, isaPressureAltFt } from './calc'

interface Props {
  refFt: number
  indicatedFt: number
  isaDev: number
}

const W = 360
const H = 300
const TOP = 28
const BOTTOM = 266
const L = 40 // plot area left (actual-pressure gutter on the left)
const R = 322 // plot area right (ISA-pressure gutter on the right)
const PLANE_X = 212

/** Pressure levels (hPa) to draw: every 100 hPa, every 50 hPa when that would give too few lines. */
function pressureLevels(minFt: number, maxFt: number): number[] {
  const inRange = (step: number) => {
    const out: number[] = []
    for (let p = 1000; p >= 100; p -= step) {
      const h = isaPressureAltFt(p)
      if (h >= minFt && h <= maxFt) out.push(p)
    }
    return out
  }
  const coarse = inRange(100)
  return coarse.length >= 4 ? coarse : inRange(50)
}

/** Side view: terrain, sea, pressure surfaces (ISA dashed, actual solid) and the aircraft. */
export function Diagram({ refFt, indicatedFt, isaDev }: Props) {
  const r = computeCorrection({ refFt, indicatedFt, isaDev })
  const trueFt = r.trueAltFt

  const lo = Math.min(0, refFt, indicatedFt, trueFt)
  const hi = Math.max(0, refFt, indicatedFt, trueFt)
  const span = hi - lo || 1000
  const pad = span * 0.1
  const min = lo - (lo < 0 ? pad : 0)
  const max = hi + pad
  const y = (ft: number) => BOTTOM - ((ft - min) / (max - min)) * (BOTTOM - TOP)

  const levels = pressureLevels(min, max).map((p) => {
    const ind = isaPressureAltFt(p)
    const act = computeCorrection({ refFt, indicatedFt: ind, isaDev }).trueAltFt
    return { p, yIsa: y(ind), yAct: y(act) }
  })

  const ySea = y(0)
  const yRef = y(refFt)
  const yInd = y(indicatedFt)
  const yTrue = y(trueFt)
  const trueIsHigher = trueFt > indicatedFt
  const corr = trueFt - indicatedFt

  // wavy sea surface
  const wave = Array.from({ length: 37 }, (_, i) => {
    const x = (i / 36) * W
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(ySea + Math.sin(i * 1.3) * 2.2).toFixed(1)}`
  }).join(' ')

  return (
    <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Altitude diagram">
      <defs>
        <linearGradient id="dg-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="dg-water-top" />
          <stop offset="1" className="dg-water-bottom" />
        </linearGradient>
      </defs>

      {/* sea and terrain */}
      <path d={`${wave} L${W} ${H} L0 ${H} Z`} fill="url(#dg-water)" />
      <path d={wave} className="dg-wave" />
      <path d={`M${L} ${ySea} L${L} ${yRef} L104 ${yRef} L136 ${ySea} Z`} className="dg-terrain" />
      <line x1={L} x2="104" y1={yRef} y2={yRef} className="dg-grass" />
      <text x="8" y={ySea + 18} className="dg-label halo muted">MSL 0 ft</text>

      {/* gutters header */}
      <text x="4" y="14" className="dg-tick strong">actual hPa</text>
      <text x={W - 4} y="14" textAnchor="end" className="dg-tick muted">ISA hPa</text>

      {/* barometric lines every 100 (or 50) hPa */}
      {levels.map(({ p, yIsa, yAct }) => (
        <g key={p}>
          <line x1={L} x2={R} y1={yIsa} y2={yIsa} className="dg-baro isa" />
          <text x={W - 4} y={yIsa + 3.5} textAnchor="end" className="dg-tick muted">{p}</text>
          <line x1={L} x2={R} y1={yAct} y2={yAct} className="dg-baro act" />
          <text x="4" y={yAct + 3.5} className="dg-tick strong">{p}</text>
        </g>
      ))}

      {/* reference level (altimeter set to reference QNH → ISA and actual coincide) */}
      <line x1={L} x2={R} y1={yRef} y2={yRef} className="dg-line true" />
      <text x={R - 6} y={yRef + (refFt <= indicatedFt ? 15 : -7)} textAnchor="end" className="dg-label halo">
        Reference {fmtInt(refFt)} ft
      </text>

      {/* ISA surface at the indicated altitude (dashed) */}
      <line x1={L} x2={R} y1={yInd} y2={yInd} className="dg-line isa" />
      <text x={L + 6} y={yInd + (trueIsHigher ? 15 : -7)} className="dg-label halo muted">
        Indicated {fmtInt(indicatedFt)} ft
      </text>

      {/* surface at the actual temperature (solid) */}
      <line x1={L} x2={R} y1={yTrue} y2={yTrue} className="dg-line true" />
      <text x={L + 6} y={yTrue + (trueIsHigher ? -7 : 15)} className="dg-label halo strong">
        True {fmtInt(trueFt)} ft
      </text>

      {/* correction dimension */}
      {Math.abs(yTrue - yInd) > 3 && (
        <g className="dg-dim">
          <line x1="306" x2="306" y1={yInd} y2={yTrue} />
          <path d={`M301 ${yTrue + (yInd < yTrue ? -6 : 6)} L306 ${yTrue} L311 ${yTrue + (yInd < yTrue ? -6 : 6)}`} fill="none" />
          <text x="298" y={(yInd + yTrue) / 2 + 4} textAnchor="end" className="dg-label halo warn">
            {fmtSigned(corr)} ft
          </text>
        </g>
      )}

      {/* aircraft on the true altitude */}
      <g transform={`translate(${PLANE_X} ${yTrue})`} className="dg-plane">
        <path d="M-26 -6 Q-26 -12 -14 -12 L16 -12 Q28 -12 32 -6 Q28 0 16 0 L-14 0 Q-26 0 -26 -6 Z" />
        <path d="M-2 -6 L-12 -28 L-4 -28 L10 -6 Z" />
        <path d="M-22 -10 L-30 -24 L-24 -24 L-14 -10 Z" />
      </g>
    </svg>
  )
}

