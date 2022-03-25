/**
 * Add a joinable role
 */
export default class JoinableRole {
  constructor(guildRole) {
    this.id = guildRole.id;
    this.guild = guildRole.guild;
    this.isLeaveable = true;
    this.leaveable = true;
    this.guildRole = guildRole;
  }

  get requiredRole() {
    if (this.guild && this.guild.roles.cache.has(this.id)
      && this.guild.roles.cache.has(this.requiredRoleId)) {
      return this.requiredRoleId;
    }
    return undefined;
  }

  set requiredRole(role) {
    if (role && this.guild && this.guild.roles.cache.has(role.id)
      && this.guild.roles.cache.has(this.id)) {
      this.requiredRoleId = role.id;
    }
  }

  get isLeaveable() {
    return this.leaveable;
  }

  set isLeaveable(isLeaveable) {
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
