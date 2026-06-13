import { ApplicationCommandOptionType as Types, PermissionFlagsBits } from 'discord.js';

import ServerInfoEmbed from '#shared/embeds/ServerInfoEmbed';
import Collectors from '#shared/utilities/Collectors';
import { withEphemeral } from '#shared/utilities/CommonFunctions';

import Interaction from '../../models/Interaction';

import SuServerUI from './SuServerUI';

export default class SuperUser extends Interaction {
  static elevated = true;
  static ownerOnly = true;
  static command = {
    name: 'su',
    description: 'Super User',
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
        name: 'refresh',
        description: 'Refresh worker cache globally or for one guild',
        type: Types.Subcommand,
        options: [
          {
            name: 'scope',
            type: Types.String,
            description: 'Which worker cache scope to refresh',
            required: true,
            choices: [
              { name: 'pings', value: 'pings' },
              { name: 'trackables', value: 'trackables' },
              { name: 'guild', value: 'guild' },
              { name: 'all', value: 'all' },
            ],
          },
          {
            name: 'guild_id',
            type: Types.String,
            description: 'Guild Id for a targeted refresh instead of a global stamp bump',
            required: false,
          },
        ],
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
        await ctx.handler.reloadCommands();
        return interaction.editReply('doneski');
      case 'refresh': {
        const scope = interaction.options.getString('scope');
        const guildId = interaction.options.getString('guild_id')?.trim();
        if (guildId) {
          await ctx.settings.workerCache.enqueueGuildRefresh(guildId, scope);
          return interaction.reply(
            withEphemeral(ephemeral, {
              content: `Queued \`${scope}\` worker cache refresh for guild \`${guildId}\`. Workers pick up within ~1 minute.`,
            })
          );
        }
        await ctx.settings.workerCache.bumpRefreshStamp(scope);
        return interaction.reply(
          withEphemeral(ephemeral, {
            content: `Bumped global \`${scope}\` worker cache refresh. Workers pick up within ~1 minute.`,
          })
        );
      }
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
        try {
          guild = await interaction.client.guilds.fetch(id);
        } catch {
          return interaction.reply(withEphemeral(ephemeral, { content: 'Guild not found or unavailable.' }));
        }
        onConfirm = async () => {
          SuServerUI.rememberServerLookup(interaction, guild.id);
          return interaction.editReply(
            withEphemeral(ephemeral, {
              content: undefined,
              embeds: [new ServerInfoEmbed(guild)],
              components: SuServerUI.serverComponents(interaction.id),
            })
          );
        };
        onDeny = async () => interaction.editReply(withEphemeral(ephemeral, { content: 'ok', components: [] }));
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
