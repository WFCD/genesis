'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class RolesEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Array.<Role>>} roleGroups - An array of an array of roles allowed to be used
   * @param {string} prefix - prefix for the command
   * @param {number} longest - length of longest name so that all are aligned
   */
  constructor(bot, roleGroups, prefix, longest) {
    super(bot);
    this.title = 'Joinable Roles';
    this.type = 'rich';
    this.color = 0x779ECB;
    this.fields = [];
    roleGroups.forEach((roleGroup) => {
      this.fields.push({
        name: '\u200B',
        value: `\`\`\`${roleGroup.map(role => `${role.guildRole.name.padEnd(Number(longest + 2), '\u2003')}${String(role.guildRole.members.size).padEnd(4, '\u2003')} members`).join(' \n')}\`\`\``,
      });
    });

    if (roleGroups.length === 0) {
      this.fields.push({ name: '\u200B', value: 'No joinable Roles' });
    }

    this.fields.push({
      name: '\u200B',
      value: roleGroups.length ? `**Use the \`${prefix}join\` command to join a role**` : `Use the \`${prefix}add role <role>\` command to make a role joinable.`,
    });
  }
}

module.exports = RolesEmbed;
