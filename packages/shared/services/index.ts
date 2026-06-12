import type { Guild } from 'discord.js';

import type Database from '#shared/settings/Database';

import AuthzService from './AuthzService';
import ChannelSettingsService from './ChannelSettingsService';
import PingSettingsService from './PingSettingsService';
import RoomSettingsService from './RoomSettingsService';
import TrackingSettingsService from './TrackingSettingsService';

type GuildRef = { id: string };
type ChannelRef = { id: string; guild?: GuildRef };
type MessageRef = { guild: GuildRef; channel: ChannelRef };

const asGuild = (guild: GuildRef) => guild as unknown as Guild;

export { default as AuthzService } from './AuthzService';
export { default as ChannelSettingsService } from './ChannelSettingsService';
export { default as TrackingSettingsService } from './TrackingSettingsService';
export { default as PingSettingsService } from './PingSettingsService';
export { default as RoomSettingsService } from './RoomSettingsService';

export class PermissionSettingsService {
  constructor(private readonly settings: Database) {}

  async setChannelRolePermission(channel: ChannelRef, roleId: string, commandId: string, allowed: boolean) {
    return this.settings.permissions.setChannelPermissionForRole(channel, { id: roleId }, commandId, allowed);
  }

  async setGuildRolePermission(guild: GuildRef, roleId: string, commandId: string, allowed: boolean) {
    return this.settings.permissions.setGuildPermissionForRole(asGuild(guild), { id: roleId }, commandId, allowed);
  }
}

export class CustomCommandSettingsService {
  constructor(private readonly settings: Database) {}

  list(guildId: string) {
    return this.settings.customCommands.getRawCustomCommands(guildId);
  }

  add(guild: GuildRef, call: string, response: string, creatorId: string, ephemeral = false) {
    return this.settings.customCommands.addCustomCommand(guild, call, response, creatorId, ephemeral);
  }

  remove(guild: GuildRef, call: string) {
    return this.settings.customCommands.deleteCustomCommand(guild, call);
  }
}

export class WelcomeSettingsService {
  constructor(private readonly settings: Database) {}

  list(guild: GuildRef) {
    return this.settings.welcome.getWelcomes(guild);
  }

  set(message: MessageRef, isDm: boolean, text: string) {
    return this.settings.welcome.setWelcome(message, isDm, text);
  }

  clear(guild: GuildRef, isDm: boolean) {
    return this.settings.welcome.clearWelcomeForGuild(guild, isDm);
  }
}

export class GuildSettingsService {
  constructor(private readonly settings: Database) {}

  getElevatedRoles(guild: GuildRef) {
    return this.settings.channels.getGuildSetting(asGuild(guild), 'elevatedRoles');
  }

  setElevatedRoles(guild: GuildRef, roleIds: string[]) {
    return this.settings.channels.setGuildSetting(asGuild(guild), 'elevatedRoles', roleIds.join(','));
  }
}

export class StatisticsService {
  constructor(private readonly settings: Database) {}

  getGuildCommandStats(guild: GuildRef, limit = 10) {
    return this.settings.statistics.getGuildStats(guild).then((rows) => rows.slice(0, limit));
  }
}

export function createServices(settings: Database) {
  return {
    authz: new AuthzService(settings),
    channels: new ChannelSettingsService(settings),
    tracking: new TrackingSettingsService(settings),
    pings: new PingSettingsService(settings),
    rooms: new RoomSettingsService(settings),
    permissions: new PermissionSettingsService(settings),
    customCommands: new CustomCommandSettingsService(settings),
    welcome: new WelcomeSettingsService(settings),
    guild: new GuildSettingsService(settings),
    statistics: new StatisticsService(settings),
  };
}

export type Services = ReturnType<typeof createServices>;
