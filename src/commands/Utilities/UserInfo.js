'use strict';

const Command = require('../../models/Command');
const UserInfoEmbed = require('../../embeds/UserInfoEmbed');

/**
 * Get info about a user
 */
class UserInfo extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'util.userinfo', 'userinfo', 'Get info about a user', 'UTIL');
    this.regex = new RegExp(`^${this.call}\\s*(?:(?:<@)(\\d+)(?:>))?`);
  }

  async run(message) {
    const params = message.strippedContent.match(this.regex);
    let user;
    let member;
    let mention;
    if (message.mentions.users) {
      const { a, b } = message.mentions.users.array();
      if (message.mentions.users.array().length > 1
        && message.mentions.users.array()[0].id === this.bot.client.id) {
        mention = b;
      } else {
        mention = a;
      }
    }

    if (params[1] || mention) {
      user = mention || this.bot.client.users.cache.get(params[1].trim());
    } else {
      user = message.author;
    }
    if (user && message.guild) {
      member = message.guild.members.cache.get(user.id);
    }
    if (!user) {
      this.messageManager.reply(message, 'can\'t find that user. Please specify another.', false, false);
      return this.messageManager.statuses.FAILURE;
    }

    const guildsWithUser = this.bot.client.guilds.cache
      .filter(guild => guild.members.cache.get(user.id));

    const guilds = guildsWithUser.length > 25
      ? guildsWithUser.splice(0, 24)
      : guildsWithUser;
    const embed = new UserInfoEmbed(this.bot, guilds, user, member, message);
    this.messageManager.embed(message, embed, true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = UserInfo;
