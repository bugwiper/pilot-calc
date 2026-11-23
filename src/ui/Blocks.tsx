import type { ReactNode } from 'react'

/** Card with a heading; the building block of every calculator page. */
export function Section({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
      {note && <p className="note">{note}</p>}
    </section>
  )
}

/** Fields that compute each other. */
export function LinkedGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="linked">
      <div className="linked-title">
        <span>{title}</span>
        <span className="linked-badge" title="Editing one value updates the linked values">
          ⇄ linked
        </span>
      </div>
      <div className="linked-fields">{children}</div>
    </div>
  )
}

export function Result({
  label,
  value,
  unit,
  tone = 'neutral',
  big = false,
}: {
  label: string
  value: string
  unit: string
  tone?: 'neutral' | 'accent' | 'warn'
  big?: boolean
}) {
  return (
    <div className={`result ${tone} ${big ? 'big' : ''}`}>
      <div className="result-label">{label}</div>
      <div className="result-value">
        {value}
        <span className="unit">{unit}</span>
      </div>
    </div>
  )
}

export function Formula({ children }: { children: ReactNode }) {
  return <div className="formula">{children}</div>
}
