// Airborne weather radar: height of a target (e.g. a cloud top) relative to the aircraft,
// from antenna tilt, beam width and range. Flat-earth geometry; curvature/refraction neglected.

export const FT_PER_NM = 6076.12

export interface RadarInput {
  beamWidthDeg: number
  /** Antenna tilt in degrees, + = up, − = down. */
  tiltDeg: number
  distanceNm: number
}

export interface RadarResult {
  /** Elevation of the upper beam edge, + above the horizon. Used to find tops. */
  upperEdgeDeg: number
  lowerEdgeDeg: number
  /** Target height relative to the aircraft, ft (+ above, − below). */
  exactFt: number
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

export function computeRadar({ beamWidthDeg, tiltDeg, distanceNm }: RadarInput): RadarResult {
  const upperEdgeDeg = tiltDeg + beamWidthDeg / 2
  const lowerEdgeDeg = tiltDeg - beamWidthDeg / 2
  const exactFt = heightAt(distanceNm, upperEdgeDeg)
  const rule60Ft = ((distanceNm * upperEdgeDeg) / 60) * FT_PER_NM
  const rule100Ft = distanceNm * upperEdgeDeg * 100
  return {
    upperEdgeDeg,
    lowerEdgeDeg,
    exactFt,
    rule60Ft,
    rule100Ft,
    rule60ErrorFt: rule60Ft - exactFt,
    rule100ErrorFt: rule100Ft - exactFt,
    beamDepthFt: heightAt(distanceNm, upperEdgeDeg) - heightAt(distanceNm, lowerEdgeDeg),
  }
}
