import { expect } from 'chai';

import createI18n from '#shared/utilities/i18n';

type I18nTag = (strings: TemplateStringsArray, ...values: unknown[]) => string;

describe('i18n', () => {
  it('preserves leading :emoji: shortcodes in static template text', () => {
    const i18n = createI18n({ en: {} }, 'en') as unknown as I18nTag;
    const result = i18n`:red_tick: Failed to obtain data, sorry`;
    expect(result).to.equal(':red_tick: Failed to obtain data, sorry');
  });

  it('still strips type suffixes after interpolations', () => {
    const i18n = createI18n({ en: {} }, 'en') as unknown as I18nTag;
    const result = i18n`value is ${20.083}:n(3) units`;
    expect(result).to.equal('value is 20.083 units');
  });
});
