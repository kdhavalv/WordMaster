import { createContext, useContext } from 'react'
import type { Locale } from '../types'
import type { TranslationKey } from './de'

export type TranslationValues = Record<string, string | number>

export type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, values?: TranslationValues) => string
  plural: (
    count: number,
    one: TranslationKey,
    many: TranslationKey,
    values?: TranslationValues,
  ) => string
  formatDate: (iso: string) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatPercent: (value: number) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useI18n(): I18nValue {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider.')
  }

  return context
}
