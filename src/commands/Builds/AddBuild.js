'use strict';

const Command = require('../../models/Command.js');
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
    super(bot, 'builds.add', 'add build', 'Create a temporary room.');
    this.regex = new RegExp(`^(?:${this.call}|ab)\\s?(.+)?`, 'i');

    this.usages = [
      { description: 'Display instructions for creating a new build with Genesis', parameters: [] },
    ];

    this.allowDM = false;
  }

  async run(message) {
    const matches = message.strippedContent.match(this.regex)[1];
    const params = (matches || '').split('|');
    if (params.length < 1) {
      // let them know there's not enough params
      return this.messageManager.statuses.FAILURE;
    }
    // save params based on order
    const title = params[0] || 'My Build';
    const body = params[1] || 'My Build Body';
    const image = params[2] || 'https://i.imgur.com/31xCos6.png';
    const build = await this.settings.addNewBuild(title, body, image, message.author);
    const embed = new BuildEmbed(this.bot, build);
    this.messageManager.embed(message, embed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = AddBuild;
