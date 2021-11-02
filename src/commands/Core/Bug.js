'use strict';

const Command = require('../../models/Command.js');

/**
 * Send a bug report to owner
 */
class BugReport extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.bug', 'bug', 'Send a bug report to the bot owner', 'BOT_MGMT');
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
    this.usages = [
      {
        description: 'Send a bug report to bot owner',
        parameters: ['bug report'],
      },
      {
        description: 'Send a bug report to bot owner with subject, message, and optional screenshot. The `|` are important.',
        parameters: ['subject', 'body', '* screenshot'],
        separator: ' | ',
      },
      {
        description: 'Send a bug report to bot owner with subject, message, and optional screenshot. The `|` are important.',
        parameters: ['subject', 'body', 'attached image'],
        separator: ' | ',
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {string} prefix  Prefix to call the bot in this channel with
   * @returns{boolean} success status
   */
  async run(message, { i18n, prefix }) {
    const bugReport = message.strippedContent.match(this.regex)[1];

    if (this.bot.owner) {
      if (bugReport) {
        const params = bugReport.split('|');
        const embed = {
          author: {
            icon_url: message.author.displayAvatarURL().replace('.webp', '.png').replace('.webm', '.gif'),
            name: `${message.author.username}#${message.author.discriminator}`,
          },
          color: 0xf4425f,
          title: 'Bug Report',
          fields: [{
            name: 'Submitter',
            value: message.author.toString(),
          }],
          footer: {
            text: 'Sent',
          },
          timestamp: new Date(),
        };
        if (params.length < 2) {
          embed.description = bugReport;
        } else {
          embed.fields.push({
            name: 'Title',
            value: params[1].trim(),
          });
          embed.fields.push({
            name: 'Body',
            value: params[0].trim(),
          });
          if (params.length > 2) {
            embed.image = {
              url: params[2].trim(),
            };
          }
        }
        if (message.attachments.size > 0) {
          embed.image = {
            url: message.attachments.first().url,
          };
        }
        try {
          this.bot.bugHook.send({ embeds: [embed] });
          await message.reply({ content: i18n`Bug report sent.` });
          return this.messageManager.statuses.SUCCESS;
        } catch (error) {
          this.logger.error(error);
          await message.reply({ content: i18n`Failed to submit bug report` });
          return this.messageManager.statuses.FAILURE;
        }
      }
      const embed = {
        author: {
          icon_url: message.author.displayAvatarURL().replace('.webp', '.png').replace('.webm', '.gif'),
          name: `${message.author.username}#${message.author.discriminator}`,
        },
        title: i18n`Bug Report | ${message.author}`,
        fields: [{ name: '\u200B', value: i18n`Need to provide a bug report, see \`${prefix}help\` for syntax.` }],
        footer: { text: i18n`Add Tobiah#0001 as a friend so he can respond to your bug report` },
      };
      await message.reply({ embeds: [embed] });
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.NO_ACCESS;
  }
}

module.exports = BugReport;
