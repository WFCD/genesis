'use strict';

const { Constants: { ApplicationCommandOptionTypes: Types } } = require('discord.js');
const InteractionHandler = require('../../eventHandlers/InteractionHandler');
const logger = require('../../Logger');

module.exports = class Settings extends require('../../models/Interaction') {
  static elevated = true;
  static ownerOnly = true;
  static command = {
    name: 'su',
    description: 'Super User',
    options: [{
      name: 'restart',
      description: 'Restart Bot',
      type: Types.SUB_COMMAND,
    }, {
      name: 'reload',
      description: 'Reload Commands',
      type: Types.SUB_COMMAND,
    }],
  };

  static async commandHandler(interaction, ctx) {
    const command = interaction.options?.first?.()?.name;
    const ephemeral = true;
    let commands;
    let commandFiles;

    switch (command) {
      case 'restart':
        await interaction.reply({ content: 'ok', ephemeral });
        process.exit(0);
        break;
      case 'reload':
        await interaction.deferReply({ ephemeral });
        ({ commands } = interaction.client.application);
        commandFiles = await InteractionHandler.loadFiles(ctx.handler.loadedCommands, logger);
        await InteractionHandler.loadCommands(commands, commandFiles, logger);
        return interaction.editReply('doneski');
      case 'leave':
        logger.info(command);
        break;
      default:
        break;
    }

    await interaction.deferReply({ ephemeral });
    return interaction.editReply({ content: 'got it', ephemeral });
  }
};
