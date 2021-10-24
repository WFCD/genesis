'use strict';

const Command = require('../../models/Command.js');
const BaseEmbed = require('../../embeds/BaseEmbed');

class AddTemplateChannel extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'dynamicchannels.list', 'templates list', 'List Template Channels', 'UTIL');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    const templateIds = await ctx.settings.getTemplates([message.guild]);
    const templates = [];
    templateIds.forEach((templateId) => {
      if (message.guild.channels.cache.has(templateId)) {
        templates.push(message.guild.channels.cache.get(templateId));
      }
    });
    const embed = new BaseEmbed(this.bot);
    const longestName = templates.length ? templates.map(template => template.name).reduce((a, b) => (a.length > b.length ? a : b)) : '';
    embed.description = `\`${'Template'.padEnd(longestName.length, '\u2003')} | ${'# ch'.padStart(5, '\u2003')} | # Empty\`\n`;
    embed.description += (await Promise.all(templates.map(async (template) => {
      const instancesRes = await ctx.settings.getInstances(template);
      return `\`${template.name.padEnd(longestName.length, '\u2003')} | ${String(instancesRes.instances.length).padStart(5, '\u2003')} | ${String(instancesRes.remainingEmpty).padStart(7, '\u2003')}\``;
    }))).join('\n');
    await message.reply({
      embeds: [embed],
    });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = AddTemplateChannel;
