'use strict';

const {
  Constants: {
    ApplicationCommandOptionTypes: Types,
  },
  // eslint-disable-next-line no-unused-vars
  InteractionCollector, ButtonInteraction, MessageEmbed, MessageButton, MessageActionRow,
} = require('discord.js');
const InteractionHandler = require('../../eventHandlers/InteractionHandler');
const logger = require('../../Logger');
const ServerInfoEmbed = require('../../embeds/ServerInfoEmbed');
const { createConfirmationCollector } = require('../../CommonFunctions');

module.exports = class Settings extends require('../../models/Interaction') {
  static elevated = true;
  static ownerOnly = true;
  static command = {
    name: 'su',
    description: 'Super User',
    defaultPermission: false,
    ownerOnly: true,
    options: [{
      name: 'restart',
      description: 'Restart Bot',
      type: Types.SUB_COMMAND,
    }, {
      name: 'reload',
      description: 'Reload Commands',
      type: Types.SUB_COMMAND,
    }, {
      name: 'server',
      description: 'Get server info',
      type: Types.SUB_COMMAND,
      options: [{
        name: 'server_id',
        type: Types.STRING,
        description: 'Guild Id to look up',
        required: true,
      }],
    }, {
      name: 'leave',
      description: 'Force bot to leave specified server',
      type: Types.SUB_COMMAND,
      options: [{
        name: 'server_id',
        type: Types.STRING,
        description: 'Guild Id to leave',
        required: true,
      }],
    }, {
      name: 'stats',
      description: 'Get Stats for a given command across servers',
      type: Types.SUB_COMMAND,
      options: [{
        name: 'command_id',
        type: Types.STRING,
        description: 'Command identifier (derived by command:subcommandgroup:subcommand)',
        required: true,
      }],
    }, {
      name: 'clear',
      description: 'Clear something from a channel',
      type: Types.SUB_COMMAND_GROUP,
      options: [{
        name: 'webhook',
        type: Types.SUB_COMMAND,
        description: 'Clear a webhook in a channel',
        options: [{
          name: 'channel',
          type: Types.STRING,
          description: 'Channel Id for the channel to clear of webhooks',
          required: true,
        }],
      }],
    }],
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
        await interaction.reply({ content: 'ok', ephemeral });
        process.exit(0);
        break;
      case 'reload':
        await interaction.deferReply({ ephemeral });
        commandFiles = await InteractionHandler.loadFiles(ctx.handler.loadedCommands, logger);
        await InteractionHandler
          .loadCommands(interaction.client.application.commands, commandFiles, logger);
        return interaction.editReply('doneski');
      case 'leave':
        id = interaction.options.getString('server_id').trim();
        guild = await interaction.client.guilds.fetch(id);
        if (!guild || !guild.available) {
          return interaction.reply({ content: 'guild not available', ephemeral: true });
        }
        onConfirm = async () => {
          await guild.leave();
          return interaction.editReply('done');
        };
        onDeny = async () => interaction.editReply('ok');
        return createConfirmationCollector(interaction, onConfirm, onDeny, ctx);
      case 'server':
        id = interaction.options.getString('server_id').trim();
        guild = await interaction.client.guilds.fetch(id);
        onConfirm = async () => interaction.editReply({
          content: null,
          embeds: [
            new MessageEmbed(new ServerInfoEmbed(null, guild)),
          ],
          components: [],
        });
        onDeny = async () => interaction.editReply({
          content: 'ok',
          components: [],
        });
        return createConfirmationCollector(interaction, onConfirm, onDeny, ctx);
      case 'stats':
        const commandId = interaction.options.getString('command_id');
        const count = await ctx.settings.getGuildStats(null, commandId, true);
        return interaction.reply({
          content: `\`${commandId}\` has been used ${count} times`,
          ephemeral: ctx.ephemerate,
        });
      case 'webhook':
        const clear = !!interaction.options.getSubcommandGroup(false);
        if (clear && interaction.client.channels.cache.get(interaction.options.getString('channel'))) {
          onConfirm = async () => {
            await ctx.settings.deleteWebhooksForChannel(interaction.options.getString('channel'));
            return interaction.editReply({ content: 'buhleted', components: [], ephemeral: ctx.ephemerate });
          };
          onDeny = async () => interaction.editReply({ content: 'canceled', components: [], ephemeral: ctx.ephemerate });
          return createConfirmationCollector(interaction, onConfirm, onDeny, ctx);
        }
      default:
        break;
    }

    return interaction.reply({ content: 'got it', ephemeral });
  }
};
