import { ApplicationCommandOptionType as Types, ChannelType, PermissionFlagsBits } from 'discord.js';

import BaseEmbed from '#shared/embeds/BaseEmbed';
import { formatFixedWidthTable, games, withEphemeral } from '#shared/utilities/CommonFunctions';
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
      case 'list': {
        const templateIds = await ctx.settings.dynamicVoice.getTemplates([interaction.guild]);
        const templates = templateIds
          .map((templateId) => interaction.guild.channels.cache.get(templateId))
          .filter((channel) => channel?.type === ChannelType.GuildVoice);

        const embed = new BaseEmbed();
        embed.title = ctx.i18n`Voice Templates`;

        if (!templates.length) {
          embed.description = ctx.i18n`No templates configured.`;
          return interaction.reply(withEphemeral(ctx.ephemerate, { embeds: [embed] }));
        }

        const instances = await Promise.all(
          templates.map((template) => ctx.settings.dynamicVoice.getInstances(template))
        );

        embed.description = [
          ctx.i18n`${templates.length} template${templates.length === 1 ? '' : 's'}`,
          formatFixedWidthTable([
            {
              header: 'Template',
              cells: templates.map((template) => template.name),
              maxWidth: 32,
              minWidth: 8,
            },
            {
              header: '# ch',
              cells: instances.map((row) => String(row.instances?.length ?? 0)),
              minWidth: 4,
              align: 'right',
            },
            {
              header: '# Empty',
              cells: instances.map((row) => String(row.remainingEmpty ?? 0)),
              minWidth: 7,
              align: 'right',
            },
          ]),
        ].join('\n');

        return interaction.reply(withEphemeral(ctx.ephemerate, { embeds: [embed] }));
      }
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
