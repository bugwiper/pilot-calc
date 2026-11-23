import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/** Touch devices get an in-app keypad: iOS has no numeric keyboard with a minus key. */
export const isTouch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches

export interface KeypadTarget {
  id: string
  label: string
  unit: string
  signed: boolean
  input: HTMLInputElement
  getValue: () => string
  onChange: (text: string) => void
}

interface Ctx {
  open: (t: KeypadTarget) => void
  close: (id: string) => void
}
const KeypadContext = createContext<Ctx | null>(null)
export const useKeypad = () => useContext(KeypadContext)

export function applyKey(cur: string, key: string, fresh: boolean): string {
  if (key === 'back') return cur.slice(0, -1)
  if (key === '±') return cur.startsWith('-') ? cur.slice(1) : '-' + cur
  const base = fresh ? '' : cur
  if (key === '.') {
    if (base.includes('.')) return base
    return base === '' || base === '-' ? base + '0.' : base + '.'
  }
  if (base === '0') return key
  if (base === '-0') return '-' + key
  return base + key
}

export function KeypadProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<KeypadTarget | null>(null)
  const fresh = useRef(true)

  const open = useCallback((t: KeypadTarget) => {
    fresh.current = true
    setTarget(t)
    // let the sheet render, then bring the field into view above it
    setTimeout(() => t.input.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60)
  }, [])
  const close = useCallback((id: string) => setTarget((t) => (t?.id === id ? null : t)), [])
  const ctx = useMemo(() => ({ open, close }), [open, close])

  useEffect(() => {
    document.body.classList.toggle('keypad-open', target !== null)
  }, [target])

  const press = (key: string) => {
    if (!target) return
    const next = applyKey(target.getValue(), key, fresh.current)
    fresh.current = false
    target.onChange(next)
  }

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '±', '0', '.']
  // Keep focus in the field while tapping keys.
  const keep = (e: React.SyntheticEvent) => e.preventDefault()

  return (
    <KeypadContext.Provider value={ctx}>
      {children}
      {target && (
        <div className="keypad" onMouseDown={keep} onPointerDown={keep} role="group" aria-label="Number keypad">
          <div className="keypad-head">
            <span>
              {target.label} <span className="unit">{target.unit}</span>
            </span>
            <button type="button" className="keypad-done" onClick={() => { target.input.blur(); setTarget(null) }}>
              Done
            </button>
          </div>
          <div className="keypad-body">
          <div className="keypad-grid">
            {keys.map((k) => (
              <button
                key={k}
                type="button"
                className={k === '±' ? 'key sign' : 'key'}
                disabled={k === '±' && !target.signed}
                onClick={() => press(k)}
              >
                {k}
              </button>
            ))}
          </div>
          <button type="button" className="key back" aria-label="Delete" onClick={() => press('back')}>
            ⌫
          </button>
          </div>
        </div>
      )}
    </KeypadContext.Provider>
  )
}
