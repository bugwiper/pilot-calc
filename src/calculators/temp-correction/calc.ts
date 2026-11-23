// Pure calculation logic for the temperature correction of altitudes.
// Kept free of React/DOM so it can be unit tested (see calc.test.ts).

export const ISA_SL_TEMP_C = 15
export const ISA_SL_TEMP_K = 288.15
/** Standard lapse rate in °C (= K) per ft below the tropopause. */
export const ISA_LAPSE_PER_FT = 0.00198
export const TROPOPAUSE_FT = 36089
/** ICAO rule of thumb: 4 ft per 1000 ft of height above the reference per 1 °C ISA deviation. */
export const RULE_FT_PER_1000FT_PER_DEG = 4

export const isaTempC = (altFt: number) => ISA_SL_TEMP_C - ISA_LAPSE_PER_FT * altFt

export const tempToIsaDev = (tempC: number, refFt: number) => tempC - isaTempC(refFt)
export const isaDevToTemp = (devC: number, refFt: number) => devC + isaTempC(refFt)

export interface CorrectionInput {
  refFt: number // elevation of the reference (altimeter setting source), ft MSL
  indicatedFt: number // altitude indicated on the altimeter, ft MSL
  isaDev: number // ISA deviation at the reference, °C (assumed constant over the layer)
}

export interface CorrectionResult {
  heightAboveRef: number // indicated − ref
  meanIsaTempK: number // ISA mean temperature of the layer
  meanActualTempK: number // mean temperature of the layer incl. deviation
  trueHeightAboveRef: number
  trueAltFt: number
  correctionFt: number // true − indicated (negative when colder than ISA)
  ruleCorrectionFt: number
  ruleTrueAltFt: number
  ruleErrorFt: number // rule − exact
  outsideValidRange: boolean // layer reaches above the tropopause
}

export function computeCorrection({ refFt, indicatedFt, isaDev }: CorrectionInput): CorrectionResult {
  const heightAboveRef = indicatedFt - refFt
  const meanIsaTempK = ISA_SL_TEMP_K - ISA_LAPSE_PER_FT * (refFt + indicatedFt) / 2
  const meanActualTempK = meanIsaTempK + isaDev
  const trueHeightAboveRef = (heightAboveRef * meanActualTempK) / meanIsaTempK
  const trueAltFt = refFt + trueHeightAboveRef
  const correctionFt = trueAltFt - indicatedFt
  const ruleCorrectionFt = (RULE_FT_PER_1000FT_PER_DEG * heightAboveRef * isaDev) / 1000
  return {
    heightAboveRef,
    meanIsaTempK,
    meanActualTempK,
    trueHeightAboveRef,
    trueAltFt,
    correctionFt,
    ruleCorrectionFt,
    ruleTrueAltFt: indicatedFt + ruleCorrectionFt,
    ruleErrorFt: ruleCorrectionFt - correctionFt,
    outsideValidRange: Math.max(refFt, indicatedFt) > TROPOPAUSE_FT,
  }
}
