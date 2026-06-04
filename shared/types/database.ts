import type { DatabaseRepositories } from '#shared/settings/database/DatabaseRepositories';
import type BlacklistRepository from '#shared/settings/database/repositories/BlacklistRepository';
import type BuildRepository from '#shared/settings/database/repositories/BuildRepository';
import type ChannelSettingsRepository from '#shared/settings/database/repositories/ChannelSettingsRepository';
import type CustomCommandRepository from '#shared/settings/database/repositories/CustomCommandRepository';
import type DynamicVoiceRepository from '#shared/settings/database/repositories/DynamicVoiceRepository';
import type GuildRepository from '#shared/settings/database/repositories/GuildRepository';
import type NotificationsRepository from '#shared/settings/database/repositories/NotificationsRepository';
import type PermissionsRepository from '#shared/settings/database/repositories/PermissionsRepository';
import type PrivateRoomRepository from '#shared/settings/database/repositories/PrivateRoomRepository';
import type PromocodeRepository from '#shared/settings/database/repositories/PromocodeRepository';
import type RatioRepository from '#shared/settings/database/repositories/RatioRepository';
import type StatisticsRepository from '#shared/settings/database/repositories/StatisticsRepository';
import type StreamRepository from '#shared/settings/database/repositories/StreamRepository';
import type TrackingRepository from '#shared/settings/database/repositories/TrackingRepository';
import type WelcomeRepository from '#shared/settings/database/repositories/WelcomeRepository';

import type { Logger } from './logger';

