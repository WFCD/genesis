import { ApplicationCommandOptionType as Types, ChannelType, PermissionFlagsBits } from 'discord.js';

import BaseEmbed from '#shared/embeds/BaseEmbed';
import { games, withEphemeral } from '#shared/utilities/CommonFunctions';
import { cmds } from '#shared/resources/index';

import Interaction from '../../models/Interaction';

const tc = {
  ...cmds['templates.tc'],
  type: Types.Channel,
  required: true,
};

export default class Templates extends Interaction {
  static enabled = games.includes('ROOMS');
  static command = {
    ...cmds.templates,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    options: [
      {
        ...cmds['templates.add'],
        type: Types.Subcommand,
        options: [tc],
      },
      {
        ...cmds['templates.delete'],
        type: Types.Subcommand,
        options: [tc],
      },
      {
        ...cmds['templates.list'],
        type: Types.Subcommand,
      },
      {
        ...cmds['templates.set'],
        type: Types.Subcommand,
        options: [
          tc,
          {
            ...cmds['templates.fmt'],
            type: Types.String,
            required: true,
          },
        ],
      },
      {
        ...cmds['templates.clear'],
        type: Types.Subcommand,
        options: [tc],
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction?.options?.getChannel?.('template_channel');
    const template = interaction?.options?.getString('template');

    if (channel && channel.type !== ChannelType.GuildVoice) {
      return interaction.reply(withEphemeral(ctx.ephemerate, { content: ctx.i18n`Template must be a voice channel` }));
    }

    switch (subcommand) {
      case 'add':
        if (await ctx.settings.dynamicVoice.isTemplate(channel)) {
          return interaction.reply(withEphemeral(ctx.ephemerate, { content: ctx.i18n`That is already a template` }));
        }
        await ctx.settings.dynamicVoice.addTemplate(channel, false);
        return interaction.reply(withEphemeral(ctx.ephemerate, { content: ctx.i18n`${channel} added as a template.` }));
      case 'delete':
        if (!(await ctx.settings.dynamicVoice.isTemplate(channel))) {
          return interaction.reply(withEphemeral(ctx.ephemerate, { content: ctx.i18n`That is not a template` }));
        }
        await ctx.settings.dynamicVoice.deleteTemplate(channel);
        return interaction.reply(
          withEphemeral(ctx.ephemerate, { content: ctx.i18n`${channel} removed as a template.` })
        );
      case 'list':
        const templateIds = await ctx.settings.dynamicVoice.getTemplates([interaction.guild]);
        const templates = [];
        templateIds.forEach((templateId) => {
          if (interaction.guild.channels.cache.has(templateId)) {
            templates.push(interaction.guild.channels.cache.get(templateId));
          }
        });
        const embed = new BaseEmbed();
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
              const instancesRes = await ctx.settings.dynamicVoice.getInstances(t);
              return `\`${t.name.padEnd(longestName.length, '\u2003')} | ${String(
                instancesRes.instances.length
              ).padStart(5, '\u2003')} | ${String(instancesRes.remainingEmpty).padStart(7, '\u2003')}\``;
            })
          )
        ).join('\n');
        return interaction.reply(withEphemeral(ctx.ephemerate, { embeds: [embed] }));
      case 'clear':
        if (!(await ctx.settings.dynamicVoice.isTemplate(channel))) {
          return interaction.reply(withEphemeral(ctx.ephemerate, { content: ctx.i18n`That is not a template` }));
        }
        await ctx.settings.dynamicVoice.setDynTemplate(channel.id, undefined);
        return interaction.reply(
          withEphemeral(ctx.ephemerate, { content: ctx.i18n`${channel}'s name template cleared.` })
        );
      case 'set':
        if (!(await ctx.settings.dynamicVoice.isTemplate(channel))) {
          return interaction.reply(withEphemeral(ctx.ephemerate, { content: ctx.i18n`That is not a template` }));
        }
        await ctx.settings.dynamicVoice.setDynTemplate(channel.id, template);
        return interaction.reply(
          withEphemeral(ctx.ephemerate, { content: ctx.i18n`\`${template}\` set as ${channel}'s name template.` })
        );
      default:
        break;
    }
    return interaction.reply(ctx.i18n`hmmm, something went wrong...`);
  }
}
