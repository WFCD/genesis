'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const rpad = require('right-pad');

/**
 * Generates enemy embeds
 */
class RolesEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Role>} roles - The array of roles allowed to be used
   * @param {string} prefix - prefix for the command
   * @param {number} longest - length of longest name so that all are aligned
   */
  constructor(bot, roles, prefix, longest) {
    super();
    this.title = 'Joinable Roles';
    this.type = 'rich';
    this.color = 0x779ECB;
    this.fields = [
      {
        name: '_ _',
        value: roles.length ? `${roles.map(role => `\`${rpad(role.name, Number(longest + 2), ' ')}${rpad(String(role.members.size), 4, ' ')} members\``).join(' \n')}` : 'No joinable Roles',
      },
      {
        name: '_ _',
        value: roles.length ? `**Use the \`${prefix}join\` command to join a role**` : `Use the \`${prefix}add role <role>\` command to make a role joinable.`,
      },
    ];
  }
}

module.exports = RolesEmbed;
