import { describe, expect, it } from 'vitest'
import { computeCorrection, isaDevToTemp, isaPressureAltFt, isaPressureHpa, isaTempC, tempToIsaDev } from './calc'
import { makeState, parseNum, update } from './model'

describe('ISA temperature', () => {
  it('is 15 °C at sea level and falls 1.98 °C per 1000 ft', () => {
    expect(isaTempC(0)).toBe(15)
    expect(isaTempC(5000)).toBeCloseTo(5.1, 6)
  })
  it('converts temperature ⇄ deviation both ways', () => {
    expect(tempToIsaDev(-5, 5000)).toBeCloseTo(-10.1, 6)
    expect(isaDevToTemp(tempToIsaDev(-7.3, 2400), 2400)).toBeCloseTo(-7.3, 9)
  })
})

describe('ISA pressure', () => {
  it('matches standard values', () => {
    expect(isaPressureHpa(0)).toBeCloseTo(1013.25, 6)
    expect(isaPressureAltFt(500)).toBeCloseTo(18285, -2)
    expect(isaPressureHpa(18281)).toBeCloseTo(500, 0)
  })
  it('round-trips', () => {
    expect(isaPressureHpa(isaPressureAltFt(780))).toBeCloseTo(780, 6)
  })
})

describe('computeCorrection', () => {
  it('cold day: true altitude is lower than indicated', () => {
    const r = computeCorrection({ refFt: 0, indicatedFt: 5000, isaDev: -20 })
    expect(r.meanIsaTempK).toBeCloseTo(283.2, 6)
    expect(r.trueAltFt).toBeCloseTo(4646.89, 1)
    expect(r.correctionFt).toBeCloseTo(-353.11, 1)
    expect(r.ruleCorrectionFt).toBeCloseTo(-400, 6)
    expect(r.ruleErrorFt).toBeCloseTo(-46.89, 1)
  })
  it('warm day: true altitude is higher', () => {
    expect(computeCorrection({ refFt: 1000, indicatedFt: 6000, isaDev: 15 }).correctionFt).toBeGreaterThan(0)
  })
  it('ISA conditions give no correction', () => {
    const r = computeCorrection({ refFt: 500, indicatedFt: 4500, isaDev: 0 })
    expect(r.correctionFt).toBeCloseTo(0, 9)
    expect(r.trueAltFt).toBeCloseTo(4500, 9)
  })
  it('aircraft below the reference mirrors the sign', () => {
    const r = computeCorrection({ refFt: 3000, indicatedFt: 2000, isaDev: -20 })
    expect(r.heightAboveRef).toBe(-1000)
    expect(r.correctionFt).toBeGreaterThan(0) // true altitude is closer to the reference
  })
  it('flags layers above the tropopause', () => {
    expect(computeCorrection({ refFt: 0, indicatedFt: 40000, isaDev: 0 }).outsideValidRange).toBe(true)
  })
})

describe('linked input model', () => {
  const base = () => makeState({ ref: 1000, ac: 5000, temp: -10 })

  it('derives ISA deviation from temperature and height above ref', () => {
    const s = base()
    expect(s.nums.dev).toBeCloseTo(-10 - isaTempC(1000), 9)
    expect(s.nums.above).toBe(4000)
  })
  it('editing ISA deviation updates the temperature', () => {
    const s = update(base(), 'dev', '-20')
    expect(s.nums.temp).toBeCloseTo(-20 + isaTempC(1000), 9)
    expect(s.anchor).toBe('dev')
  })
  it('editing height above ref updates aircraft MSL', () => {
    expect(update(base(), 'above', '2500').nums.ac).toBe(3500)
  })
  it('editing reference MSL keeps the anchored temperature and the aircraft MSL', () => {
    const s = update(base(), 'ref', '2000')
    expect(s.nums.temp).toBe(-10)
    expect(s.nums.dev).toBeCloseTo(-10 - isaTempC(2000), 9)
    expect(s.nums.ac).toBe(5000)
    expect(s.nums.above).toBe(3000)
  })
  it('keeps the deviation fixed when it was entered last', () => {
    const s = update(update(base(), 'dev', '-20'), 'ref', '2000')
    expect(s.nums.dev).toBe(-20)
    expect(s.nums.temp).toBeCloseTo(-20 + isaTempC(2000), 9)
  })
  it('invalid text leaves the other fields alone', () => {
    const s = update(base(), 'temp', '-')
    expect(s.nums.temp).toBeNull()
    expect(s.nums.ac).toBe(5000)
  })
  it('parses commas and unicode minus', () => {
    expect(parseNum('−3,5')).toBe(-3.5)
    expect(parseNum('abc')).toBeNull()
    expect(parseNum('')).toBeNull()
  })
})
