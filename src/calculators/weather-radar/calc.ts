// Airborne weather radar: height of a target (e.g. a cloud top) relative to the aircraft,
// from antenna tilt, beam width and range. Flat-earth geometry; curvature/refraction neglected.

export const FT_PER_NM = 6076.12
export const EARTH_RADIUS_NM = 3440.065
/** Standard refraction: the beam bends along an earth of 4/3 the real radius. */
export const EFFECTIVE_RADIUS_NM = (EARTH_RADIUS_NM * 4) / 3

export interface RadarInput {
  beamWidthDeg: number
  /** Antenna tilt in degrees, + = up, − = down. */
  tiltDeg: number
  distanceNm: number
  /** Include earth curvature (4/3 earth). Default off. */
  earthCurvature?: boolean
}

export interface RadarResult {
  /** Elevation of the upper / lower beam edge, + above the horizon. */
  upperEdgeDeg: number
  lowerEdgeDeg: number
  /** Beam coverage at the distance relative to the aircraft, ft (+ above, − below); includes curvature when enabled. */
  upperFt: number
  lowerFt: number
  /** Part of upperFt/lowerFt that comes from earth curvature (0 when disabled). */
  curvatureFt: number
  /** 1:60 rule: 1° ≙ 1 NM at 60 NM. */
  rule60UpperFt: number
  rule60LowerFt: number
  /** 100 rule: 100 ft per NM per degree. */
  rule100UpperFt: number
  rule100LowerFt: number
  /** Rule − exact. */
  rule60UpperErrorFt: number
  rule60LowerErrorFt: number
  rule100UpperErrorFt: number
  rule100LowerErrorFt: number
}

const rad = (deg: number) => (deg * Math.PI) / 180
export const heightAt = (distanceNm: number, angleDeg: number) => distanceNm * FT_PER_NM * Math.tan(rad(angleDeg))

/** Height the earth's surface falls away at a distance, relative to the aircraft's level plane (ft). */
export const curvatureFt = (distanceNm: number) => (distanceNm ** 2 / (2 * EFFECTIVE_RADIUS_NM)) * FT_PER_NM

export function computeRadar({ beamWidthDeg, tiltDeg, distanceNm, earthCurvature = false }: RadarInput): RadarResult {
  const upperEdgeDeg = tiltDeg + beamWidthDeg / 2
  const lowerEdgeDeg = tiltDeg - beamWidthDeg / 2
  const curv = earthCurvature ? curvatureFt(distanceNm) : 0
  const upperFt = heightAt(distanceNm, upperEdgeDeg) + curv
  const lowerFt = heightAt(distanceNm, lowerEdgeDeg) + curv
  const rule60 = (deg: number) => ((distanceNm * deg) / 60) * FT_PER_NM
  const rule100 = (deg: number) => distanceNm * deg * 100
  return {
    upperEdgeDeg,
    lowerEdgeDeg,
    upperFt,
    lowerFt,
    curvatureFt: curv,
    rule60UpperFt: rule60(upperEdgeDeg),
    rule60LowerFt: rule60(lowerEdgeDeg),
    rule100UpperFt: rule100(upperEdgeDeg),
    rule100LowerFt: rule100(lowerEdgeDeg),
    rule60UpperErrorFt: rule60(upperEdgeDeg) - upperFt,
    rule60LowerErrorFt: rule60(lowerEdgeDeg) - lowerFt,
    rule100UpperErrorFt: rule100(upperEdgeDeg) - upperFt,
    rule100LowerErrorFt: rule100(lowerEdgeDeg) - lowerFt,
  }
}
