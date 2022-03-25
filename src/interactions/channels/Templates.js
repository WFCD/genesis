import Discord from 'discord.js';
import BaseEmbed from '../../embeds/BaseEmbed.js';
import { games } from '../../utilities/CommonFunctions.js';
import Interaction from '../../models/Interaction.js';

const { Constants: { ApplicationCommandOptionTypes: Types } } = Discord;

const tc = {
  name: 'template_channel',
  type: Types.CHANNEL,
  description: 'Channel to use as a template (should be a voice channel)',
  required: true,
};

export default class Templates extends Interaction {
  static elevated = true;
  static enabled = games.includes('ROOMS');
  static command = {
    name: 'templates',
    description: 'Manage channel templates',
    // defaultPermission: false,
    options: [{
      name: 'add',
      type: Types.SUB_COMMAND,
      description: 'Add a channel as a template channel.',
      options: [tc],
    }, {
      name: 'delete',
      type: Types.SUB_COMMAND,
      description: 'Delete a channel from you template channels',
      options: [tc],
    }, {
      name: 'list',
      type: Types.SUB_COMMAND,
      description: 'List all configured templates',
    }, {
      name: 'set',
      type: Types.SUB_COMMAND,
      description: 'Set the template for a template channel',
      options: [tc, {
        name: 'template',
        type: Types.STRING,
        description: 'Template string. Supports replacing $username with originator\'s username',
        required: true,
      }],
    }, {
      name: 'clear',
      type: Types.SUB_COMMAND,
      description: 'clear existing template pattern on a channel',
      options: [tc],
    }],
  };

  static async commandHandler(interaction, ctx) {
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction?.options?.getChannel?.('template_channel');
    const template = interaction?.options?.getString('template');

    if (channel && channel.type !== 'GUILD_VOICE') {
      return interaction.reply({ content: ctx.i18n`Template must be a voice channel`, ephemeral: ctx.ephemerate });
    }

    switch (subcommand) {
      case 'add':
        if (await ctx.settings.isTemplate(channel)) {
          return interaction.reply({ content: ctx.i18n`That is already a template`, ephemeral: ctx.ephemerate });
        }
        await ctx.settings.addTemplate(channel, false);
        return interaction.reply({ content: ctx.i18n`${channel} added as a template.`, ephemeral: ctx.ephemerate });
      case 'delete':
        if (!(await ctx.settings.isTemplate(channel))) {
          return interaction.reply({ content: ctx.i18n`That is not a template`, ephemeral: ctx.ephemerate });
        }
        await ctx.settings.deleteTemplate(channel);
        return interaction.reply({ content: ctx.i18n`${channel} removed as a template.`, ephemeral: ctx.ephemerate });
      case 'list':
        /* eslint-disable no-case-declarations */
        const templateIds = await ctx.settings.getTemplates([interaction.guild]);
        const templates = [];
        templateIds.forEach((templateId) => {
          if (interaction.guild.channels.cache.has(templateId)) {
            templates.push(interaction.guild.channels.cache.get(templateId));
          }
        });
        const embed = new BaseEmbed(this.bot);
        const longestName = templates.length ? templates.map(t => t.name).reduce((a, b) => (a.length > b.length ? a : b)) : '';
        embed.description = `\`${'Template'.padEnd(longestName.length, '\u2003')} | ${'# ch'.padStart(5, '\u2003')} | # Empty\`\n`;
        embed.description += (await Promise.all(templates.map(async (t) => {
          const instancesRes = await ctx.settings.getInstances(t);
          return `\`${t.name.padEnd(longestName.length, '\u2003')} | ${String(instancesRes.instances.length).padStart(5, '\u2003')} | ${String(instancesRes.remainingEmpty).padStart(7, '\u2003')}\``;
        }))).join('\n');
        return interaction.reply({ embeds: [embed], ephemeral: ctx.ephemerate });
      case 'clear':
        if (!(await ctx.settings.isTemplate(channel))) {
          return interaction.reply({ content: ctx.i18n`That is not a template`, ephemeral: ctx.ephemerate });
        }
        await ctx.settings.setDynTemplate(channel.id, undefined);
        return interaction.reply({ content: ctx.i18n`${channel}'s name template cleared.`, ephemeral: ctx.ephemerate });
      case 'set':
        if (!(await ctx.settings.isTemplate(channel))) {
          return interaction.reply({ content: ctx.i18n`That is not a template`, ephemeral: ctx.ephemerate });
        }
        await ctx.settings.setDynTemplate(channel.id, template);
        return interaction.reply({ content: ctx.i18n`\`${template}\` set as ${channel}'s name template.`, ephemeral: ctx.ephemerate });
      default:
        break;
    }
    return interaction.reply(ctx.i18n`hmmm, something went wrong...`);
  }
}
