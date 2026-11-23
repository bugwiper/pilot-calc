import { fmtInt, fmtSigned } from '../../ui/format'

interface Props {
  refFt: number
  indicatedFt: number
  trueFt: number
}

const W = 360
const H = 300
const TOP = 28
const BOTTOM = 270
const PLANE_X = 175

/** Side view: sea level, reference station, pressure surfaces (ISA dashed, actual solid) and the aircraft. */
export function Diagram({ refFt, indicatedFt, trueFt }: Props) {
  const lo = Math.min(0, refFt, indicatedFt, trueFt)
  const hi = Math.max(0, refFt, indicatedFt, trueFt)
  const span = hi - lo || 1000
  const pad = span * 0.1
  const min = lo - (lo < 0 ? pad : 0)
  const max = hi + pad
  const y = (ft: number) => BOTTOM - ((ft - min) / (max - min)) * (BOTTOM - TOP)

  const ySea = y(0)
  const yRef = y(refFt)
  const yInd = y(indicatedFt)
  const yTrue = y(trueFt)
  const trueIsHigher = trueFt > indicatedFt
  const corr = trueFt - indicatedFt

  return (
    <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Altitude diagram">
      {/* ground below sea level / terrain up to the reference elevation */}
      <rect x="0" y={ySea} width={W} height={H - ySea} className="dg-sea" />
      <path d={`M0 ${ySea} L0 ${yRef} L96 ${yRef} L124 ${ySea} Z`} className="dg-terrain" />
      <line x1="0" x2={W} y1={ySea} y2={ySea} className="dg-seaLine" />
      <text x="8" y={ySea + 16} className="dg-label muted">MSL 0 ft</text>

      {/* reference pressure surface (altimeter set to reference QNH → ISA and actual coincide) */}
      <line x1="0" x2={W} y1={yRef} y2={yRef} className="dg-line true" />
      <text x={W - 8} y={yRef + (refFt <= indicatedFt ? 15 : -7)} textAnchor="end" className="dg-label halo">
        Reference {fmtInt(refFt)} ft
      </text>

      {/* ISA pressure surface at the indicated altitude (dashed) */}
      <line x1="0" x2={W} y1={yInd} y2={yInd} className="dg-line isa" />
      <text x="8" y={yInd + (trueIsHigher ? 15 : -7)} className="dg-label halo muted">
        ISA · indicated {fmtInt(indicatedFt)} ft
      </text>

      {/* pressure surface at the actual temperature (solid) */}
      <line x1="0" x2={W} y1={yTrue} y2={yTrue} className="dg-line true" />
      <text x="8" y={yTrue + (trueIsHigher ? -7 : 15)} className="dg-label halo strong">
        True {fmtInt(trueFt)} ft
      </text>

      {/* correction dimension */}
      {Math.abs(yTrue - yInd) > 3 && (
        <g className="dg-dim">
          <line x1="338" x2="338" y1={yInd} y2={yTrue} />
          <path d={`M333 ${yTrue + (yInd < yTrue ? -6 : 6)} L338 ${yTrue} L343 ${yTrue + (yInd < yTrue ? -6 : 6)}`} fill="none" />
          <text x="330" y={(yInd + yTrue) / 2 + 4} textAnchor="end" className="dg-label halo strong">
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
