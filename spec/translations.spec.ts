import { expect } from 'chai';

import type { CommandManifestEntry } from '#shared/resources';
import { cmds } from '#shared/resources';

import { groupSubcommandLocaleKeys, loadCommandLocaleModules } from './commandLocales';

const namePattern = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;
const commandLocales = await loadCommandLocaleModules();
const englishLocaleKey = commandLocales['en-US'] ? 'en-US' : Object.keys(commandLocales)[0];
const englishSubcommands = englishLocaleKey ? groupSubcommandLocaleKeys(commandLocales[englishLocaleKey]) : new Map();

describe('Translations', () => {
  describe('Commands', () => {
    it('should match required pattern for names', () => {
      Object.values(cmds).forEach((cmd) => {
        expect(cmd.name).to.match(namePattern, `Command ${cmd.name} does not match pattern`);
        Object.entries(cmd.name_localizations).forEach(([locale, name]) => {
          expect(name).to.match(namePattern, `Command ${cmd.name} for ${locale} locale does not match pattern`);
        });
      });

      Object.entries(commandLocales).forEach(([localeKey, module]) => {
        Object.entries(module).forEach(([key, { name }]) => {
          expect(name).to.match(namePattern, `Locale entry ${key} in ${localeKey} does not match pattern`);
        });
      });

      englishSubcommands.forEach((keys, parent) => {
        if (keys.length < 2) return;

        Object.entries(commandLocales).forEach(([localeKey, module]) => {
          keys.forEach((keyA, indexA) => {
            keys.forEach((keyB, indexB) => {
              if (indexA >= indexB) return;
              const nameA = module[keyA]?.name;
              const nameB = module[keyB]?.name;
              if (!nameA || !nameB) return;

              expect(nameA).to.not.equal(
                nameB,
                `SubCommand ${keyA} should not match ${keyB} for ${localeKey} under ${parent}`
              );
            });
          });
        });
      });
    });

    it('should match required pattern for descriptions', () => {
      Object.values(cmds).forEach((cmd: CommandManifestEntry) => {
        expect(cmd.description.length).to.be.below(
          101,
          `Description for ${cmd.name} should be between 1 and 100 characters in length.`
        );
        Object.keys(cmd.description_localizations).forEach((locale) => {
          expect(cmd.description_localizations[locale].length).to.be.below(
            101,
            `Description for ${cmd.name} ${locale} should be between 1 and 100 characters in length.`
          );
        });
      });
    });
  });
});
