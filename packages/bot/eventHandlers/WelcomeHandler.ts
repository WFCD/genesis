import { Events } from 'discord.js';

import { games, getRandomWelcome, isVulgarCheck } from '#shared/utilities/CommonFunctions';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';

export default class WelcomeHandler extends Handler {
  constructor(bot: Genesis) {
    super(bot, 'handlers.welcome', Events.GuildMemberAdd);
  }

  async execute(...[member]) {
    if (!games.includes('LOGGING')) return;

    this.logger.debug(`Running ${this.id} for ${this.event}`);
    this.logger.debug(`Handling 'guildMemberAdd' for ${member.id} on ${member.guild.name}`);

    const isVulgar = isVulgarCheck.test(member.displayName) || isVulgarCheck.test(member.user.username);
    if (!isVulgar) {
      const welcomes = await this.settings.welcome.getWelcomes(member.guild);
      welcomes.forEach((welcome) => {
        if (welcome.message.trim() === 'random') {
          welcome.message = getRandomWelcome();
        }
        const content = welcome.message
          .replace(/\$username/gi, member.displayName)
          .replace(/\$usermention/gi, member)
          .replace(/\$timestamp/gi, new Date().toLocaleString());
        if (welcome.isDm) {
          member.send({ content });
        } else if (welcome.channel && 'send' in welcome.channel) {
          welcome.channel.send({ content });
        }
      });
    }
  }
}
