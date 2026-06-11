import SQL, { type SQLStatement } from 'sql-template-strings';
import mysql, { type Pool } from 'mysql2/promise';

import type { Logger } from '#shared/types/logger';
import { buildCommandContext } from '#shared/settings/database/CommandContextBuilder';
import type { DatabaseRepositories } from '#shared/settings/database/DatabaseRepositories';
import type { DefaultSettings, QueryResult } from '#shared/settings/database/DatabaseDeps';
import BlacklistRepository from '#shared/settings/database/repositories/BlacklistRepository';
import BuildRepository from '#shared/settings/database/repositories/BuildRepository';
import ChannelSettingsRepository from '#shared/settings/database/repositories/ChannelSettingsRepository';
import CustomCommandRepository from '#shared/settings/database/repositories/CustomCommandRepository';
import DynamicVoiceRepository from '#shared/settings/database/repositories/DynamicVoiceRepository';
import GuildRepository from '#shared/settings/database/repositories/GuildRepository';
import NotificationsRepository from '#shared/settings/database/repositories/NotificationsRepository';
import PermissionsRepository from '#shared/settings/database/repositories/PermissionsRepository';
import PrivateRoomRepository from '#shared/settings/database/repositories/PrivateRoomRepository';
import PromocodeRepository from '#shared/settings/database/repositories/PromocodeRepository';
import RatioRepository from '#shared/settings/database/repositories/RatioRepository';
import StatisticsRepository from '#shared/settings/database/repositories/StatisticsRepository';
import StreamRepository from '#shared/settings/database/repositories/StreamRepository';
import TrackingRepository from '#shared/settings/database/repositories/TrackingRepository';
import WelcomeRepository from '#shared/settings/database/repositories/WelcomeRepository';
import WorkerCacheRepository from '#shared/settings/database/repositories/WorkerCacheRepository';
import { assetBase } from '#shared/utilities/CommonFunctions';
import logger from '#shared/utilities/Logger';

type BotHost = {
  client?: { user?: { username?: string } };
};

/** Persistent storage facade composed of domain repositories. */
export default class Database implements DatabaseRepositories {
  bot: unknown;

  logger: Logger;

  db: Pool;

  channels!: ChannelSettingsRepository;

  tracking!: TrackingRepository;

  notifications!: NotificationsRepository;

  privateRooms!: PrivateRoomRepository;

  dynamicVoice!: DynamicVoiceRepository;

  blacklist!: BlacklistRepository;

  welcome!: WelcomeRepository;

  ratio!: RatioRepository;

  streams!: StreamRepository;

  customCommands!: CustomCommandRepository;

  builds!: BuildRepository;

  promocodes!: PromocodeRepository;

  permissions!: PermissionsRepository;

  statistics!: StatisticsRepository;

  guilds!: GuildRepository;

  workerCache!: WorkerCacheRepository;

  clusterId: string | number;

  scope: string;

  defaults: DefaultSettings;

  private constructor(bot?: unknown) {
    this.bot = bot;
    this.logger = logger;
    this.clusterId = process.env.CLUSTER_ID || 0;
    this.scope = (process.env.SCOPE || 'bot').toLowerCase();

    this.defaults = {
      prefix: '/',
      respond_to_settings: true,
      platform: 'pc',
      language: 'en',
      delete_after_respond: true,
      delete_response: true,
      createPrivateChannel: false,
      deleteExpired: false,
      allowCustom: false,
      allowInline: false,
      defaultRoomsLocked: true,
      defaultNoText: false,
      defaultShown: false,
      tempCategory: false,
      'settings.cc.ping': true,
      ephemerate: true,
    };

    const opts = {
      supportBigNumbers: true,
      bigNumberStrings: true,
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'genesis',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB || 'genesis',
    };

    try {
      this.db = mysql.createPool(opts);
    } catch (e) {
      this.logger.fatal(e);
      throw e;
    }
  }

  /** Connect, wire repositories, and return a ready facade. */
  static async build(bot?: unknown): Promise<Database> {
    const instance = new Database(bot);
    instance.#wireRepositories();

    const opts = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'genesis',
      database: process.env.MYSQL_DB || 'genesis',
    };

    const skipProbe = process.env.NODE_ENV === 'test' && process.env.TEST_MARIADB !== '1';
    if (skipProbe) {
      instance.logger.debug('Database connection probe skipped (NODE_ENV=test, TEST_MARIADB≠1)');
      return instance;
    }

