import { ApplicationCommandOptionType, ChannelType, PermissionsBitField } from 'discord.js';

import BaseEmbed from '../../embeds/BaseEmbed.js';
import { games } from '../../utilities/CommonFunctions.js';
import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';

const tc = {
  ...cmds['templates.tc'],
  type: ApplicationCommandOptionType.Channel,
  required: true,
};

export default class Templates extends Interaction {
  static enabled = games.includes('ROOMS');
  static command = {
    ...cmds.templates,
    defaultMemberPermissions: PermissionsBitField.Flags.ManageGuild,
    options: [
      {
        ...cmds['templates.add'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [tc],
      },
      {
        ...cmds['templates.delete'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [tc],
      },
      {
        ...cmds['templates.list'],
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        ...cmds['templates.set'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          tc,
          {
            ...cmds['templates.fmt'],
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        ...cmds['templates.clear'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [tc],
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction?.options?.getChannel?.('template_channel');
    const template = interaction?.options?.getString('template');

    if (channel && channel.type !== ChannelType.GuildVoice) {
      return interaction.reply({ content: ctx.i18n`Template must be a voice channel`, flags: ctx.flags });
    }

    switch (subcommand) {
      case 'add':
        if (await ctx.settings.isTemplate(channel)) {
          return interaction.reply({ content: ctx.i18n`That is already a template`, flags: ctx.flags });
        }
        await ctx.settings.addTemplate(channel, false);
        return interaction.reply({ content: ctx.i18n`${channel} added as a template.`, flags: ctx.flags });
      case 'delete':
        if (!(await ctx.settings.isTemplate(channel))) {
          return interaction.reply({ content: ctx.i18n`That is not a template`, flags: ctx.flags });
        }
        await ctx.settings.deleteTemplate(channel);
        return interaction.reply({ content: ctx.i18n`${channel} removed as a template.`, flags: ctx.flags });
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
        const longestName = templates.length
          ? templates.map((t) => t.name).reduce((a, b) => (a.length > b.length ? a : b))
          : '';
        embed.description = `\`${'Template'.padEnd(longestName.length, '\u2003')} | ${'# ch'.padStart(
          5,
          '\u2003'
        )} | # Empty\`\n`;
        embed.description += (
          await Promise.all(
            templates.map(async (t) => {
              const instancesRes = await ctx.settings.getInstances(t);
              return `\`${t.name.padEnd(longestName.length, '\u2003')} | ${String(
                instancesRes.instances.length
              ).padStart(5, '\u2003')} | ${String(instancesRes.remainingEmpty).padStart(7, '\u2003')}\``;
            })
          )
        ).join('\n');
        return interaction.reply({ embeds: [embed], flags: ctx.flags });
      case 'clear':
        if (!(await ctx.settings.isTemplate(channel))) {
          return interaction.reply({ content: ctx.i18n`That is not a template`, flags: ctx.flags });
        }
        await ctx.settings.setDynTemplate(channel.id, undefined);
        return interaction.reply({ content: ctx.i18n`${channel}'s name template cleared.`, flags: ctx.flags });
      case 'set':
        if (!(await ctx.settings.isTemplate(channel))) {
          return interaction.reply({ content: ctx.i18n`That is not a template`, flags: ctx.flags });
        }
        await ctx.settings.setDynTemplate(channel.id, template);
        return interaction.reply({
          content: ctx.i18n`\`${template}\` set as ${channel}'s name template.`,
          ephemeral: ctx.ephemerate,
        });
      default:
        break;
    }
    return interaction.reply(ctx.i18n`hmmm, something went wrong...`);
  }
}
