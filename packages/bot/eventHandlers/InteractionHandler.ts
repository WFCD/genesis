import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import decache from 'decache';
import {
  ApplicationCommandManager,
  ApplicationCommandPermissionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Events,
  Guild,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  PermissionsBitField,
  PermissionFlagsBits,
  type Snowflake,
} from 'discord.js';

import createI18n from '#shared/utilities/i18n';
import WorldStateClient from '#shared/utilities/WorldStateClient';
import logger from '#shared/utilities/Logger';
import { i18n, locales } from '#shared/resources/index';
import { withEphemeral } from '#shared/utilities/CommonFunctions';
import type { CommandContext } from '#shared/types/context';

import BaseHandler from '../models/BaseEventHandler';
import CustomInteraction, { type CustomCommandDefinition } from '../models/CustomInteraction';
import Interaction, { type InteractionCommandDefinition } from '../models/Interaction';
import SettingsManageUI from '../interactions/core/SettingsManageUI';
import SuServerUI from '../interactions/core/SuServerUI';
import TrackingManageUI from '../interactions/tracking/TrackingManageUI';
import RoomsManageUI from '../interactions/channels/RoomsManageUI';
import BuildsSearchUI from '../interactions/warframe/BuildsSearchUI';
import type Genesis from '../bot';

const whitelistedGuilds: string[] = []; // (process.env.WHITELISTED_GUILDS || '').split(',');

const ws = new WorldStateClient(logger);

type InteractionConstructor = typeof Interaction & {
  enabled?: boolean;
  ownerOnly?: boolean;
  elevated?: boolean;
  name?: string;
  command?: InteractionCommandDefinition;
  commands?: InteractionCommandDefinition[];
  autocompleteHandler?: (interaction: AutocompleteInteraction, ctx: CommandContext) => Promise<unknown>;
};

type CustomInteractionConstructor = InteractionConstructor & {
  guildId: string;
};

const commandName = (command: InteractionConstructor) => command.command?.name ?? command.name;

