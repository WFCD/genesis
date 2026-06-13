import type { Guild } from 'discord.js';

import type Database from '#shared/settings/Database';
import { hasGuildAdminPermission } from '#shared/utilities/discordPermissions';

export type AuthzAction =
  | 'general'
  | 'tracking'
  | 'pings'
  | 'rooms'
  | 'permissions'
  | 'elevated_roles'
  | 'custom_commands'
  | 'statistics'
  | 'welcome';

export type AuthzUser = {
  id: string;
  guilds?: Array<{ id: string; permissions?: string }>;
  memberRoles?: string[];
};

export default class AuthzService {
  constructor(private readonly settings: Database) {}

  hasManageGuild(user: AuthzUser, guildId: string) {
    const guild = user.guilds?.find((entry) => entry.id === guildId);
    return hasGuildAdminPermission(guild?.permissions);
  }

  async getElevatedRoleIds(guildId: string) {
    const raw = await this.settings.channels.getGuildSetting({ id: guildId } as unknown as Guild, 'elevatedRoles');
    return String(raw || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  async getModRoleId(guildId: string) {
    return this.settings.channels.getGuildSetting({ id: guildId } as unknown as Guild, 'modRole');
  }

  hasElevatedRole(user: AuthzUser, elevatedRoleIds: string[]) {
    if (!elevatedRoleIds.length || !user.memberRoles?.length) return false;
    return user.memberRoles.some((roleId) => elevatedRoleIds.includes(roleId));
  }

  async hasModRole(user: AuthzUser, guildId: string) {
    const modRole = await this.getModRoleId(guildId);
    if (!modRole || modRole === '0') return false;
    return user.memberRoles?.includes(String(modRole)) ?? false;
  }

  async canManage(user: AuthzUser, guildId: string, action: AuthzAction) {
    if (this.hasManageGuild(user, guildId)) return true;

    const elevated = await this.getElevatedRoleIds(guildId);
    const elevatedAccess = this.hasElevatedRole(user, elevated);

    switch (action) {
      case 'rooms':
        return elevatedAccess || (await this.hasModRole(user, guildId));
      case 'tracking':
      case 'pings':
      case 'custom_commands':
      case 'statistics':
        return elevatedAccess;
      case 'general':
      case 'permissions':
      case 'elevated_roles':
      case 'welcome':
      default:
        return false;
    }
  }
}