    try {
      await instance.db.query('SELECT 1');
      instance.logger.debug(`Database connected (${opts.host}:${opts.port}/${opts.database})`);
    } catch (e) {
      const err = e as Error;
      instance.logger.fatal(
        `Database connection failed (${opts.host}:${opts.port}/${opts.database} as ${opts.user}): ${err.message}`
      );
    }

    return instance;
  }

  #wireRepositories() {
    const deps = {
      query: (q: Parameters<Database['query']>[0]) => this.query(q),
      defaults: this.defaults,
      logger: this.logger,
      scope: this.scope,
      clusterId: this.clusterId,
      bot: this.bot,
    };

    this.tracking = new TrackingRepository(deps);
    this.notifications = new NotificationsRepository(deps);
    this.privateRooms = new PrivateRoomRepository(deps);
    this.dynamicVoice = new DynamicVoiceRepository(deps);
    this.blacklist = new BlacklistRepository(deps);
    this.welcome = new WelcomeRepository(deps);
    this.ratio = new RatioRepository(deps);
    this.streams = new StreamRepository(deps);
    this.customCommands = new CustomCommandRepository(deps);
    this.builds = new BuildRepository(deps);
    this.promocodes = new PromocodeRepository(deps);
    this.permissions = new PermissionsRepository(deps);
    this.statistics = new StatisticsRepository(deps);

    this.workerCache = new WorkerCacheRepository(deps);

    this.guilds = new GuildRepository(deps, {
      removeChannelPermissions: (channelId) => this.permissions.removeChannelPermissions(channelId),
      removeItemNotifications: (channelId) => this.tracking.removeItemNotifications(channelId),
      removeSettings: (channelId) => this.channels.removeSettings(channelId),
      removePrivateChannels: (guildId) => this.privateRooms.removePrivateChannels(guildId),
      removeGuildPermissions: (guildId) => this.permissions.removeGuildPermissions(guildId),
      removePings: (guildId) => this.notifications.removePings(guildId),
      removeGuildCustomCommands: (guildId) => this.customCommands.removeGuildCustomCommands(guildId),
      deleteGuildRatio: (guild) => this.ratio.deleteGuildRatio(guild),
    });

    this.channels = new ChannelSettingsRepository(deps, {
      addGuildTextChannel: (channel) =>
        this.guilds.addGuildTextChannel(channel as Parameters<GuildRepository['addGuildTextChannel']>[0]),
      addDMChannel: (channel) => this.guilds.addDMChannel(channel as Parameters<GuildRepository['addDMChannel']>[0]),
    });

    const bindLegacy = (methods: string[], source: object) => {
      const legacy = source as Record<string, unknown>;
      methods.forEach((method) => {
        (this as Record<string, unknown>)[method] = (...args: unknown[]) =>
          (legacy[method] as (...legacyArgs: unknown[]) => unknown)(...args);
      });
    };

    bindLegacy(
      [
        'getGuilds',
        'getGuildSetting',
        'getChannelSettings',
        'getChannelSetting',
        'setChannelWebhook',
        'getChannelWebhook',
        'setChannelSetting',
        'deleteChannelSetting',
        'setGuildSetting',
        'deleteGuildSetting',
        'removeSettings',
        'deleteWebhooksForChannel',
      ],
      this.channels
    );

    bindLegacy(
      [
        'setTrackables',
        'trackItems',
        'untrackItems',
        'trackEventTypes',
        'untrackEventTypes',
        'getTrackedItems',
        'getTrackedEventTypes',
        'removeItemNotifications',
        'removeTypeNotifications',
        'stopTracking',
      ],
      this.tracking
    );

    bindLegacy(
      [
        'addPings',
        'getPing',
        'getAllPings',
        'getGroupPings',
        'getPingsForGuild',
        'removePing',
        'getNotifications',
        'getAgnosticNotifications',
        'removePings',
        'setNotifiedIds',
        'getNotifiedIds',
      ],
      this.notifications
    );

    bindLegacy(
      [
        'removePrivateChannels',
        'setRolesForGuild',
        'getRolesForGuild',
        'addPrivateRoom',
        'deletePrivateRoom',
        'userHasRoom',
        'getUsersRoom',
        'isPrivateRoom',
        'getPrivateRooms',
      ],
      this.privateRooms
    );

    bindLegacy(
      [
        'addTemplate',
        'deleteTemplate',
        'addInstance',
        'deleteInstance',
        'getInstances',
        'getTemplates',
        'getDynTemplate',
        'setDynTemplate',
        'isRelay',
        'isTemplate',
        'isInstance',
      ],
      this.dynamicVoice
    );

    bindLegacy(['isBlacklisted', 'getBlacklisted', 'addBlacklistedUser', 'deleteBlacklistedUser'], this.blacklist);

    bindLegacy(['clearWelcomeForGuild', 'setWelcome', 'getWelcomes'], this.welcome);

    bindLegacy(['addGuildRatio', 'getGuildRatios', 'deleteGuildRatio'], this.ratio);

    bindLegacy(['addStream', 'deleteStream', 'getTrackedStreams'], this.streams);

    bindLegacy(
      [
        'getRawCustomCommands',
        'getCustomCommandRaw',
        'updateCustomCommand',
        'getCustomCommandsForGuild',
        'addCustomCommand',
        'deleteCustomCommand',
        'removeGuildCustomCommands',
      ],
      this.customCommands
    );

    bindLegacy(
      [
        'addNewBuilds',
        'addNewBuild',
        'getBuild',
        'getBuildSearch',
        'deleteBuild',
        'getBuilds',
        'setBuildFields',
        'setBuildPublicity',
        'saveBuild',
      ],
      this.builds
    );

    bindLegacy(
      [
        'addPool',
        'deletePool',
        'setPoolName',
        'setPoolPassword',
        'setPoolType',
        'clearPoolPassword',
        'restrictPool',
        'isPoolRestricted',
        'hasCodeInPool',
        'isPoolPublic',
        'setPoolGuild',
        'setPoolPublic',
        'addPoolManager',
        'addPoolManagers',
        'removePoolManager',
        'removePoolManagers',
        'addCode',
        'getCode',
        'getCodesInPools',
        'grantCode',
        'revokeCode',
        'getNextCodeInPool',
        'addCodes',
        'getPoolsUserManages',
        'userManagesPool',
        'getGuildsPool',
        'getUserCodes',
      ],
      this.promocodes
    );

    bindLegacy(
      [
        'setChannelPermissionForMember',
        'setChannelPermissionForRole',
        'setGuildPermissionForMember',
        'setGuildPermissionForRole',
        'getChannelPermissionForMember',
        'getChannelPermissionForRole',
        'getChannelPermissionForUserRoles',
        'getGuildPermissionForMember',
        'getGuildPermissionForRole',
        'removeGuildPermissions',
        'removeChannelPermissions',
        'permissionsForGuild',
        'permissionsForChannel',
      ],
      this.permissions
    );

    bindLegacy(['trackRole', 'untrackRole', 'getTrackedRoles', 'addExecution', 'getGuildStats'], this.statistics);

    bindLegacy(
      [
        'createSchema',
        'ensureData',
        'addGuild',
        'addGuildTextChannel',
        'addDMChannel',
        'deleteChannel',
        'removeGuild',
        'checkUpdateChannel',
      ],
      this.guilds
    );
  }

  init() {
    const bot = this.bot as BotHost | undefined;
    this.defaults =
      this.scope === 'bot'
        ? {
            ...this.defaults,
            username: bot?.client?.user?.username,
            avatar: `${assetBase}/img/avatar.png`,
          }
        : {
            ...this.defaults,
            username: process.env.DEF_USER || 'Genesis',
            avatar: `${assetBase}/img/avatar.png`,
          };
  }

  async query(query: SQLStatement | string): Promise<QueryResult | undefined> {
    try {
      return (await this.db.query(query as never)) as QueryResult;
    } catch (e) {
      logger.error(e);
      return undefined;
    }
  }

  debugQuery(query: SQLStatement) {
    const { strings, values } = JSON.parse(JSON.stringify(query)) as { strings: string[]; values: unknown[] };
    const tokens: string[] = [];
    strings.forEach((str, ind) => {
      tokens.push(JSON.stringify(str));
      if (values[ind]) {
        tokens.push(String(values[ind]));
      }
    });
    this.logger.error(tokens.join(''));
  }

  async getChannelAndGuildCounts() {
    const query = SQL`select count(distinct guild_id) as countGuilds, count(distinct id) as countChannels from channels;`;
    const result = await this.query(query);
    const rows = result?.[0];
    if (rows?.length) {
      return {
        channels: rows[0].countChannels as number,
        guilds: rows[0].countGuilds as number,
      };
    }
    return {};
  }

  async getCommandContext(channel: unknown, user?: unknown) {
    return buildCommandContext(
      {
        scope: this.scope,
        defaults: this.defaults,
        bot: this.bot as { owner?: string },
        query: (q) => this.query(q),
        channels: this.channels,
        isBlacklisted: (userId, guildId) => this.blacklist.isBlacklisted(userId, String(guildId)),
      },
      channel as Parameters<typeof buildCommandContext>[1],
      user as Parameters<typeof buildCommandContext>[2]
    );
  }
}
