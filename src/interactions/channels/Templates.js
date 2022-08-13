import Discord, { Permissions } from 'discord.js';
import BaseEmbed from '../../embeds/BaseEmbed.js';
import { games } from '../../utilities/CommonFunctions.js';
import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';

const {
  Constants: { ApplicationCommandOptionTypes: Types },
} = Discord;

const tc = {
  ...cmds['templates.tc'],
  type: Types.CHANNEL,
  required: true,
};

export default class Templates extends Interaction {
  static enabled = games.includes('ROOMS');
  static command = {
    ...cmds.templates,
    defaultMemberPermissions: Permissions.FLAGS.MANAGE_GUILD,
    options: [
      {
        ...cmds['templates.add'],
        type: Types.SUB_COMMAND,
        options: [tc],
      },
      {
        ...cmds['templates.delete'],
        type: Types.SUB_COMMAND,
        options: [tc],
      },
      {
        ...cmds['templates.list'],
        type: Types.SUB_COMMAND,
      },
      {
        ...cmds['templates.set'],
        type: Types.SUB_COMMAND,
        options: [
          tc,
          {
            ...cmds['templates.fmt'],
            type: Types.STRING,
            required: true,
          },
        ],
      },
      {
        ...cmds['templates.clear'],
        type: Types.SUB_COMMAND,
        options: [tc],
      },
    ],
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
