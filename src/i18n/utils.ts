import { ui, defaultLang, type Lang, type UiKey } from './translations';

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

/** Returns a t() function scoped to the given language. */
export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return (ui[lang] as Record<string, string>)[key] ?? (ui[defaultLang] as Record<string, string>)[key] ?? key;
  };
}

/** Builds the equivalent URL for a given language. Always includes trailing slash. */
export function getLocalizedPath(lang: Lang, pathname: string): string {
  const stripped = pathname.replace(/^\/(hi|es|fr)(\/|$)/, '/');
  if (lang === defaultLang) {
    const path = stripped || '/';
    return path.endsWith('/') ? path : `${path}/`;
  }
  const base = `/${lang}${stripped === '/' ? '' : stripped}`;
  return base.endsWith('/') ? base : `${base}/`;
}

/**
 * Paths that have translated versions (hi/es/fr).
 * Any path NOT here falls back to the locale root when switching language.
 */
export const localizedPages = new Set([
  '/',
  '/bmi-chart',
  '/bmi-calculator-for-women',
  '/bmi-calculator-for-men',
]);

/**
 * Safe language-switch URL: goes to the localized page if it exists,
 * otherwise falls back to the locale root (e.g. /hi/) to avoid 404s.
 */
export function safeLocalizedPath(lang: Lang, pathname: string): string {
  // Strip lang prefix and trailing slash to get the canonical bare path
  const bare = (pathname.replace(/^\/(hi|es|fr)(\/|$)/, '/') || '/').replace(/\/$/, '') || '/';
  if (lang === defaultLang || localizedPages.has(bare)) {
    return getLocalizedPath(lang, bare);
  }
  return `/${lang}/`;
}

/** All locales (used for hreflang generation). */
export const locales: Lang[] = ['en', 'hi', 'es', 'fr'];
