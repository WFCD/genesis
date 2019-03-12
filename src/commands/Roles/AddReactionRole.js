'use strict';

const Command = require('../../models/Command.js');

/**
 * Get a role from the matching string
 * @param  {string} string      String to use to search for role
 * @param  {Message} message    originating message
 * @returns {Role|null}         Role
 */
function getRoleForString(string, message) {
  const trimmedString = string.trim();
  const roleFromId = message.guild.roles.get(trimmedString);
  let roleFromName;
  if (typeof roleFromId === 'undefined') {
    roleFromName = message.guild.roles
      .find(item => item.name.toLowerCase() === trimmedString.toLowerCase());
  }
  return roleFromId || roleFromName || null;
}

const leaveableRegex = new RegExp('--leaveable (on|off)', 'ig');
const reqRoleRegex = new RegExp('--requires (?:<@&)?(\\d{15,20})(>)?', 'ig');

/**
 * Add a joinable role
 */
class AddRole extends Command {
  constructor(bot) {
    super(bot, 'settings.reactions.addRole', 'radd');
    this.usages = [
      { description: 'Show instructions for adding reaction role', parameters: [] },
      { description: 'Add a role with an emote', parameters: ['Role/Role id to add', '--create', '--mentionable', '--leavable (on | off)', '--requires @Role Mention'] },
    ];
    this.regex = new RegExp(`^${this.call}\\s?(.*)?\\s?(--create)?\\s?(--mentionable)?`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  parseArgs(content) {
    const tuples = content.replace(`${this.call} `, '')
      .replace('--create', '')
      .replace('--mentionable', '')
      .replace('--remove', '')
      .replace(leaveableRegex, '')
      .replace(reqRoleRegex, '')
      .trim()
      .split(',')
      .map((inst) => {
        const tokens = inst.split(' ');
        return {
          emoji: tokens[0],
          roleDisp: tokens.splice(1).join(' '),
        };
      });

    return {
      create: /--create/ig.test(content),
      mentionable: /--mentionable/ig.test(content),
      leaveable: (content.match(leaveableRegex)[0] || '').trim() === 'on',
      tuples,
      action: /--remove/ig.test(content) ? 'remove' : 'add',
    };
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Context} ctx    Command & Channel context
   * @param {Object} ctx.args Arguments to the command
   * @returns {string} success status
   */
  async run(message, {
    args: {
      create, mentionable, leaveable, tuples, requires,
    },
  }) {
    if (!tuples.length) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    let stop = false;
    tuples.forEach(async ({ emoji, roleDisp }) => {
      if (stop) { return; }
      let role = getRoleForString(roleDisp, message);
      if (create && message.guild.me.hasPermission('MANAGE_ROLES')) {
        role = await message.guild.roles.create({
          name: roleDisp,
          permissions: 0,
          mentionable,
        }, 'Add Reaction Role Command with create flag');
      } else if (!role) {
        stop = true;
      }

      // check if the role is already added
      // throw a message if it doesn't
    });
    if (stop) {
      await this.sendInstructionEmbed(message);
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.SUCCESS;
  }

  async addAndCommitRole(message, roles, newRole) {
    await this.settings.setRolesForGuild(
      message.guild,
      roles.map(role => JSON.stringify(role)),
    );
    await this.messageManager.embed(message, {
      title: 'Added role to joinable list',
      type: 'rich',
      color: 0x779ECB,
      description: newRole,
    }, true, true);
  }

  async sendAlreadyAddedEmbed(message) {
    await this.messageManager.embed(message, {
      title: 'Invalid Role',
      type: 'rich',
      color: 0x779ECB,
      description: 'That role is already joinable.',
    }, true, true);
  }

  async sendInstructionEmbed(message) {
    const prefix = await this.settings.getGuildSetting(message.guild, 'prefix');
    this.messageManager.embed(message, {
      title: 'Usage',
      type: 'rich',
      color: 0x779ECB,
      fields: [
        {
          name: `${prefix}${this.call} <role or role id>`,
          value: 'Role or role id to be allowed for self-role.',
        },
        {
          name: 'Possible values:',
          value: '\u200B',
        },
        {
          name: '**Roles:**',
          value: message.guild.roles.map(r => r.name).join('; '),
          inline: true,
        },
      ],
    }, true, true);
  }
}

module.exports = AddRole;
