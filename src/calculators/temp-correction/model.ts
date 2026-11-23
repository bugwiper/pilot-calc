// Linked-field input model: temp ⇄ ISA deviation, ref/aircraft MSL ⇄ height above ref.
import { formatField, parseNum } from '../../ui/numbers'
import { isaDevToTemp, tempToIsaDev } from './calc'

export { formatField, parseNum }

export type Field = 'temp' | 'dev' | 'ref' | 'ac' | 'above'

export interface FormState {
  nums: Record<Field, number | null>
  raw: Record<Field, string>
  /** Which of temp/dev the user entered last; it stays fixed when the reference height changes. */
  anchor: 'temp' | 'dev'
}

const EMPTY_RAW: Record<Field, string> = { temp: '', dev: '', ref: '', ac: '', above: '' }

export function makeState(nums: Partial<Record<Field, number>>, anchor: 'temp' | 'dev' = 'temp'): FormState {
  let s: FormState = {
    nums: { temp: null, dev: null, ref: null, ac: null, above: null },
    raw: { ...EMPTY_RAW },
    anchor,
  }
  // Apply user-entered fields in a stable order so the dependents get derived.
  for (const f of ['ref', 'ac', anchor] as Field[]) {
    const v = nums[f]
    if (v !== undefined) s = update(s, f, formatField(v, 4))
  }
  return s
}

export function update(prev: FormState, field: Field, text: string): FormState {
  const nums = { ...prev.nums }
  const raw = { ...prev.raw, [field]: text }
  let anchor = prev.anchor
  const value = parseNum(text)
  nums[field] = value
  const set = (f: Field, v: number | null) => {
    nums[f] = v
    raw[f] = formatField(v)
  }
  if (value === null) return { nums, raw, anchor }

  const syncTemp = () => {
    if (nums.ref === null) return
    if (anchor === 'temp' && nums.temp !== null) set('dev', tempToIsaDev(nums.temp, nums.ref))
    else if (anchor === 'dev' && nums.dev !== null) set('temp', isaDevToTemp(nums.dev, nums.ref))
  }

  switch (field) {
    case 'temp':
      anchor = 'temp'
      set('dev', nums.ref === null ? null : tempToIsaDev(value, nums.ref))
      break
    case 'dev':
      anchor = 'dev'
      set('temp', nums.ref === null ? null : isaDevToTemp(value, nums.ref))
      break
    case 'ref':
      syncTemp()
      if (nums.ac !== null) set('above', nums.ac - value)
      else if (nums.above !== null) set('ac', value + nums.above)
      break
    case 'ac':
      set('above', nums.ref === null ? null : value - nums.ref)
      break
    case 'above':
      set('ac', nums.ref === null ? null : nums.ref + value)
      break
  }
  return { nums, raw, anchor }
}
