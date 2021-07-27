'use strict';

const fs = require('fs');
const path = require('path');
const decache = require('decache');

const Permissions = require('discord.js').Permissions.FLAGS;

const Handler = require('../models/BaseEventHandler');
const Ping = require('../interactions/Ping');
const Interaction = require('../models/Interaction');
const WorldStateClient = require('../resources/WorldStateClient');

const whitelistedGuilds = ['146691885363232769', '563140046031683585'];

const ws = new WorldStateClient(require('../Logger'));

const loadFiles = async (loadedCommands, logger) => {
  const handlersDir = path.join(__dirname, '../interactions');
  const files = fs.readdirSync(handlersDir).filter(f => f.indexOf('.js') > -1);
  let reloadedCommands = loadedCommands || [];
  
  if (reloadedCommands.length > 0) {
    files?.forEach(f => decache(path.join(handlersDir, f)));
  }
  
  reloadedCommands = files.map(f => {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const Handler = require(path.join(handlersDir, f));
      return Handler.prototype instanceof Interaction ? Handler : null;
    } catch (e) {
      this.logger.error(e);
    }
  })
  .filter(h => h);
  
  return reloadedCommands;
}

const deleteExisting = async (commands) => {
  for (const [cmdId] of this.commands?.cache.entries()) {
    await this.commands.delete(cmdId)
  }
}

const loadCommands = async (commands, loadedFiles, logger) => {
  for (const gid of whitelistedGuilds) {
    try {
      await commands.set(loadedFiles.map(cmd => cmd.command), gid);
      logger.info(`Loaded ${commands.cache.size} interactions`);
    } catch (e) {
      logger.error(e);
    }
  }
}

/**
 * Describes a handler
 */
module.exports = class InteractionHandler extends Handler {
  static deferred = true;
  
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.interactions', 'interaction');
    this.loadedCommands = [];
    this.ready = false;
    this.init();
  }
  
  async init() {
    this.commands = this.client.application?.commands;

    this.logger.debug('Initing InteractionHandler');
    this.loadedCommands = await loadFiles(this.loadedCommands, this.logger);
    // await deleteExisting(this.commands);
    await loadCommands(this.commands, this.loadedCommands, this.logger);
    this.ready = true;
  }

  /**
   * Handle dat interaction!
   * @param {Discord.Interaction} interaction interaction that will be handled
   */
  async execute(interaction) {
    if(!this.ready) return;
    this.logger.debug(`Running ${interaction.id} for ${this.event}`);

    const match = this.loadedCommands.find(c => c.command.name === interaction.commandName);
    const ctx = await this.settings.getCommandContext(interaction.channel, interaction.user);
    ctx.settings = this.settings;
    ctx.ws = ws;

    if (match?.elevated && !interaction.member.permissions.has(Permissions.MANAGE_GUILD, false)) {
      await interaction.defer({ ephemeral: true })
      await interaction.deleteReply();
    }
    if (interaction.isCommand()) await match?.commandHandler?.(interaction, ctx);
    // if (interaction.isButton()) await match?.buttonHandler?.(interaction);
    // if (interaction.isMessageComponent()) await match?.msgComponentHandler?.(interaction);
    // if (interaction.isSelectMenu()) await match?.selectMenuHandler?.(interaction);
  }
};
