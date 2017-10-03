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
    const buildId = params[0];
    const build = await this.bot.settings.getBuild(buildId);
    let title;
    let body;
    let image;
    if (build && build.owner_id === message.owner.id) {
      if (type === 'all') {
        title = params[1];
        body = params[2];
        image = params[3];
      } else if (type === 'title') {
        title = params[1];
      } else if (type === 'body') {
        body = params[1];
      } else if (type === 'image') {
        image = params[1];
      } else {
        return this.failure(message, buildId);
      }
    } else {
      return this.failure(message, buildId);
    }

    // save params based on order
    const status = await this.settings.setBuildFileds(buildId, { title, body, image });
    if (status) {
      this.messageManager.embed(message, new BuildEmbed(this.bot,
        await this.settings.getBuild(buildId)), true, true);
      return this.messageManager.statuses.SUCCESS;
    }
    return this.failure(message, buildId);
  }

  async failure(message, buildId) {
    this.messageManager.embed(message, { title: `You couldn't edit build ${buildId}.`, color: 0x83181b }, true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = AddBuild;
