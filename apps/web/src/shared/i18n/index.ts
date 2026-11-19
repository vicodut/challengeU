import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fr from './fr.json';

export const resources = { en: { translation: en }, fr: { translation: fr } } as const;
export const supportedLocales = Object.keys(resources);
export const FALLBACK_LOCALE = 'en';

/** The browser language when we ship it, else English. Nothing is persisted. */
export function detectLocale(): string {
  const languages = 'navigator' in globalThis ? globalThis.navigator.languages : [];
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0] ?? '';
    if (supportedLocales.includes(base)) return base;
  }
  return FALLBACK_LOCALE;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: FALLBACK_LOCALE,
  interpolation: { escapeValue: false }, // React already escapes
});

function syncDocumentLanguage(locale: string) {
  if ('document' in globalThis) globalThis.document.documentElement.lang = locale;
}
syncDocumentLanguage(i18n.language);
i18n.on('languageChanged', syncDocumentLanguage);

export { i18n };
