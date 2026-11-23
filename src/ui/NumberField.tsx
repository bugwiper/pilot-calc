import { useId } from 'react'

interface Props {
  label: string
  unit: string
  value: string
  onChange: (text: string) => void
  /** Show a ± button (iOS decimal keypads have no minus key). */
  signed?: boolean
  hint?: string
}

export function NumberField({ label, unit, value, onChange, signed = false, hint }: Props) {
  const id = useId()
  const toggleSign = () => {
    const t = value.trim()
    if (t.startsWith('-') || t.startsWith('−')) onChange(t.slice(1))
    else onChange('-' + t)
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        {signed && (
          <button type="button" className="sign-btn" onClick={toggleSign} aria-label="Toggle sign">
            ±
          </button>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="done"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <span className="unit">{unit}</span>
      </div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}
