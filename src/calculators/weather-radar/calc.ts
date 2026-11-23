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
  /** Elevation of the upper beam edge, + above the horizon. Used to find tops. */
  upperEdgeDeg: number
  lowerEdgeDeg: number
  /** Target height relative to the aircraft, ft (+ above, − below); includes curvature when enabled. */
  exactFt: number
  /** Part of exactFt that comes from earth curvature (0 when disabled). */
  curvatureFt: number
  /** 1:60 rule: 1° ≙ 1 NM at 60 NM. */
  rule60Ft: number
  /** 100 rule: 100 ft per NM per degree. */
  rule100Ft: number
  rule60ErrorFt: number
  rule100ErrorFt: number
  /** Vertical extent of the beam at the target distance. */
  beamDepthFt: number
}

const rad = (deg: number) => (deg * Math.PI) / 180
export const heightAt = (distanceNm: number, angleDeg: number) => distanceNm * FT_PER_NM * Math.tan(rad(angleDeg))

/** Height the earth's surface falls away at a distance, relative to the aircraft's level plane (ft). */
export const curvatureFt = (distanceNm: number) => (distanceNm ** 2 / (2 * EFFECTIVE_RADIUS_NM)) * FT_PER_NM

export function computeRadar({ beamWidthDeg, tiltDeg, distanceNm, earthCurvature = false }: RadarInput): RadarResult {
  const upperEdgeDeg = tiltDeg + beamWidthDeg / 2
  const lowerEdgeDeg = tiltDeg - beamWidthDeg / 2
  const curv = earthCurvature ? curvatureFt(distanceNm) : 0
  const exactFt = heightAt(distanceNm, upperEdgeDeg) + curv
  const rule60Ft = ((distanceNm * upperEdgeDeg) / 60) * FT_PER_NM
  const rule100Ft = distanceNm * upperEdgeDeg * 100
  return {
    upperEdgeDeg,
    lowerEdgeDeg,
    exactFt,
    curvatureFt: curv,
    rule60Ft,
    rule100Ft,
    rule60ErrorFt: rule60Ft - exactFt,
    rule100ErrorFt: rule100Ft - exactFt,
    beamDepthFt: heightAt(distanceNm, upperEdgeDeg) - heightAt(distanceNm, lowerEdgeDeg),
  }
}
