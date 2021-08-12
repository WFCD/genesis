'use strict';

const fs = require('fs');
const path = require('path');
const decache = require('decache');

const Discord = require('discord.js');

const Interaction = require('../models/Interaction');
const WorldStateClient = require('../resources/WorldStateClient');

// eslint-disable-next-line no-unused-vars
const { CommandInteraction, ButtonInteraction } = Discord;
const { Permissions: { FLAGS: Permissions }, Constants: { Events } } = Discord;
const whitelistedGuilds = ['146691885363232769', '563140046031683585'];

const ws = new WorldStateClient(require('../Logger'));

/**
 * Describes a handler
 */
module.exports = class InteractionHandler extends require('../models/BaseEventHandler') {
  static deferred = true;

  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.interactions', Events.INTERACTION_CREATE);
    this.loadedCommands = [];
    this.ready = false;
    this.init();
  }

  static async loadFiles(loadedCommands, logger) {
    const handlersDir = path.join(__dirname, '../interactions');
    let reloadedCommands = loadedCommands || [];

    let files = fs.readdirSync(handlersDir);
    const categories = files.filter?.(f => !f.endsWith('.js'));
    files = files.filter?.(f => f.endsWith('.js'));

    categories.forEach((category) => {
      files = files.concat(fs.readdirSync(path.join(handlersDir, category))
        .map(f => path.join(handlersDir, category, f)));
    });

    if (reloadedCommands.length > 0) {
      files?.forEach(f => decache(f));
    }

    reloadedCommands = files.map((f) => {
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const Handler = require(f);
        return Handler.prototype instanceof Interaction ? Handler : null;
      } catch (e) {
        logger.error(e);
        return null;
      }
    })
      .filter(h => h);

    return reloadedCommands;
  }

  static async deleteExisting(commands) {
    for (const [cmdId] of commands?.cache.entries()) {
      await commands.delete(cmdId);
    }
  }

  static async loadCommands(commands, loadedFiles, logger) {
    const cmds = loadedFiles.map(cmd => cmd.command);
    for (const gid of whitelistedGuilds) {
      try {
        await commands.set(cmds, gid);
      } catch (e) {
        logger.error(e);
      }
    }
  }

  async init() {
    this.commands = this.client.application?.commands;

    this.logger.debug('Initing InteractionHandler');
    this.loadedCommands = await InteractionHandler.loadFiles(
      this.loadedCommands, this.logger,
    );
    // await deleteExisting(this.commands);
    await InteractionHandler.loadCommands(this.commands, this.loadedCommands, this.logger);
    this.ready = true;
  }

  async setupPerms() {
    this.permissions = this.client.application?.permissions;
  }

  /**
   * Handle dat interaction!
   * @param {CommandInteraction|ButtonInteraction} interaction interaction that will be handled
   */
  async execute(interaction) {
    if (!this.ready) return;
    if (!(interaction instanceof CommandInteraction)) return;

    this.logger.debug(`Running ${interaction.id} for ${this.event}`);

    const match = this.loadedCommands.find(c => c.command.name === interaction.commandName);
    const ctx = await this.settings.getCommandContext(interaction.channel, interaction.user);
    ctx.settings = this.settings;
    ctx.ws = ws;
    ctx.handler = this;
    ctx.logger = this.logger;

    const noAccess = (match?.elevated
        && !interaction.member.permissions.has(Permissions.MANAGE_GUILD, false))
      || (match?.ownerOnly && interaction.user.id !== this.bot.owner);

    if (noAccess) {
      await interaction.defer({ ephemeral: true });
      await interaction.deleteReply();
    }

    if (interaction instanceof CommandInteraction) {
      await match?.commandHandler?.(interaction, ctx);
    }
    // if (interaction.isButton()) await match?.buttonHandler?.(interaction);
    // if (interaction.isMessageComponent()) await match?.msgComponentHandler?.(interaction);
    // if (interaction.isSelectMenu()) await match?.selectMenuHandler?.(interaction);
  }
};
