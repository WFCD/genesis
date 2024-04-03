import { should } from 'chai';
import Discord from 'discord.js';

import { cmds } from '../src/resources/index.js';
import InteractionHandler from '../src/eventHandlers/InteractionHandler.js';

// eslint-disable-next-line no-unused-vars
const { ApplicationCommandDataResolvable } = Discord;

should();

/** @type {ApplicationCommandDataResolvable[]} */
const commands = (await InteractionHandler.loadFiles([]))
  .filter((cmd) => cmd.enabled && !cmd.ownerOnly)
  .map((cmd) => {
    return cmd?.command?.name === 'interaction' ? undefined : cmd.command || cmd.commands;
  })
  .flat()
  .filter(Boolean);

// console.error(JSON.stringify(commands, (key, value) => (typeof value === 'bigint' ? value.toString() : value)));

describe('Translations', () => {
  describe('Commands', () => {
    it('should match required pattern for names', () => {
      commands.forEach((cmd) => {
        cmd.name.should.match(
          /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u,
          `Command ${cmd.name} does not match pattern`
        );
        if (cmd.name_localizations) {
          Object.keys(cmd.name_localizations).forEach((locale) => {
            cmd.name_localizations[locale].should.match(
              /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u,
              `Command ${cmd.name} for ${locale} locale does not match pattern`
            );
          });
        }

        cmd.options?.forEach((subCmd) => {
          if (!subCmd.name_localizations) return;
          Object.keys(subCmd.name_localizations).forEach((locale) => {
            subCmd.name_localizations[locale].should.match(
              /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u,
              `SubCommand ${subCmd.name} for ${locale} locale does not match pattern`
            );
            cmd.options.forEach((otherSubCmd) => {
              if (otherSubCmd.name === subCmd.name) return;
              subCmd.name_localizations[locale].should.not.eq(
                otherSubCmd.name_localizations?.[locale],
                `SubCommand ${subCmd.name} should not match ${otherSubCmd.name} for ${locale} `
              );
            });
          });
        });
      });
    });

    it('should match required pattern for descriptions', () => {
      Object.values(cmds).forEach((cmd) => {
        cmd.description.length.should.be.below(
          101,
          `Description for ${cmd.name} should be between 1 and 100 characters in length.`
        );
        Object.keys(cmd.description_localizations).forEach((locale) => {
          cmd.description_localizations[locale].length.should.be.below(
            101,
            `Description for ${cmd.name} ${locale} should be between 1 and 100 characters in length.`
          );
        });
      });
    });
  });
});
