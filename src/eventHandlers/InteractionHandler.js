import fs from 'node:fs';
import path from 'node:path';
import I18n from 'i18n-string-templates';
import decache from 'decache';
import Discord from 'discord.js';
import Interaction from '../models/Interaction.js';
import WorldStateClient from '../utilities/WorldStateClient.js';
import CustomInteraction from '../models/CustomInteraction.js';
import BaseHandler from '../models/BaseEventHandler.js';
import logger from '../utilities/Logger.js';
import { i18n, locales } from '../resources/index.js';

const { CommandInteraction } = Discord;
const {
  Permissions: { FLAGS: Permissions },
  Constants: { Events },
} = Discord;
const whitelistedGuilds = []; // (process.env.WHITELISTED_GUILDS || '').split(',');

const ws = new WorldStateClient(logger);

/**
 * Give a command id for a command interaction
 * @param {CommandInteraction} interaction to get id for
 * @returns {string} command id!
 */
const commandId = (interaction) => {
  try {
    return `${interaction.commandName}:${
      interaction.options.getSubcommandGroup() || ''
    }:${interaction.options.getSubcommand()}`;
  } catch (e) {
    try {
      return `${interaction.commandName}:${interaction.options.getSubcommand()}`;
    } catch (er) {
      return interaction.commandName;
    }
  }
};

/**
 * Describes a handler
 */
