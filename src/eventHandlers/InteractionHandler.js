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
const whitelistedGuilds = (process.env.WHITELISTED_GUILDS || '').split(',');

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

  /**
   * Set the perms for a single guild
   * @param {Discord.Guild} guild guild to set perms for
   * @param {string?} rolesOverride override instead of fetching guild setting
   * @returns {Promise<void>}
   */
  async #setGuildPerms (guild, rolesOverride) {
    const guildCommands = Array.from((await guild.commands.fetch())
      .filter(c => !c.defaultPermission)
      .values());
    const owner = guild.ownerId;
    const roles = (rolesOverride || (await this.settings.getGuildSetting(guild, 'elevatedRoles')) || '')
      .split(',')
      .filter(s => s.length);
    /** @type SetApplicationCommandPermissionsOptions */
    const data = {
      /** @type Array<Discord.GuildApplicationCommandPermissionData> */
      fullPermissions: [],
    };
    await this.client.application.fetch();
    guildCommands.filter(c => c.name !== 'su').forEach((command) => {
      data.fullPermissions.push({
        id: command.id,
        permissions: [{
          id: guild.roles.everyone.id,
          type: 'ROLE',
          permission: false,
        }, {
          id: owner,
          type: 'USER',
          permission: true,
        },
        ...(roles?.length
          ? roles.map(id => ({
            id,
            type: 'ROLE',
            permission: true,
          }))
          : []
        )],
      });
    });
    const su = guildCommands.find(c => c.name === 'su');
    if (!this.client.application.owner.ownerId) {
      data.fullPermissions.push({
        id: su.id,
        permissions: [{
          id: this.client.application.owner.id,
          type: 'USER',
          permission: true,
        }],
      });
    } else {
      this.client.application.owner.members.forEach((member) => {
        data.fullPermissions.push({
          id: su.id,
          permissions: [{
            id: member.id,
            type: 'USER',
            permission: true,
          }],
        });
      });
    }
    await guild.commands.permissions.set(data);
  }

  /**
   * Setup permissions for commands in each guild
   * @returns {Promise<void>}
   */
  async initPermissions() {
    /** @type Discord.GuildManager */
    const guildManager = this.client.guilds;

    /**
     * @type {Array<Discord.Guild>}
     */
    const guilds = whitelistedGuilds.length
      ? Array.from(guildManager.cache.filter(g => whitelistedGuilds.includes(g.id)).values())
      : Array.from(guildManager.cache.values());
    for (const guild of guilds) {
      await this.#setGuildPerms(guild);
    }
  }

  /**
   * Recalculate perms for a guild with the provided values
   * @param {string} value comma-separated value string to set
   * @param {Guild} guild to set perms for
   * @returns {Promise<void>}
   */
  async recalcPerms(value, guild) {
    await this.#setGuildPerms(guild, value);
  }

  /**
   * Load commands from files into the command manager
   * @param {Discord.ApplicationCommandManager} commands commands to populate
   * @param {Array<Interaction>} loadedFiles loaded interactions to make perms
   * @param {Logger} logger logging interface
   * @returns {Promise<void>}
   */
  static async loadCommands(commands, loadedFiles, logger) {
    const cmds = loadedFiles.filter(cmd => cmd.enabled).map(cmd => cmd.command);
    // logger.error(JSON.stringify(cmds));
    if (whitelistedGuilds.length) {
      for (const gid of whitelistedGuilds) {
        try {
          await commands.set(cmds, gid);
        } catch (e) {
          logger.error(e);
        }
      }
    } else {
      await commands.set(cmds);
    }
  }

  async init() {
    this.logger.debug('Initing InteractionHandler');
    this.loadedCommands = await InteractionHandler.loadFiles(
      this.loadedCommands, this.logger,
    );
    await InteractionHandler
      .loadCommands(this.client?.application?.commands, this.loadedCommands, this.logger);
    await this.initPermissions();
    this.ready = true;
  }

  /**
   * Handle dat interaction!
   * @param {CommandInteraction|ButtonInteraction} interaction interaction that will be handled
   */
  async execute(interaction) {
    if (!this.ready) return;

    const ctx = await this.settings.getCommandContext(interaction.channel, interaction.user);
    ctx.settings = this.settings;
    ctx.ws = ws;
    ctx.handler = this;
    ctx.logger = this.logger;

    if (interaction instanceof CommandInteraction) {
      this.logger.debug(`Running ${interaction.id} for ${this.event}`);
      const match = this.loadedCommands.find(c => c.command.name === interaction.commandName);

      const noAccess = (match?.elevated
              && !interaction.member.permissions.has(Permissions.MANAGE_GUILD, false))
          || (match?.ownerOnly && interaction.user.id !== this.bot.owner);

      if (noAccess) {
        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();
      }

      await match?.commandHandler?.(interaction, ctx);
    }
  }
};
