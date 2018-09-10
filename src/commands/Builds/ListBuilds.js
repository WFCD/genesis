'use strict';

const Command = require('../../models/Command.js');
const { createGroupedArray, createPageCollector } = require('../../CommonFunctions.js');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class ListBuilds extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'builds.list', 'list builds', 'Create a temporary room.');
    this.regex = new RegExp(`^(?:${this.call}|lb)\\s?(.+)?`, 'i');

    this.usages = [
      { description: 'Display information on an existing build from Genesis. `|` separates title, body, and image. `;` separates sections in the body.', parameters: ['title | body | image'] },
    ];
  }

  async run(message) {
    const useAll = message.strippedContent.match(this.regex)[1] === 'all' && this.bot.owner === message.author.id;
    const builds = await this.settings.getBuilds(useAll, message.author);
    if (builds.length > 0) {
      const buildGroups = createGroupedArray(builds, 15);
      const tokens = buildGroups.map(buildGroup => ({ name: '\u200B', value: buildGroup.map(build => `\`${build.id} | ${build.title} | Owned by ${typeof build.owner === 'object' ? build.owner.tag : build.owner}\``).join('\n') }));
      const tokenGroups = createGroupedArray(tokens, 5);
      const embeds = [];
      tokenGroups.forEach((tokenGroup) => {
        const fields = tokenGroup;
        fields[0].value = `\`Build ID | Title | Owner\`\n${tokenGroup[0].value}`;
        embeds.push({
          color: 0xcda2a3,
          fields,
        });
      });
      const msg = await this.messageManager.embed(message, embeds[0], true, false);
      await createPageCollector(msg, embeds, message.author);
      return this.messageManager.statuses.SUCCESS;
    }
    await this.messageManager.embed(message, { color: 0xcda2a3, title: 'No builds for user' }, true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = ListBuilds;