/** Incremental typing for Database — tighten as query mixins migrate to repositories. */
export interface Database extends DatabaseRepositories {
  bot: unknown;
  logger: Logger;
  db: unknown;
  scope: string;
  defaults: Record<string, unknown>;
  clusterId: string | number;
  query(query: unknown): Promise<unknown>;
  createSchema(): Promise<unknown>;
  init(): void;
  getCommandContext(channel: unknown, user?: unknown): Promise<unknown>;
  getChannelAndGuildCounts(): Promise<{ channels?: number; guilds?: number }>;
  addGuild(guild: unknown): Promise<unknown>;
  addGuildTextChannel(channel: unknown): Promise<unknown>;
  addDMChannel(channel: unknown): Promise<unknown>;
  deleteChannel(channel: unknown): Promise<unknown>;
  removeGuild(guild: unknown): Promise<unknown>;
  ensureData(client: unknown): Promise<unknown>;
  checkUpdateChannel(channel: unknown): Promise<unknown>;
  addGuildRatio(shard: unknown, guild: unknown): Promise<unknown>;
  getGuildRatios(shards?: unknown[]): Promise<unknown>;
  deleteGuildRatio(guild: unknown): Promise<unknown>;
  addStream(type: string, username: string, uid?: string): Promise<unknown>;
  deleteStream(type: string, uid: string): Promise<unknown>;
  getTrackedStreams(shardIds: Array<string | number>, type: string, shardTotal: number): Promise<unknown>;
  clearWelcomeForGuild(guild: unknown, isDm: boolean): Promise<unknown>;
  setWelcome(message: unknown, isDm: boolean, text: string): Promise<unknown>;
  getWelcomes(guild: unknown): Promise<unknown>;
  getTrackedRoles(guild: unknown): Promise<unknown>;
  trackRole(guild: unknown, channel: unknown, role: unknown): Promise<unknown>;
  untrackRole(guild: unknown, role: unknown): Promise<unknown>;
  addExecution(guild: unknown, commandId: string): Promise<unknown>;
  getGuildStats(guild: unknown, commandId?: string, global?: boolean): Promise<unknown>;
  addPool(...args: unknown[]): Promise<unknown>;
  deletePool(id: string): Promise<unknown>;
  setPoolName(id: string, name: string): Promise<unknown>;
  setPoolPassword(id: string, password: string): Promise<unknown>;
  setPoolType(id: string, type: string): Promise<unknown>;
  clearPoolPassword(id: string): Promise<unknown>;
  restrictPool(id: string, status: boolean): Promise<unknown>;
  isPoolRestricted(id: string): Promise<unknown>;
  hasCodeInPool(member: unknown, pool: string): Promise<unknown>;
  isPoolPublic(id: string): Promise<unknown>;
  setPoolGuild(id: string, guildId: string): Promise<unknown>;
  setPoolPublic(id: string, status: boolean): Promise<unknown>;
  addPoolManager(id: string, manager: string): Promise<unknown>;
  addPoolManagers(id: string, newManagers: string[]): Promise<unknown>;
  removePoolManager(id: string, manager: string): Promise<unknown>;
  removePoolManagers(id: string, managers: string[]): Promise<unknown>;
  addCode(...args: unknown[]): Promise<unknown>;
  getCode(code: string): Promise<unknown>;
  getCodesInPools(poolIds: string[]): Promise<unknown>;
  grantCode(code: string, grantedTo: string, grantedBy: string, platform: string): Promise<unknown>;
  revokeCode(code: string, poolId: string): Promise<unknown>;
  getNextCodeInPool(platform: string, pool: string): Promise<unknown>;
  addCodes(codes: unknown[]): Promise<unknown>;
  getPoolsUserManages(user: unknown): Promise<unknown>;
  userManagesPool(user: unknown, pool: string): Promise<unknown>;
  getGuildsPool(guild: unknown): Promise<unknown>;
  getUserCodes(user: unknown): Promise<unknown>;
  getRawCustomCommands(guildId?: string): Promise<unknown[]>;
  getCustomCommandRaw(guild: unknown, call: string): Promise<unknown>;
  updateCustomCommand(guild: unknown, data: unknown): Promise<unknown>;
  getCustomCommandsForGuild(guild: unknown): Promise<unknown>;
  addCustomCommand(guild: unknown, call: string, response: string, creator: string): Promise<unknown>;
  deleteCustomCommand(guild: unknown, call: string): Promise<unknown>;
  removeGuildCustomCommands(guildId: string): Promise<unknown>;
  addNewBuilds(builds: unknown[]): Promise<unknown>;
  addNewBuild(title: string, body: string, image: string, owner: unknown): Promise<unknown>;
  getBuild(buildId: string): Promise<unknown>;
  getBuildSearch(qString: string): Promise<unknown>;
  deleteBuild(buildId: string): Promise<unknown>;
  getBuilds(owner: boolean, author: unknown, buildIds?: string[]): Promise<unknown>;
  setBuildFields(buildId: string, fields: unknown): Promise<unknown>;
  setBuildPublicity(buildIds: string[], isPublic: boolean | number | string): Promise<unknown>;
  saveBuild(build: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.channels.getSetting} */
  getGuildSetting(guild: unknown, setting: string): Promise<unknown>;
  /** @deprecated use {@link Database.channels.getSetting} */
  getChannelSetting(channel: unknown, setting: string): Promise<unknown>;
  /** @deprecated use {@link Database.channels.getSettings} */
  getChannelSettings(channel: unknown, settings: string[]): Promise<unknown>;
  /** @deprecated use {@link Database.channels.setSetting} */
  setChannelSetting(channel: unknown, setting: string, value: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.channels.setGuildSetting} */
  setGuildSetting(guild: unknown, setting: string, value: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.channels.deleteSetting} */
  deleteChannelSetting(channel: unknown, setting: string): Promise<unknown>;
  /** @deprecated use {@link Database.channels.getWebhook} */
  getChannelWebhook(channel: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.channels.setWebhook} */
  setChannelWebhook(channel: unknown, webhook: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.channels.deleteWebhooksForChannel} */
  deleteWebhooksForChannel(channelId: string): Promise<unknown>;
  /** @deprecated use {@link Database.channels.removeSettings} */
  removeSettings(channelId: string): Promise<unknown>;
  /** @deprecated use {@link Database.tracking.getTrackedItems} */
  getTrackedItems(channel: unknown, thread?: unknown): Promise<string[]>;
  /** @deprecated use {@link Database.tracking.getTrackedEventTypes} */
  getTrackedEventTypes(channel: unknown, thread?: unknown): Promise<string[]>;
  /** @deprecated use {@link Database.tracking.setTrackables} */
  setTrackables(channel: unknown, opts: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.tracking.trackItems} */
  trackItems(channel: unknown, items: string[], thread?: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.tracking.untrackItems} */
  untrackItems(channel: unknown, items: string[], thread?: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.tracking.trackEventTypes} */
  trackEventTypes(channel: unknown, types: string[], thread?: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.tracking.untrackEventTypes} */
  untrackEventTypes(channel: unknown, types: string[], thread?: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.tracking.stopTracking} */
  stopTracking(channel: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.notifications.addPings} */
  addPings(guild: unknown, opts: unknown, text: string): Promise<unknown>;
  /** @deprecated use {@link Database.notifications.getPingsForGuild} */
  getPingsForGuild(guild: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.notifications.removePing} */
  removePing(guild: unknown, itemOrType: string): Promise<unknown>;
  /** @deprecated use {@link Database.notifications.removePings} */
  removePings(guildId: string): Promise<unknown>;
  /** @deprecated use {@link Database.notifications.getAgnosticNotifications} */
  getAgnosticNotifications(opts: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.notifications.getNotifiedIds} */
  getNotifiedIds(platform: string): Promise<unknown>;
  /** @deprecated use {@link Database.notifications.setNotifiedIds} */
  setNotifiedIds(platform: string, notifiedIds: string[]): Promise<unknown>;
  /** @deprecated use {@link Database.privateRooms.getPrivateRooms} */
  getPrivateRooms(shards?: unknown): Promise<unknown[]>;
  /** @deprecated use {@link Database.privateRooms.deletePrivateRoom} */
  deletePrivateRoom(room: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.privateRooms.userHasRoom} */
  userHasRoom(member: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.privateRooms.addPrivateRoom} */
  addPrivateRoom(...args: unknown[]): Promise<unknown>;
  /** @deprecated use {@link Database.privateRooms.isPrivateRoom} */
  isPrivateRoom(channel: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.privateRooms.removePrivateChannels} */
  removePrivateChannels(guild: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.dynamicVoice.isRelay} */
  isRelay(channelId: string): Promise<unknown>;
  /** @deprecated use {@link Database.dynamicVoice.getDynTemplate} */
  getDynTemplate(channelId: string): Promise<unknown>;
  /** @deprecated use {@link Database.dynamicVoice.getTemplates} */
  getTemplates(guilds: unknown): Promise<string[]>;
  /** @deprecated use {@link Database.dynamicVoice.getInstances} */
  getInstances(channel: unknown): Promise<{ remainingEmpty: number; instances?: unknown[] }>;
  /** @deprecated use {@link Database.dynamicVoice.isInstance} */
  isInstance(channel: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.dynamicVoice.deleteInstance} */
  deleteInstance(channel: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.dynamicVoice.addInstance} */
  addInstance(template: unknown, channel: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.dynamicVoice.addTemplate} */
  addTemplate(channel: unknown, relay: boolean): Promise<unknown>;
  /** @deprecated use {@link Database.dynamicVoice.deleteTemplate} */
  deleteTemplate(channel: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.dynamicVoice.isTemplate} */
  isTemplate(channel: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.dynamicVoice.setDynTemplate} */
  setDynTemplate(channelId: string, template: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.blacklist.isBlacklisted} */
  isBlacklisted(userId: string, guildId: string): Promise<boolean>;
  /** @deprecated use {@link Database.blacklist.getBlacklisted} */
  getBlacklisted(guildId: string, global: boolean): Promise<unknown>;
  /** @deprecated use {@link Database.blacklist.addBlacklistedUser} */
  addBlacklistedUser(userId: string, guildId: string | number, global: boolean): Promise<unknown>;
  /** @deprecated use {@link Database.blacklist.deleteBlacklistedUser} */
  deleteBlacklistedUser(userId: string, guildId: string, global: boolean): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.setChannelPermissionForMember} */
  setChannelPermissionForMember(
    channel: unknown,
    member: unknown,
    commandId: string | string[],
    allowed: boolean
  ): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.setChannelPermissionForRole} */
  setChannelPermissionForRole(
    channel: unknown,
    role: unknown,
    commandId: string | string[],
    allowed: boolean
  ): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.setGuildPermissionForMember} */
  setGuildPermissionForMember(guild: unknown, member: unknown, commandId: string, allowed: boolean): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.setGuildPermissionForRole} */
  setGuildPermissionForRole(guild: unknown, role: unknown, commandId: string, allowed: boolean): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.getChannelPermissionForMember} */
  getChannelPermissionForMember(channel: unknown, memberId: string, commandId: string): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.getChannelPermissionForRole} */
  getChannelPermissionForRole(channel: unknown, role: unknown, commandId: string): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.getChannelPermissionForUserRoles} */
  getChannelPermissionForUserRoles(channel: unknown, user: unknown, commandId: string): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.getGuildPermissionForMember} */
  getGuildPermissionForMember(guild: unknown, memberId: string, commandId: string): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.getGuildPermissionForRole} */
  getGuildPermissionForRole(guild: unknown, role: unknown, commandId: string): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.removeGuildPermissions} */
  removeGuildPermissions(guildId: string): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.removeChannelPermissions} */
  removeChannelPermissions(channelId: string): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.permissionsForGuild} */
  permissionsForGuild(guild: unknown): Promise<unknown>;
  /** @deprecated use {@link Database.permissions.permissionsForChannel} */
  permissionsForChannel(channel: unknown): Promise<unknown>;
}

export type {
  BlacklistRepository,
  BuildRepository,
  ChannelSettingsRepository,
  CustomCommandRepository,
  DynamicVoiceRepository,
  GuildRepository,
  NotificationsRepository,
  PermissionsRepository,
  PrivateRoomRepository,
  PromocodeRepository,
  RatioRepository,
  StatisticsRepository,
  StreamRepository,
  TrackingRepository,
  WelcomeRepository,
};
