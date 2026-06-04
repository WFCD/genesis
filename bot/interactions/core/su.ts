import { ApplicationCommandOptionType as Types, PermissionFlagsBits } from 'discord.js';

import ServerInfoEmbed from '#shared/embeds/ServerInfoEmbed';
import Collectors from '#shared/utilities/Collectors';
import { withEphemeral } from '#shared/utilities/CommonFunctions';

import Interaction from '../../models/Interaction';
import InteractionHandler from '../../eventHandlers/InteractionHandler';

export default class SuperUser extends Interaction {
  static elevated = true;
  static ownerOnly = true;
  static command = {
    name: 'su',
    description: 'Super User',
    ownerOnly: true,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    options: [
      {
        name: 'restart',
        description: 'Restart Bot',
        type: Types.Subcommand,
      },
      {
        name: 'reload',
        description: 'Reload Commands',
        type: Types.Subcommand,
      },
      {
        name: 'server',
        description: 'Get server info',
        type: Types.Subcommand,
        options: [
          {
            name: 'server_id',
            type: Types.String,
            description: 'Guild Id to look up',
            required: true,
          },
        ],
      },
      {
        name: 'leave',
        description: 'Force bot to leave specified server',
        type: Types.Subcommand,
        options: [
          {
            name: 'server_id',
            type: Types.String,
            description: 'Guild Id to leave',
            required: true,
          },
        ],
      },
      {
        name: 'stats',
        description: 'Get Stats for a given command across servers',
        type: Types.Subcommand,
        options: [
          {
            name: 'command_id',
            type: Types.String,
            description: 'Command identifier (derived by command:subcommandgroup:subcommand)',
            required: true,
          },
        ],
      },
      {
        name: 'clear',
        description: 'Clear something from a channel',
        type: Types.SubcommandGroup,
        options: [
          {
            name: 'webhook',
            type: Types.Subcommand,
            description: 'Clear a webhook in a channel',
            options: [
              {
                name: 'channel',
                type: Types.String,
                description: 'Channel Id for the channel to clear of webhooks',
                required: true,
              },
            ],
          },
        ],
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const command = interaction.options.getSubcommand();
    const ephemeral = true;
    let commandFiles;

    let id;
    let guild;
    let onConfirm;
    let onDeny;
    switch (command) {
      case 'restart':
        await interaction.reply(withEphemeral(ephemeral, { content: 'ok' }));
        process.exit(0);
        break;
      case 'reload':
        await interaction.deferReply(withEphemeral(ephemeral));
        commandFiles = await InteractionHandler.loadFiles(ctx.handler.loadedCommands);
        await InteractionHandler.loadCommands(interaction.client.application.commands, commandFiles);
        return interaction.editReply('doneski');
      case 'leave':
        id = interaction.options.getString('server_id').trim();
        guild = await interaction.client.guilds.fetch(id);
        if (!guild || !guild.available) {
          return interaction.reply(withEphemeral(true, { content: 'guild not available' }));
        }
        onConfirm = async () => {
          await guild.leave();
          return interaction.editReply('done');
        };
        onDeny = async () => interaction.editReply('ok');
        return Collectors.confirmation(interaction, onConfirm, onDeny, ctx);
      case 'server':
        id = interaction.options.getString('server_id').trim();
        guild = await interaction.client.guilds.fetch(id);
        onConfirm = async () =>
          interaction.editReply({
            content: undefined,
            embeds: [new ServerInfoEmbed(guild)],
            components: [],
          });
        onDeny = async () =>
          interaction.editReply({
            content: 'ok',
            components: [],
          });
        return Collectors.confirmation(interaction, onConfirm, onDeny, ctx);
      case 'stats':
        const commandId = interaction.options.getString('command_id');
        const count = await ctx.settings.statistics.getGuildStats(undefined, commandId, true);
        return interaction.reply(
          withEphemeral(ctx.ephemerate, { content: `\`${commandId}\` has been used ${count} times` })
        );
      case 'webhook':
        const clear = !!interaction.options.getSubcommandGroup(false);
        if (clear && interaction.client.channels.cache.get(interaction.options.getString('channel'))) {
          onConfirm = async () => {
            await ctx.settings.channels.deleteWebhooksForChannel(interaction.options.getString('channel'));
            return interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'buhleted', components: [] }));
          };
          onDeny = async () =>
            interaction.editReply(withEphemeral(ctx.ephemerate, { content: 'canceled', components: [] }));
          return Collectors.confirmation(interaction, onConfirm, onDeny, ctx);
        }
      default:
        break;
    }

    return interaction.reply(withEphemeral(ephemeral, { content: 'got it' }));
  }
}
