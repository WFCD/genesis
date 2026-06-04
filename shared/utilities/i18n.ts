import use from 'i18n-string-templates';

type I18nPairs = Record<string, string>;
type I18nBundle = Record<string, I18nPairs>;
type I18nOptions = {
  warnings?: {
    untranslated: I18nPairs;
  };
};

export default function createI18n(locales: I18nBundle, locale = 'en', options: I18nOptions = {}) {
  return use(locales, locale, options);
}
