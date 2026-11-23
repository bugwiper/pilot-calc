import { fmtInt, fmtSigned } from '../../ui/format'

interface Props {
  distanceNm: number
  upperFt: number // beam coverage at the distance, relative to the aircraft (incl. curvature if on)
  lowerFt: number
  curvatureFt: number
  centerFt: number
  /** Straight-line (curvature-free) heights at the distance, used for the bend of the beam. */
  flat: { upper: number; lower: number; center: number }
}

const W = 360
const H = 290
const X0 = 50 // aircraft
const XR = 262 // entered distance = right end of the beam
const MID = 138 // aircraft level (y)
const HALF = 88 // px for the largest height

/** Side view: the beam spans the whole width from the aircraft to the entered distance. Vertical scale exaggerated. */
export function Diagram({ distanceNm, upperFt, lowerFt, centerFt, curvatureFt, flat }: Props) {
  const maxH = Math.max(Math.abs(upperFt), Math.abs(lowerFt), 1000)
  const y = (ft: number) => MID - (ft / maxH) * HALF
  const yUp = y(upperFt)
  const yLow = y(lowerFt)
  const yMid = y(centerFt)
  const xc = (X0 + XR) / 2
  const ctl = (f: number) => y(f / 2) // parabola control point (tangent at the aircraft, halfway)

  const AXIS_Y = H - 30

  return (
    <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weather radar coverage">
      {/* beam */}
      <path d={`M${X0} ${MID} Q${xc} ${ctl(flat.upper)} ${XR} ${yUp} L${XR} ${yLow} Q${xc} ${ctl(flat.lower)} ${X0} ${MID} Z`} className="dg-beam" />
      <path d={`M${X0} ${MID} Q${xc} ${ctl(flat.center)} ${XR} ${yMid}`} className="dg-center" />
      <path d={`M${X0} ${MID} Q${xc} ${ctl(flat.upper)} ${XR} ${yUp}`} className="dg-edge up" />
      <path d={`M${X0} ${MID} Q${xc} ${ctl(flat.lower)} ${XR} ${yLow}`} className="dg-edge up" />

      {/* own altitude */}
      <line x1={X0} x2={XR + 8} y1={MID} y2={MID} className="dg-level" />
      <text x="8" y={MID + 30} className="dg-label halo muted">own altitude</text>

      {/* coverage at the entered distance */}
      <line x1={XR + 10} x2={XR + 10} y1={yUp} y2={yLow} className="dg-vline" />
      <circle cx={XR} cy={yUp} r="4" className="dg-hit" />
      <circle cx={XR} cy={yLow} r="4" className="dg-hit" />
      <text x={XR + 16} y={yUp - 15} className="dg-tick muted">upper</text>
      <text x={XR + 16} y={yUp - 2} className="dg-label strong">{fmtSigned(upperFt)} ft</text>
      <text x={XR + 16} y={yLow + 13} className="dg-label strong">{fmtSigned(lowerFt)} ft</text>
      <text x={XR + 16} y={yLow + 25} className="dg-tick muted">lower</text>

      {/* distance axis */}
      <g className="dg-dist">
        <line x1={X0} x2={XR} y1={AXIS_Y} y2={AXIS_Y} />
        <line x1={X0} x2={X0} y1={AXIS_Y - 6} y2={AXIS_Y + 6} />
        <line x1={XR} x2={XR} y1={AXIS_Y - 6} y2={AXIS_Y + 6} />
        <text x={X0} y={AXIS_Y + 20} textAnchor="middle" className="dg-label muted">0</text>
        <text x={XR} y={AXIS_Y + 20} textAnchor="middle" className="dg-label">{fmtInt(distanceNm)} NM</text>
      </g>

      {curvatureFt > 0 && <text x={W - 6} y="14" textAnchor="end" className="dg-tick muted">incl. earth curvature (4/3)</text>}

      <g transform={`translate(${X0 - 18} ${MID + 3}) scale(.9)`} className="dg-plane">
        <path d="M-26 -6 Q-26 -12 -14 -12 L16 -12 Q28 -12 32 -6 Q28 0 16 0 L-14 0 Q-26 0 -26 -6 Z" />
        <path d="M-2 -6 L-12 -28 L-4 -28 L10 -6 Z" />
        <path d="M-22 -10 L-30 -24 L-24 -24 L-14 -10 Z" />
      </g>
    </svg>
  )
}
