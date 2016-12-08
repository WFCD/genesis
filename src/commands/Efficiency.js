'use strict';

const Command = require('../Command.js');
const md = require('node-md-config');

/**
 * Describes the Armor command
 */
class Efficiency extends Command {
  /**
   * Constructs a callable command
   * @param  {Logger}           logger                The logger object
   * @param  {string}           [options.prefix]      Prefix for calling the bot
   * @param  {string}           [options.regexPrefix] Escaped prefix for regex for the command
   * @param  {MarkdownSettings} [options.mdConfig]    The markdown settings
   */
  // eslint-disable-next-line no-useless-escape
  constructor(logger, { mdConfig = md, regexPrefix = '\/', prefix = '/' } = {}) {
    super(logger, { mdConfig, regexPrefix, prefix });
    this.commandId = 'misc.efficiency';
    // eslint-disable-next-line no-useless-escape
    this.commandRegex = new RegExp(`^${regexPrefix}efficiency ?chart`, 'i');
    this.commandHelp = `${prefix}efficiency      | Duration/Efficiency Balance Chart`;
    this.efficiencyChart = '../resources/efficiency.png';

    /**
     * Whether or not this command is able to be blacklisted.
     * @type {boolean}
     */
    this.blacklistable = true;

    /**
     * Specifies whether or not this command requires authorization
     *    from a user with manage_permissions
     * @type {Boolean}
     */
    this.requiresAuth = false;

    /**
     * Specifies whther or not this command requires the caller to be the bot owner.
     * @type {Boolean}
     */
    this.ownerOnly = false;
  }

  run(message) {
    message.channel.sendFile(this.efficiencyChart, 'Efficiency.png',
                             `Operator ${message.author.toString()}, the Duration Efficiency Balance chart, as requested.`);
  }
}

module.exports = Efficiency;
