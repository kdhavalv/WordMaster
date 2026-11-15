import { useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useAppState } from '../state/appContext'
import type { Locale } from '../types'
import { de } from './de'
import type { TranslationKey } from './de'
import { en } from './en'
import { I18nContext } from './i18nContext'
import type { TranslationValues } from './i18nContext'

const dictionaries = { de, en }

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key]

    return value === undefined ? match : String(value)
  })
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useAppState()
  const locale = state.settings.language
  const localeTag = locale === 'de' ? 'de-DE' : 'en-GB'

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      dispatch({ type: 'updateSettings', settings: { language: nextLocale } })
    },
    [dispatch],
  )

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) =>
      interpolate(dictionaries[locale][key], values),
    [locale],
  )

  const plural = useCallback(
    (
      count: number,
      one: TranslationKey,
      many: TranslationKey,
      values?: TranslationValues,
    ) => t(count === 1 ? one : many, { count, ...values }),
    [t],
  )

  const formatDate = useCallback(
    (iso: string) => {
      const date = new Date(iso)

      if (Number.isNaN(date.getTime())) {
        return ''
      }

      return new Intl.DateTimeFormat(localeTag, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    },
    [localeTag],
  )

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(localeTag, options).format(value),
    [localeTag],
  )

  const formatPercent = useCallback(
    (value: number) =>
      new Intl.NumberFormat(localeTag, {
        style: 'percent',
        maximumFractionDigits: 0,
      }).format(value),
    [localeTag],
  )

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = 'ltr'

    const description = document.querySelector('meta[name="description"]')

    if (description) {
      description.setAttribute('content', t('app.description'))
    }
  }, [locale, t])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      plural,
      formatDate,
      formatNumber,
      formatPercent,
    }),
    [
      locale,
      setLocale,
      t,
      plural,
      formatDate,
      formatNumber,
      formatPercent,
    ],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
