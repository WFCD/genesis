'use strict';

const Command = require('../../Command.js');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class DeleteBuild extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'builds.delete', 'delete build', 'Create a temporary room.');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');

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
    const owner = typeof build.owner === 'object' ? build.owner.id : build.owner;
    if (owner === message.author.id || owner === this.bot.owner) {
      this.logger.debug('owner matched author');
      await this.bot.settings.deleteBuild(buildId);
      this.messageManager.embed(message, { title: `Build ${buildId} deleted.`, color: 0xcda2a3 }, true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    this.messageManager.embed(message, { title: `You couldn't delete build ${buildId}.`, color: 0x83181b }, true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = DeleteBuild;