export default class InteractionHandler extends BaseHandler {
  static deferred = true;
  /** @type {Array<Interaction>} */
  #loadedCommands;
  /** @type {Array<Interaction>} */
  #customCommands;

  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.interactions', Events.INTERACTION_CREATE);
    this.#loadedCommands = [];
    this.#customCommands = [];
    this.ready = false;
    this.init();
  }

  static async loadFiles(loadedCommands) {
    const handlersDir = path.join('src/interactions');
    let reloadedCommands = loadedCommands || [];

    let files = fs.readdirSync(handlersDir);
    const categories = files.filter?.((f) => !f.endsWith('.js'));
    files = files.filter?.((f) => f.endsWith('.js'));

    categories.forEach((category) => {
      files = files.concat(
        fs.readdirSync(path.join(handlersDir, category)).map((f) => path.join(path.resolve(handlersDir, category, f)))
      );
    });

    if (reloadedCommands.length > 0) {
      files?.forEach((f) => decache(f));
    }

    reloadedCommands = (
      await Promise.all(
        files.map(async (f) => {
          try {
            const Handler = (await import(f)).default;
            return Handler.prototype instanceof Interaction ? Handler : undefined;
          } catch (e) {
            logger.error(e);
            return undefined;
          }
        })
      )
    ).filter((h) => h);

    return reloadedCommands;
  }

  /**
   * Set the perms for a single guild
   * @param {Discord.Guild} guild guild to set perms for
   * @param {string?} rolesOverride override instead of fetching guild setting
   * @returns {Promise<void>}
   */
  async #setGuildPerms(guild, rolesOverride) {
    const rawCommandsToSet = this.#loadedCommands.filter((command) => {
      const includeIfSu = command.name === 'su' ? guild.id === process.env?.CONTROL_GUILD_ID : true;
      const isElevated = command.name !== 'su' && !command.command.defaultPermission;
      return includeIfSu || isElevated;
    });

    // at some point append custom commands as interactions
    await guild.commands.set(rawCommandsToSet.map((cmd) => cmd.command));

    const guildCommands = (await guild.commands.fetch()).filter((c) => !c.defaultPermission);
    const owner = guild.ownerId;
    rolesOverride =
      rolesOverride ||
      guild.roles.cache.every((role) =>
        role.permissions.has([
          Permissions.MANAGE_GUILD,
          Permissions.ADMINISTRATOR,
          Permissions.MANAGE_CHANNELS,
          Permissions.MANAGE_ROLES,
        ])
      );
    const roles = (rolesOverride || (await this.settings.getGuildSetting(guild, 'elevatedRoles')) || '')
      .split(',')
      .filter((s) => s.length);
    const data = {
      /** @type Array<Discord.GuildApplicationCommandPermissionData> */
      fullPermissions: [],
    };
    await this.client.application.fetch();
    guildCommands
      .filter((c) => c.name !== 'su')
      .forEach((command) => {
        data.fullPermissions.push({
          id: command.id,
          permissions: [
            {
              id: guild.roles.everyone.id,
              type: 'ROLE',
              permission: false,
            },
            {
              id: owner,
              type: 'USER',
              permission: true,
            },
            ...(roles?.length
              ? roles.map((id) => ({
                  id,
                  type: 'ROLE',
                  permission: true,
                }))
              : []),
          ],
        });
      });
    const su = guildCommands.find((c) => c.name === 'su');
    if (!this.client.application.owner.ownerId && su) {
      data.fullPermissions.push({
        id: su.id,
        permissions: [
          {
            id: this.client.application.owner.id,
            type: 'USER',
            permission: true,
          },
        ],
      });
    } else if (this.client?.application?.owner.members) {
      this?.client?.application?.owner?.members.forEach((member) => {
        data.fullPermissions.push({
          id: su.id,
          permissions: [
            {
              id: member.id,
              type: 'USER',
              permission: true,
            },
          ],
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
      ? Array.from(guildManager.cache.filter((g) => whitelistedGuilds.includes(g.id)).values())
      : Array.from(guildManager.cache.values());
    await Promise.all(guilds.map(this.#setGuildPerms));
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
   * @returns {Promise<void>}
   */
  static async loadCommands(commands, loadedFiles) {
    const cmds = loadedFiles
      .filter((cmd) => cmd.enabled && !cmd.ownerOnly)
      .map((cmd) => {
        return cmd?.command?.name === 'interaction' ? undefined : cmd.command || cmd.commands;
      })
      .flat()
      .filter((c) => c);
    // logger.error(JSON.stringify(cmds));
    if (whitelistedGuilds.length) {
      await Promise.all(
        whitelistedGuilds.map(async (gid) => {
          try {
            await commands.set(cmds, gid);
          } catch (e) {
            logger.error(e);
          }
        })
      );
    } else {
      await commands.set(cmds);
    }
  }

  /**
   * Load custom interactions
   * @param {Discord.Snowflake} [guildId] guildId
   * @returns {Promise<void>}
   */
  async loadCustomCommands(guildId) {
    const rawCustomCommands = await this.settings.getRawCustomCommands(guildId);
    if (guildId) this.#customCommands = this.#customCommands.filter((cc) => cc.guildId !== guildId);
    const added = rawCustomCommands.map((raw) => CustomInteraction(raw));
    this.#customCommands.push(...added);
    if (guildId) {
      const guild = await this.client.guilds.fetch(guildId);
      await guild.commands.set(added.map((cc) => cc.command));
    } else {
      const grouped = {};
      added.forEach((ncc) => {
        if (grouped[ncc.guildId]) grouped[ncc.guildId].push(ncc.command);
        else grouped[ncc.guildId] = [ncc.command];
      });
      await Promise.all(
        Object.keys(grouped).map(async (gid) => {
          if (!gid) return false;
          let guild;
          try {
            // fetch can fail due to missing access. swallow error.
            guild = await this.client.guilds.fetch(gid);
            // probably should consider checking if the bot is in the server?
            if (!guild) return false;
            const guildCCs = grouped[gid];
            guildCCs.length = 50;
            await guild?.commands?.set(guildCCs.filter((c) => c));
          } catch (ignore) {
            /* Ignored */
          }
        })
      );
    }
  }

  async init() {
    this.logger.debug('Initializing InteractionHandler');
    this.#loadedCommands = await InteractionHandler.loadFiles(this.#loadedCommands, this.logger);
    await InteractionHandler.loadCommands(this.client?.application?.commands, this.#loadedCommands, this.logger);
    // load custom commands, allowed to fail
    try {
      await this.loadCustomCommands();
    } catch (e) {
      this.logger.error(e);
    }

    // await this.initPermissions();
    this.ready = true;
  }

  /**
   * Handle dat interaction!
   * @param {Discord.CommandInteraction|Discord.ButtonInteraction} interaction
   *  interaction that will be handled
   * @returns {Promise<Discord.Message>|void}
   */
  async execute(interaction) {
    if (!this.ready) return undefined;
    if (!interaction) return undefined;

    if (interaction instanceof CommandInteraction) {
      this.logger.debug(`Running ${interaction.id} for ${this.event}`);

      const match = this.#loadedCommands.find((c) => {
        const directMatch = c?.command?.name === interaction.commandName;
        const subMatch = c?.commands?.find((cs) => cs?.name === interaction.commandName);
        return directMatch || subMatch;
      });
      const customMatch = this.#customCommands.find(
        (c) => c?.command?.name === interaction.commandName && c?.guildId === interaction?.guild?.id
      );

      const noAccess =
        (match?.elevated && !interaction.member.permissions.has(Permissions.MANAGE_GUILD, false)) ||
        (match?.ownerOnly && interaction.user.id !== this.bot.owner);

      if (noAccess) {
        return interaction.reply({ content: 'No Access', ephemeral: true });
      }

      const ctx = await this.settings.getCommandContext(interaction.channel || interaction.user, interaction.user);
      ctx.settings = this.settings;
      ctx.ws = ws;
      ctx.handler = this;
      ctx.logger = this.logger;

      const intLang = interaction.locale.slice(0, 2);
      if (locales.includes(intLang)) {
        ctx.language = intLang;
      } else if (!locales.includes(ctx.language)) {
        ctx.language = 'en';
      }
      ctx.i18n = I18n(i18n, ctx.language);

      if (interaction.guild) ctx.settings.addExecution(interaction.guild, commandId(interaction));
      // eslint-disable-next-line no-nested-ternary
      return match
        ? match?.commandHandler?.(interaction, ctx)
        : customMatch
        ? customMatch?.commandHandler?.(interaction, ctx)
        : undefined;
    }
  }
}
