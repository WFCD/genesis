'use strict';

const Command = require('../../Command.js');
const BuildEmbed = require('../../embeds/BuildEmbed');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class AddBuild extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'builds.set', 'set build', 'Create a temporary room.');
    this.regex = new RegExp(`^${this.call}(?:\\s?(all|title|body|image)\\s?(.+))?`, 'i');

    this.usages = [
      { description: 'Display instructions for creating a new build with Genesis', parameters: [] },
    ];

    this.allowDM = false;
  }

  async run(message) {
    const type = message.strippedContent.match(this.regex)[1];
    const params = (message.strippedContent.match(this.regex)[2] || '').split('|');
    if (!type) {
      // let them know there's not enough params
      return this.messageManager.statuses.FAILURE;
    }
    if (type === 'all') {
      const buildId = params[0];
      const build = await this.bot.settings.getBuild(buildId);
      const title = params[1] || 'My Build';
      const body = params[2] || 'My Build Body';
      const image = params[3] || 'https://i.imgur.com/31xCos6.png';
      if (build && build.owner_id === message.owner.id) {
        const status = await this.settings.setBuildFileds(buildId, { title, body, image });
        if (status) {
          this.messageManager.embed(message, new BuildEmbed(this.bot,
            await this.settings.getBuild(buildId)), true, true);
          return this.messageManager.statuses.SUCCESS;
        }
        this.messageManager.embed(message, { title: `You couldn't edit build ${buildId}.`, color: 0x83181b }, true, true);
        return this.messageManager.statuses.FAILURE;
      }
      this.messageManager.embed(message, { title: `You couldn't edit build ${buildId}.`, color: 0x83181b }, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    // save params based on order
    const title = params[0] || 'My Build';
    const body = params[1] || 'My Build Body';
    const image = params[2] || 'https://i.imgur.com/31xCos6.png';
    const build = await this.bot.settings.addNewBuild(title, body, image, message.author);
    const embed = new BuildEmbed(this.bot, build);
    this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = AddBuild;
