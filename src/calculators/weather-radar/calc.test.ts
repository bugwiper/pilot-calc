import { describe, expect, it } from 'vitest'
import { computeRadar } from './calc'

describe('computeRadar', () => {
  it('upper/lower edge are tilt ± ½ beam width', () => {
    const r = computeRadar({ beamWidthDeg: 4, tiltDeg: 1, distanceNm: 40 })
    expect(r.upperEdgeDeg).toBe(3)
    expect(r.lowerEdgeDeg).toBe(-1)
  })
  it('computes exact coverage and both rules for 40 NM, tilt +1°', () => {
    const r = computeRadar({ beamWidthDeg: 4, tiltDeg: 1, distanceNm: 40 })
    expect(r.upperFt).toBeCloseTo(12737, -1)
    expect(r.lowerFt).toBeCloseTo(-4242, -1)
    expect(r.rule60UpperFt).toBeCloseTo(12152.24, 1)
    expect(r.rule60LowerFt).toBeCloseTo(-4050.75, 1)
    expect(r.rule100UpperFt).toBe(12000)
    expect(r.rule100LowerFt).toBe(-4000)
    expect(r.rule100UpperErrorFt).toBeCloseTo(r.rule100UpperFt - r.upperFt, 9)
  })
  it('tilt down far enough puts both edges below the aircraft', () => {
    const r = computeRadar({ beamWidthDeg: 4, tiltDeg: -5, distanceNm: 30 })
    expect(r.upperEdgeDeg).toBe(-3)
    expect(r.upperFt).toBeLessThan(0)
    expect(r.lowerFt).toBeLessThan(r.upperFt)
    expect(r.rule100UpperFt).toBe(-9000)
  })
  it('upper edge exactly level gives zero', () => {
    expect(computeRadar({ beamWidthDeg: 4, tiltDeg: -2, distanceNm: 50 }).upperFt).toBeCloseTo(0, 9)
  })
  it('ignores earth curvature by default', () => {
    expect(computeRadar({ beamWidthDeg: 4, tiltDeg: -2, distanceNm: 100 }).curvatureFt).toBe(0)
  })
  it('adds the 4/3-earth curvature term to both edges when enabled', () => {
    const flat = computeRadar({ beamWidthDeg: 4, tiltDeg: -2, distanceNm: 100 })
    const r = computeRadar({ beamWidthDeg: 4, tiltDeg: -2, distanceNm: 100, earthCurvature: true })
    expect(r.curvatureFt).toBeCloseTo(6623.5, -1)
    expect(r.upperFt - flat.upperFt).toBeCloseTo(r.curvatureFt, 6)
    expect(r.lowerFt - flat.lowerFt).toBeCloseTo(r.curvatureFt, 6)
  })
})
