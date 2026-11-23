import { useId, useRef } from 'react'
import { isTouch, useKeypad } from './Keypad'

interface Props {
  label: string
  unit: string
  value: string
  onChange: (text: string) => void
  /** Allows negative values (enables the ± key of the keypad). */
  signed?: boolean
  hint?: string
}

export function NumberField({ label, unit, value, onChange, signed = false, hint }: Props) {
  const id = useId()
  const keypad = useKeypad()
  const touch = useRef(isTouch()).current
  const latest = useRef({ value, onChange })
  latest.current = { value, onChange }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        <input
          id={id}
          type="text"
          inputMode={touch ? 'none' : 'decimal'}
          readOnly={touch}
          autoComplete="off"
          autoCorrect="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            if (!touch) return e.target.select()
            keypad?.open({
              id,
              label,
              unit,
              signed,
              input: e.target,
              getValue: () => latest.current.value,
              onChange: (t) => latest.current.onChange(t),
            })
          }}
          onBlur={() => keypad?.close(id)}
        />
        <span className="unit">{unit}</span>
      </div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}
