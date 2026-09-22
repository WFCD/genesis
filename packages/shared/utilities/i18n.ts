import use from 'i18n-string-templates';

type I18nPairs = Record<string, string>;
type I18nBundle = Record<string, I18nPairs>;
type I18nOptions = {
  warnings?: {
    untranslated: I18nPairs;
  };
};

export type I18nTag = (strings: TemplateStringsArray | string[], ...values: unknown[]) => string;

export default function createI18n(locales: I18nBundle, locale = 'en', options: I18nOptions = {}): I18nTag {
  return use(locales, locale, options) as I18nTag;
}