const commandId = (interaction: ChatInputCommandInteraction): string => {
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

  #loadedCommands: InteractionConstructor[];

  #customCommands: CustomInteractionConstructor[];

  ready = false;

  constructor(bot: Genesis, skipInit?: boolean) {
    super(bot, 'handlers.interactions', Events.InteractionCreate);
    this.#loadedCommands = [];
    this.#customCommands = [];
    this.ready = false;
    if (!skipInit) void this.init();
  }

  static async loadFiles(loadedCommands: InteractionConstructor[] = []): Promise<InteractionConstructor[]> {
    const handlersDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../interactions');
    let reloadedCommands = loadedCommands;

    let files = fs.readdirSync(handlersDir);
    const categories = files.filter((f) => !/\.(js|ts)$/.test(f));
    files = files.filter((f) => /\.(js|ts)$/.test(f));

    categories.forEach((category) => {
      const categoryDir = path.join(handlersDir, category);
      files = files.concat(
        fs
          .readdirSync(categoryDir)
          .filter((f) => /\.(js|ts)$/.test(f))
          .map((f) => path.join(path.resolve(categoryDir, f)))
      );
    });

    if (reloadedCommands.length > 0) {
      files?.forEach((f) => decache(f));
    }

    reloadedCommands = (
      await Promise.all(
        files.map(async (f) => {
          try {
            const Handler = (await import(f)).default as InteractionConstructor | undefined;
            return Handler?.prototype instanceof Interaction ? Handler : undefined;
          } catch (e) {
            logger.error(e);
            return undefined;
          }
        })
      )
    ).filter((h): h is InteractionConstructor => Boolean(h));

    return reloadedCommands;
  }

  get loadedCommands() {
    return this.#loadedCommands;
  }

  #isBotOwner(userId: string) {
    const configuredOwner = this.bot.owner?.trim();
    if (configuredOwner && userId === configuredOwner) return true;

    const appOwner = this.client.application?.owner;
    if (!appOwner) return false;
    if ('id' in appOwner && appOwner.id === userId) return true;
    if ('members' in appOwner) return appOwner.members.some((member) => member.id === userId);
    return false;
  }

  #canUseOwnerCommand(interaction: ChatInputCommandInteraction) {
    if (!this.#isBotOwner(interaction.user.id)) return false;
    const controlGuildId = process.env.CONTROL_GUILD_ID?.trim();
    if (controlGuildId && interaction.guildId !== controlGuildId) return false;
    return true;
  }

  static sanitizeCommandDefinition(command: InteractionCommandDefinition) {
    const sanitized = { ...command } as Record<string, unknown>;
    delete sanitized.ownerOnly;
    delete sanitized.elevated;
    delete sanitized.enabled;
    return sanitized as InteractionCommandDefinition;
  }

  static buildCommandPayloads(loadedFiles: InteractionConstructor[]) {
    const payloads = loadedFiles
      .filter((cmd) => cmd.enabled && !cmd.ownerOnly)
      .map((cmd) => (cmd?.command?.name === 'interaction' ? undefined : cmd.command || cmd.commands))
      .flat()
      .filter(Boolean);

    const suHandler = loadedFiles.find((cmd) => cmd.enabled && commandName(cmd) === 'su' && cmd.ownerOnly);
    if (suHandler?.command) {
      payloads.push(InteractionHandler.sanitizeCommandDefinition(suHandler.command));
    }

    return payloads;
  }

  async #removeGuildScopedSu() {
    const controlGuildId = process.env.CONTROL_GUILD_ID?.trim();
    if (!controlGuildId) return;

    try {
      await this.client.application.fetch();
      const guildCommands = await this.client.application.commands.fetch({ guildId: controlGuildId });
      const su = guildCommands.find((entry) => entry.name === 'su');
      if (!su) return;
      await this.client.application.commands.delete(su.id, controlGuildId);
      this.logger.info(`Removed legacy guild-scoped /su from ${controlGuildId}`);
    } catch (error) {
      this.logger.debug(`Could not remove guild-scoped /su: ${error}`);
    }
  }

  /** @deprecated Guild-scoped registration hid /su behind stale permission overwrites; use global payloads instead. */
  async registerSuCommand() {
    await this.#removeGuildScopedSu();
  }

  async reloadCommands() {
    this.#loadedCommands = await InteractionHandler.loadFiles(this.#loadedCommands);
    await InteractionHandler.loadCommands(this.client?.application?.commands, this.#loadedCommands);
    await this.#removeGuildScopedSu();
  }

  async #setGuildPerms(guild: Guild, rolesOverride?: string | boolean) {
    const elevatedCommandNames = new Set(
      this.#loadedCommands
        .filter(
          (command) =>
            command.elevated === true || (commandName(command) !== 'su' && !command?.command?.defaultMemberPermissions)
        )
        .map((command) => commandName(command))
        .filter((name): name is string => Boolean(name))
    );

    const rawCommandsToSet = this.#loadedCommands.filter((command) => {
      if (commandName(command) === 'su') {
        return guild.id === process.env?.CONTROL_GUILD_ID;
      }
      const isElevated = command.elevated === true || !command?.command?.defaultMemberPermissions;
      return isElevated;
    });

    // at some point append custom commands as interactions
    await guild.commands.set(rawCommandsToSet.map((cmd) => cmd.command));

    const guildCommands = (await guild.commands.fetch()).filter((c) => elevatedCommandNames.has(c.name));
    const owner = guild.ownerId;
    rolesOverride =
      rolesOverride ||
      guild.roles.cache.every((role) =>
        role.permissions.has([
          PermissionFlagsBits.ManageGuild,
          PermissionFlagsBits.Administrator,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageRoles,
        ])
      );
    const roles = String(rolesOverride || (await this.settings.channels.getGuildSetting(guild, 'elevatedRoles')) || '')
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
              type: ApplicationCommandPermissionType.Role,
              permission: false,
            },
            {
              id: owner,
              type: ApplicationCommandPermissionType.User,
              permission: true,
            },
            ...(roles?.length
              ? roles.map((id) => ({
                  id,
                  type: ApplicationCommandPermissionType.Role,
                  permission: true,
                }))
              : []),
          ],
        });
      });
    const su = guildCommands.find((c) => c.name === 'su');
    const appOwner = this.client.application.owner;
    if (su && appOwner) {
      if ('members' in appOwner) {
        appOwner.members.forEach((member) => {
          data.fullPermissions.push({
            id: su.id,
            permissions: [
              {
                id: member.id,
                type: ApplicationCommandPermissionType.User,
                permission: true,
              },
            ],
          });
        });
      } else {
        data.fullPermissions.push({
          id: su.id,
          permissions: [
            {
              id: appOwner.id,
              type: ApplicationCommandPermissionType.User,
              permission: true,
            },
          ],
        });
      }
    }
    await Promise.all(
      data.fullPermissions.map(({ id, permissions }) =>
        // Guild command permissions API varies by discord.js version; initPermissions is currently disabled.
        (
          guild.commands.permissions.set as unknown as (options: {
            command: string;
            permissions: unknown[];
          }) => Promise<unknown>
        )({
          command: id,
          permissions,
        })
      )
    );
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
    await Promise.all(guilds.map((guild) => this.#setGuildPerms(guild)));
  }

  async recalcPerms(value: string, guild: Guild) {
    await this.#setGuildPerms(guild, value);
  }

  static async loadCommands(commands: ApplicationCommandManager | undefined, loadedFiles: InteractionConstructor[]) {
    const cmds = InteractionHandler.buildCommandPayloads(loadedFiles);
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
  async loadCustomCommands(guildId?: Snowflake) {
    const rawCustomCommands = (await this.settings.customCommands.getRawCustomCommands(guildId)) ?? [];
    if (guildId) this.#customCommands = this.#customCommands.filter((cc) => cc.guildId !== guildId);
    const added = rawCustomCommands
      .filter((raw): raw is CustomCommandDefinition => Boolean(raw.guildId && raw.call && raw.response))
      .map((raw) => CustomInteraction(raw) as CustomInteractionConstructor);
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
    this.#loadedCommands = await InteractionHandler.loadFiles(this.#loadedCommands);
    try {
      await InteractionHandler.loadCommands(this.client?.application?.commands, this.#loadedCommands);
      await this.#removeGuildScopedSu();
      await this.loadCustomCommands();
      if (this.#loadedCommands.some((command) => commandName(command) === 'su' && command.ownerOnly)) {
        this.logger.info('Registered /su globally (owner-only at runtime)');
      }
    } catch (e) {
      this.logger.error(e);
    }

    // await this.initPermissions();
    this.ready = true;
  }

  async #manageGuildContext(
    interaction: ModalSubmitInteraction | MessageComponentInteraction,
    channelId: string,
    threadId?: string
  ) {
    const channel = await interaction.guild?.channels.fetch(channelId).catch(() => undefined);
    if (!channel) return undefined;
    const thread = threadId ? await interaction.client.channels.fetch(threadId).catch(() => undefined) : undefined;
    const ctx = (await this.settings.getCommandContext(channel, interaction.user)) as CommandContext;
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
    ctx.i18n = createI18n(i18n, ctx.language);
    return { ctx, channel, thread };
  }

  #canManageGuild(interaction: ModalSubmitInteraction | MessageComponentInteraction | ChatInputCommandInteraction) {
    const memberPermissions =
      interaction.member && 'permissions' in interaction.member ? interaction.member.permissions : undefined;
    return memberPermissions instanceof PermissionsBitField
      ? memberPermissions.has(PermissionFlagsBits.ManageGuild)
      : false;
  }

  async execute(...args: unknown[]) {
    const interaction = args[0];
    if (!this.ready || !interaction) return undefined;

    if (interaction instanceof MessageComponentInteraction && SuServerUI.isComponent(interaction.customId)) {
      if (!this.#isBotOwner(interaction.user.id)) {
        return interaction.reply(withEphemeral(true, { content: 'No Access' }));
      }
      if (!interaction.isButton()) {
        return interaction.reply(withEphemeral(true, { content: 'Unsupported control.' }));
      }
      const ctx = (await this.settings.getCommandContext(
        interaction.channel || interaction.user,
        interaction.user
      )) as CommandContext;
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
      ctx.i18n = createI18n(i18n, ctx.language);
      return SuServerUI.handleComponent(interaction, ctx);
    }

    if (interaction instanceof ModalSubmitInteraction && SettingsManageUI.isManageModal(interaction.customId)) {
      if (!this.#canManageGuild(interaction)) {
        return interaction.reply(withEphemeral(true, { content: 'No Access' }));
      }
      const parts = interaction.customId.split(':');
      const resolved = await this.#manageGuildContext(interaction, parts[1], parts[2] === '0' ? undefined : parts[2]);
      if (!resolved) {
        return interaction.reply(withEphemeral(true, { content: 'Channel no longer available.' }));
      }
      return SettingsManageUI.handleModalSubmit(interaction, resolved.ctx, resolved.channel, resolved.thread);
    }

    if (
      interaction instanceof MessageComponentInteraction &&
      SettingsManageUI.isManageComponent(interaction.customId)
    ) {
      if (!this.#canManageGuild(interaction)) {
        return interaction.reply(withEphemeral(true, { content: 'No Access' }));
      }
      const parts = interaction.customId.split(':');
      const resolved = await this.#manageGuildContext(interaction, parts[1], parts[2] === '0' ? undefined : parts[2]);
      if (!resolved) {
        return interaction.reply(withEphemeral(true, { content: 'Channel no longer available.' }));
      }
      return SettingsManageUI.handleComponent(interaction, resolved.ctx, resolved.channel, resolved.thread);
    }

    if (
      interaction instanceof MessageComponentInteraction &&
      TrackingManageUI.isManageComponent(interaction.customId)
    ) {
      if (!this.#canManageGuild(interaction)) {
        return interaction.reply(withEphemeral(true, { content: 'No Access' }));
      }
      const parts = interaction.customId.split(':');
      const resolved = await this.#manageGuildContext(interaction, parts[1], parts[2] === '0' ? undefined : parts[2]);
      if (!resolved) {
        return interaction.reply(withEphemeral(true, { content: 'Channel no longer available.' }));
      }
      return TrackingManageUI.handleComponent(interaction, resolved.ctx, resolved.channel, resolved.thread);
    }

    if (interaction instanceof ModalSubmitInteraction && RoomsManageUI.isManageModal(interaction.customId)) {
      if (!interaction.guild) return undefined;
      const parts = interaction.customId.split(':');
      const ownerId = parts[2];
      if (interaction.user.id !== ownerId) {
        return interaction.reply(withEphemeral(true, { content: 'Only the room owner can use this panel.' }));
      }
      const ctx = (await this.settings.getCommandContext(
        interaction.channel || interaction.user,
        interaction.user
      )) as CommandContext;
      ctx.settings = this.settings;
      ctx.ws = ws;
      ctx.handler = this;
      ctx.logger = this.logger;
      return RoomsManageUI.handleModalSubmit(interaction, ctx);
    }

    if (interaction instanceof MessageComponentInteraction && RoomsManageUI.isManageComponent(interaction.customId)) {
      if (!interaction.guild) return undefined;
      const parts = interaction.customId.split(':');
      const ownerId = parts[2];
      if (interaction.user.id !== ownerId) {
        return interaction.reply(withEphemeral(true, { content: 'Only the room owner can use this panel.' }));
      }
      const ctx = (await this.settings.getCommandContext(
        interaction.channel || interaction.user,
        interaction.user
      )) as CommandContext;
      ctx.settings = this.settings;
      ctx.ws = ws;
      ctx.handler = this;
      ctx.logger = this.logger;
      return RoomsManageUI.handleComponent(interaction, ctx);
    }

    if (interaction instanceof MessageComponentInteraction && BuildsSearchUI.isManageComponent(interaction.customId)) {
      const ctx = (await this.settings.getCommandContext(
        interaction.channel || interaction.user,
        interaction.user
      )) as CommandContext;
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
      ctx.i18n = createI18n(i18n, ctx.language);
      return BuildsSearchUI.handleComponent(interaction, ctx);
    }

    if (interaction instanceof AutocompleteInteraction) {
      const match = this.#loadedCommands.find((c) => c?.command?.name === interaction.commandName);
      if (!match?.autocompleteHandler) return undefined;
      const ctx = (await this.settings.getCommandContext(
        interaction.channel || interaction.user,
        interaction.user
      )) as CommandContext;
      ctx.settings = this.settings;
      ctx.ws = ws;
      ctx.handler = this;
      ctx.logger = this.logger;
      return match.autocompleteHandler(interaction, ctx);
    }

    if (!(interaction instanceof ChatInputCommandInteraction)) return undefined;

    this.logger.debug(`Running ${interaction.id} for ${this.event}`);

    const match = this.#loadedCommands.find((c) => {
      const directMatch = c?.command?.name === interaction.commandName;
      const subMatch = c?.commands?.find((cs) => cs?.name === interaction.commandName);
      return directMatch || subMatch;
    });
    const customMatch = this.#customCommands.find(
      (c) => c?.command?.name === interaction.commandName && c?.guildId === interaction?.guild?.id
    );

    const canManageGuild = this.#canManageGuild(interaction);
    const noAccess = match?.ownerOnly
      ? !this.#canUseOwnerCommand(interaction)
      : Boolean(match?.elevated && !canManageGuild);

    if (noAccess) {
      return interaction.reply(withEphemeral(true, { content: 'No Access' }));
    }

    const ctx = (await this.settings.getCommandContext(
      interaction.channel || interaction.user,
      interaction.user
    )) as CommandContext;
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
    ctx.i18n = createI18n(i18n, ctx.language);

    if (interaction.guild) {
      void ctx.settings.statistics.addExecution(interaction.guild, commandId(interaction)).catch((error) => {
        ctx.logger?.error?.(error);
      });
    }

    return match
      ? match?.commandHandler?.(interaction, ctx)
      : customMatch
        ? customMatch?.commandHandler?.(interaction, ctx)
        : undefined;
  }
}
