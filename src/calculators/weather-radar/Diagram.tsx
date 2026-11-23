import { fmtDec, fmtInt, fmtSigned } from '../../ui/format'
import { heightAt } from './calc'

interface Props {
  beamWidthDeg: number
  tiltDeg: number
  distanceNm: number
  heightFt: number // target height relative to the aircraft
}

const W = 360
const H = 290
const X0 = 50 // aircraft
const XO = 186 // target
const MID = 140 // aircraft level (y)
const HALF = 100 // px for the largest height

/** Side view: beam wedge from the aircraft, cloud whose top sits on the upper beam edge. Vertical scale exaggerated. */
export function Diagram({ beamWidthDeg, tiltDeg, distanceNm, heightFt }: Props) {
  const up = tiltDeg + beamWidthDeg / 2
  const low = tiltDeg - beamWidthDeg / 2
  const hUp = heightAt(distanceNm, up)
  const hMid = heightAt(distanceNm, tiltDeg)
  const hLow = heightAt(distanceNm, low)
  const maxH = Math.max(Math.abs(hUp), Math.abs(hMid), Math.abs(hLow), 1000)
  const y = (ft: number) => MID - (ft / maxH) * HALF

  const yUp = y(hUp)
  const yMid = y(hMid)
  const yLow = y(hLow)
  const yTop = yUp // cloud top = object on the upper edge
  const above = heightFt >= 0

  return (
    <svg className="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weather radar geometry">
      {/* cloud with its top on the upper beam edge */}
      <g className="dg-cloud">
        <circle cx={XO} cy={yTop + 24} r="24" />
        <circle cx={XO - 28} cy={yTop + 38} r="20" />
        <circle cx={XO + 28} cy={yTop + 38} r="20" />
        <circle cx={XO - 10} cy={yTop + 52} r="22" />
        <circle cx={XO + 14} cy={yTop + 56} r="22" />
        <rect x={XO - 48} y={yTop + 50} width="96" height="28" rx="12" />
      </g>

      {/* beam */}
      <path d={`M${X0} ${MID} L${XO} ${yUp} L${XO} ${yLow} Z`} className="dg-beam" />
      <line x1={X0} y1={MID} x2={XO} y2={yMid} className="dg-center" />
      <line x1={X0} y1={MID} x2={XO} y2={yLow} className="dg-edge" />
      <line x1={X0} y1={MID} x2={XO} y2={yUp} className="dg-edge up" />
      <circle cx={XO} cy={yUp} r="4.5" className="dg-hit" />

      {/* aircraft level */}
      <line x1={X0} x2="262" y1={MID} y2={MID} className="dg-level" />
      <text x="258" y={MID - 6} textAnchor="end" className="dg-label halo muted">my altitude</text>

      {/* height difference */}
      {Math.abs(yUp - MID) > 4 && (
        <g className="dg-dim">
          <line x1="268" x2="268" y1={MID} y2={yUp} />
          <path d={`M263 ${yUp + (above ? 6 : -6)} L268 ${yUp} L273 ${yUp + (above ? 6 : -6)}`} fill="none" />
          <text x="276" y={(MID + yUp) / 2 + 4} className="dg-label halo warn">
            {fmtSigned(heightFt)} ft
          </text>
        </g>
      )}

      {/* distance */}
      <g className="dg-dist">
        <line x1={X0} x2={XO} y1={H - 22} y2={H - 22} />
        <line x1={X0} x2={X0} y1={H - 28} y2={H - 16} />
        <line x1={XO} x2={XO} y1={H - 28} y2={H - 16} />
        <text x={(X0 + XO) / 2} y={H - 8} textAnchor="middle" className="dg-label">{fmtInt(distanceNm)} NM</text>
      </g>

      {/* upper edge angle */}
      <text x={X0 + 64} y={Math.min(yUp, MID) > MID - 14 ? MID - 18 : (yUp + MID) / 2 - 6} className="dg-label halo strong">
        α {fmtDec(up)}°
      </text>

      <g transform={`translate(${X0 - 18} ${MID + 3}) scale(.9)`} className="dg-plane">
        <path d="M-26 -6 Q-26 -12 -14 -12 L16 -12 Q28 -12 32 -6 Q28 0 16 0 L-14 0 Q-26 0 -26 -6 Z" />
        <path d="M-2 -6 L-12 -28 L-4 -28 L10 -6 Z" />
        <path d="M-22 -10 L-30 -24 L-24 -24 L-14 -10 Z" />
      </g>
    </svg>
  )
}
