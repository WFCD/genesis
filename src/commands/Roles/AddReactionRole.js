'use strict';

const Command = require('../../models/Command.js');

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
  /* eslint-disable no-unused-vars */
  async run(message, {
    args: {
      create, mentionable, leaveable, tuples, requires,
    },
  }) {
    return this.messageManager.statuses.FAILURE;
  }
  /* eslint-enable no-unused-vars */
}

module.exports = AddRole;
