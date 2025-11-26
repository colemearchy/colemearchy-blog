export const locales = ['en', 'ko'] as const
export type Locale = typeof locales[number]
export const defaultLocale: Locale = 'en' // Default to English for broader audience

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

export const languageNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
}

export function getAlternateLinks(pathname: string) {
  return locales.map((locale) => ({
    locale,
    url: `/${locale}${pathname}`,
  }))
}