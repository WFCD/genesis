'use strict';

const Command = require('../../Command.js');
const BuildEmbed = require('../../embeds/BuildEmbed');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class GetBuild extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'builds.get', 'get build', 'Create a temporary room.');
    this.regex = new RegExp(`^(?:${this.call}|gb)\\s?(.+)?`, 'i');

    this.usages = [
      { description: 'Display information on an existing build from Genesis', parameters: [] },
    ];
  }

  async run(message) {
    const buildId = message.strippedContent.match(this.regex)[1];
    if (buildId.length < 1) {
      // let them know it's not a valid build id
      return this.messageManager.statuses.FAILURE;
    }
    const build = await this.bot.settings.getBuild(buildId);
    const embed = new BuildEmbed(this.bot, build);
    this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = GetBuild;
