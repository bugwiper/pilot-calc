import { describe, expect, it } from 'vitest'
import { computeRadar } from './calc'

describe('computeRadar', () => {
  it('uses the upper beam edge (tilt + ½ beam width)', () => {
    const r = computeRadar({ beamWidthDeg: 4, tiltDeg: 1, distanceNm: 40 })
    expect(r.upperEdgeDeg).toBe(3)
    expect(r.lowerEdgeDeg).toBe(-1)
  })
  it('computes exact height and both rules for 40 NM at 3°', () => {
    const r = computeRadar({ beamWidthDeg: 4, tiltDeg: 1, distanceNm: 40 })
    expect(r.exactFt).toBeCloseTo(12737, -1)
    expect(r.rule60Ft).toBeCloseTo(12152.24, 1)
    expect(r.rule100Ft).toBe(12000)
    expect(r.rule100ErrorFt).toBeCloseTo(r.rule100Ft - r.exactFt, 9)
  })
  it('tilt down far enough puts the top below the aircraft', () => {
    const r = computeRadar({ beamWidthDeg: 4, tiltDeg: -5, distanceNm: 30 })
    expect(r.upperEdgeDeg).toBe(-3)
    expect(r.exactFt).toBeLessThan(0)
    expect(r.rule100Ft).toBe(-9000)
  })
  it('zero upper edge means level with the aircraft', () => {
    expect(computeRadar({ beamWidthDeg: 4, tiltDeg: -2, distanceNm: 50 }).exactFt).toBeCloseTo(0, 9)
  })
  it('ignores earth curvature by default', () => {
    expect(computeRadar({ beamWidthDeg: 4, tiltDeg: -2, distanceNm: 100 }).curvatureFt).toBe(0)
  })
  it('adds the 4/3-earth curvature term when enabled', () => {
    const r = computeRadar({ beamWidthDeg: 4, tiltDeg: -2, distanceNm: 100, earthCurvature: true })
    expect(r.curvatureFt).toBeCloseTo(6623.5, -1)
    expect(r.exactFt).toBeCloseTo(r.curvatureFt, 6)
    expect(r.beamDepthFt).toBeGreaterThan(0)
  })
})
