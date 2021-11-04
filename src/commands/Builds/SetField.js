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
    super(bot, 'builds.set', 'set build', 'Create a temporary room.', 'UTIL');
    this.regex = new RegExp(`^${this.call}(?:\\s+(all|title|body|image)\\s+(.+))?`, 'i');

    this.usages = [
      {
        description: 'Edit a field on the build. `|` is only between build Id and following parameters.',
        parameters: ['type (all, title, body, image)', 'buildId', 'title\\*', 'body\\*', 'image\\*'],
        separator: ' | ',
      },
    ];

    this.allowDM = false;
  }

  async run(message, ctx) {
    const type = message.strippedContent.match(this.regex)[1];
    const params = (message.strippedContent.match(this.regex)[2] || '').split('|');
    if (!type) {
      // let them know there's not enough params
      return this.constructor.statuses.FAILURE;
    }
    const buildId = (params[0] || '').trim();
    const build = await this.settings.getBuild(buildId);
    let title;
    let body;
    let image;
    if (build && (build.ownerId === message.author.id || message.author.id === this.bot.owner)) {
      if (type === 'all') {
        [, title, body, image] = params;
      } else if (type === 'title') {
        [, title] = params;
      } else if (type === 'body') {
        [, body] = params;
      } else if (type === 'image') {
        [, image] = params;
      } else {
        return this.failure(message, buildId, ctx);
      }
    } else {
      return this.failure(message, buildId, ctx);
    }

    // save params based on order
    const status = await this.settings.setBuildFields(buildId, { title, body, image });
    if (status) {
      await message.reply({
        embeds: [new BuildEmbed(
          this.bot,
          await this.settings.getBuild(buildId),
        )],
      });
      return this.constructor.statuses.SUCCESS;
    }
    return this.failure(message, buildId);
  }

  async failure(message, buildId, ctx) {
    await message.reply({ embeds: [{ title: ctx.i18n`You couldn't edit build ${buildId}`, color: 0x83181b }] });
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = AddBuild;
