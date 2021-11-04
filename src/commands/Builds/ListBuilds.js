'use strict';

const Command = require('../../models/Command.js');
const { createGroupedArray, setupPages } = require('../../CommonFunctions.js');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class ListBuilds extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'builds.list', 'list builds', 'List current builds for requesting user.', 'UTIL');
    this.regex = new RegExp(`^(?:${this.call}|lb)`, 'i');
  }

  async run(message, ctx) {
    const useAll = message.strippedContent.match(this.regex)[1] === 'all' && this.bot.owner === message.author.id;
    const builds = await this.settings.getBuilds(useAll, message.author);
    if (builds.length > 0) {
      const buildGroups = createGroupedArray(builds, 10);
      const titleLen = (builds.length ? builds.map(result => result.title.trim())
        .reduce((a, b) => (a.length > b.length ? a : b)) : '').length;

      const tokens = buildGroups.map(buildGroup => ({
        name: '\u200B',
        value: buildGroup.map(build => `\`${build.id} | ${build.title.padEnd(titleLen, '\u2003')} | Added by ${typeof build.owner === 'object' ? build.owner.tag : build.owner}\``).join('\n'),
      }));

      const tokenGroups = createGroupedArray(tokens, 5);
      const embeds = [];
      tokenGroups.forEach((tokenGroup) => {
        const fields = tokenGroup;
        fields[0].value = `\`${ctx.i18n`Build ID`} | ${ctx.i18n`Title`.padEnd(titleLen, '\u2003')} | ${ctx.i18n`Owner`}\`\n${tokenGroup[0].value}`;
        embeds.push({
          color: 0xcda2a3,
          fields,
        });
      });
      await setupPages(embeds, { message, settings: this.settings, mm: this.messageManager });
      return this.constructor.statuses.SUCCESS;
    }
    await message.reply({ embeds: [{ color: 0xcda2a3, title: ctx.i18n`No builds for user` }] });
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = ListBuilds;
