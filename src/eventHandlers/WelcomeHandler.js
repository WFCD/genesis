'use strict';

const { Events } = require('discord.js').Constants;

const Handler = require('../models/BaseEventHandler');
const { isVulgarCheck, getRandomWelcome, games } = require('../CommonFunctions');

class WelcomeHandler extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.welcome', Events.GUILD_MEMBER_ADD);
  }

  /**
   * Run the handle
   * @param {GuildMember} member guildMember to welcome
   */
  async execute(...[member]) {
    if (!games.includes('LOGGING')) return;

    this.logger.debug(`Running ${this.id} for ${this.event}`);
    this.logger.debug(`Handling 'guildMemberAdd' for ${member.id} on ${member.guild.name}`);

    const isVulgar = isVulgarCheck.test(member.displayName)
      || isVulgarCheck.test(member.user.username);
    if (!isVulgar) {
      const welcomes = await this.settings.getWelcomes(member.guild);
      welcomes.forEach((welcome) => {
        if (welcome.message.trim() === 'random') {
          welcome.message = getRandomWelcome(); // eslint-disable-line no-param-reassign
        }
        const content = welcome.message
          .replace(/\$username/ig, member.displayName)
          .replace(/\$usermention/ig, member)
          .replace(/\$timestamp/ig, new Date().toLocaleString());
        if (welcome.isDm === '1') {
          member.send({ content });
        } else {
          welcome.channel.send({ content });
        }
      });
    }
  }
}

module.exports = WelcomeHandler;
