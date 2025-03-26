import { Events } from 'discord.js';

import Handler from '../models/BaseEventHandler.js';
import { games, getRandomWelcome, isVulgarCheck } from '../utilities/CommonFunctions.js';

export default class WelcomeHandler extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'handlers.welcome', Events.GuildMemberAdd);
  }

  /**
   * Run the handle
   * @param {Discord.GuildMember} member guildMember to welcome
   */
  async execute(...[member]) {
    if (!games.includes('LOGGING')) return;

    this.logger.debug(`Running ${this.id} for ${this.event}`);
    this.logger.debug(`Handling 'guildMemberAdd' for ${member.id} on ${member.guild.name}`);

    const isVulgar = isVulgarCheck.test(member.displayName) || isVulgarCheck.test(member.user.username);
    if (!isVulgar) {
      const welcomes = await this.settings.getWelcomes(member.guild);
      welcomes.forEach((welcome) => {
        if (welcome.message.trim() === 'random') {
          welcome.message = getRandomWelcome(); // eslint-disable-line no-param-reassign
        }
        const content = welcome.message
          .replace(/\$username/gi, member.displayName)
          .replace(/\$usermention/gi, member)
          .replace(/\$timestamp/gi, new Date().toLocaleString());
        if (welcome.isDm === '1') {
          member.send({ content });
        } else {
          welcome.channel.send({ content });
        }
      });
    }
  }
}
