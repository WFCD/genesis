import type { Guild, Role } from 'discord.js';

/** Guild role joinable via private-room settings. */
export default class JoinableRole {
  id: string;

  guild: Guild;

  leaveable: boolean;

  guildRole: Role;

  requiredRoleId?: string;

  constructor(guildRole: Role) {
    this.id = guildRole.id;
    this.guild = guildRole.guild;
    this.leaveable = true;
    this.guildRole = guildRole;
  }

  get requiredRole(): string | undefined {
    if (
      this.guild?.roles.cache.has(this.id) &&
      this.requiredRoleId &&
      this.guild.roles.cache.has(this.requiredRoleId)
    ) {
      return this.requiredRoleId;
    }
    return undefined;
  }

  set requiredRole(role: Role | undefined) {
    if (role && this.guild?.roles.cache.has(role.id) && this.guild.roles.cache.has(this.id)) {
      this.requiredRoleId = role.id;
    }
  }

  get isLeaveable() {
    return this.leaveable;
  }

  set isLeaveable(isLeaveable: boolean | undefined) {
    if (typeof isLeaveable !== 'undefined') {
      this.leaveable = isLeaveable;
    }
  }

  getSimple() {
    return {
      id: this.id,
      requiredRole: this.requiredRoleId,
      leaveable: this.isLeaveable,
    };
  }
}
