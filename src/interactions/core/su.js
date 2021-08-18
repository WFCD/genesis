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
      default:
        break;
    }

    return interaction.reply({ content: 'got it', ephemeral });
  }
};
