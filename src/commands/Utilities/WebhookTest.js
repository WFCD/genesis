'use strict';

const Command = require('../../Command');
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
    super(bot, 'util.userinfowebhook', 'userinfoWebhook', 'Get info about a user');
    this.regex = new RegExp(`^${this.call}\\s*((?:\\<\\@?\\!?)?\\d+(?:\\>)?)?`, 'i');
  }

  async run(message, ctx) {
    const params = message.strippedContent.match(this.regex);
    let user;
    let member;
    let mention;
    if (message.mentions.users) {
      if (message.mentions.users.array().length > 1
        && message.mentions.users.array()[0].id === this.bot.client.id) {
        mention = message.mentions.users.array()[1];
      } else {
        mention = message.mentions.users.array()[0];
      }
    }

    if (params[1] || mention) {
      user = mention || this.bot.client.users.get(params[1].trim());
    } else {
      user = message.author;
    }
    if (user && message.guild) {
      member = message.guild.members.get(user.id);
    }
    if (!user) {
      this.messageManager.reply(message, 'can\'t find that user. Please specify another.', false, false);
      return this.messageManager.statuses.FAILURE;
    }

    const guildsWithUser = this.bot.client.guilds.array()
      .filter(guild => guild.members.get(user.id));

    const guilds = guildsWithUser.length > 25 ?
      guildsWithUser.splice(0, 24) :
      guildsWithUser;
    const embed = new UserInfoEmbed(this.bot, guilds, user, member, message);
    await this.messageManager.webhook(ctx, { embed: this.messageManager.webhookWrapEmbed(embed) });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = UserInfo;
