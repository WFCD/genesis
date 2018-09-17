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
    super(bot, 'core.bug', 'bug', 'Send a bug report to the bot owner');
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
   * @returns{boolean} success status
   */
  async run(message) {
    const bugReport = message.strippedContent.match(this.regex)[1];

    if (this.bot.owner) {
      if (bugReport) {
        const params = bugReport.split('|');
        const embed = {
          author: {
            icon_url: message.author.avatarURL,
            name: `${message.author.username}#${message.author.discriminator}`,
          },
          color: 0xf4425f,
          title: 'Bug Report',
          description: message.author,
          fields: [],
          footer: {
            text: 'Sent • ',
          },
          timestamp: new Date(),
        };

        if (params.length < 2) {
          embed.description += `\n\u200B\n${bugReport}`;
        } else {
          embed.fields[0] = {
            name: params[0].trim(),
            value: params[1].trim(),
          };
          if (params.length > 2) {
            embed.image = {
              url: params[2].trim(),
            };
          } else if (message.attachments.array().length > 0) {
            embed.image = {
              url: message.attachments.array()[0].url,
            };
          }
        }
        this.bot.controlHook.send({ embeds: [embed] });
        this.messageManager.reply(message, 'Bug report sent.', true, true);
        return this.messageManager.statuses.SUCCESS;
      }
      const embed = {
        author: {
          icon_url: message.author.avatarURL,
          name: `${message.author.username}#${message.author.discriminator}`,
        },
        title: `Bug Report | ${message.author}`,
        fields: [{ name: '\u200B', value: 'Need to provide a bug report, see `/help` for syntax.' }],
        footer: { text: 'Add Tobiah#8452 as a friend so he can respond to your bug report' },
      };
      this.messageManager.embed(message, embed, true, false);
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.NO_ACCESS;
  }
}

module.exports = BugReport;
