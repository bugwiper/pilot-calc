import type { ComponentType } from 'react'
import TempCorrectionPage from './temp-correction/Page'

export type Group = 'general' | 'ground' | 'airborne'

export interface Calculator {
  id: string
  title: string
  subtitle: string
  group: Group
  Page: ComponentType
}

export const GROUPS: { id: Group; title: string }[] = [
  { id: 'general', title: 'General' },
  { id: 'ground', title: 'On ground' },
  { id: 'airborne', title: 'Airborne' },
]

/** Add a calculator here and it shows up in the navigation. */
export const CALCULATORS: Calculator[] = [
  {
    id: 'temp-correction',
    title: 'Temperature correction',
    subtitle: 'True altitude from indicated altitude and ISA deviation',
    group: 'airborne',
    Page: TempCorrectionPage,
  },
]
