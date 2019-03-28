'use strict';

const dehumanize = require('parse-duration');
const Command = require('../../models/Command.js');
const LFGEmbed = require('../../embeds/LFGEmbed');

/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class AddLFG extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'lfg.add', 'lfg', 'Submit an LFG request.');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');

    this.usages = [
      {
        description: 'Submit an LFG request to this guild\'s LFG channel.',
        parameters: [
          'place',
          'time',
          'for',
          'platform *',
          'expiry*',
          'members*',
        ],
        separator: ' | ',
      },
    ];

    this.allowDM = false;
  }

  async run(message, ctx) {
    if (ctx.lfg && Object.keys(ctx.lfg).length) {
      const matches = message.strippedContent.match(this.regex)[1];
      const params = (matches || '').split('|');

      const lfg = {
        author: message.author,
        location: (params[0] || 'Anywhere').trim(),
        duration: (params[1] || 'Any Time').trim(),
        goal: (params[2] || 'Anything').trim(),
        platform: (params[3] || ctx.platform).trim().toLowerCase(),
        expiry: params[4] || '30m',
        membersNeeded: params[5] || 4,
        members: [message.author.id],
        vc: message.member.voice,
      };

      // save params based on order
      const embed = new LFGEmbed(this.bot, lfg);
      try {
        const msg = await this.messageManager
          .embedToChannel(ctx.lfg[lfg.platform] || ctx.lfg[Object.keys(ctx.lfg)[0]], embed);
        msg.delete({ timeout: dehumanize(lfg.expiry) });
        msg.react('🔰');
        
      const collector = msg.createReactionCollector((reaction, user) => 
        (reaction.emoji.name === '🔰') && user.id !== msg.guild.me.id,
        { time: dehumanize(lfg.expiry), dispose: true });
      
      collector.on('end', () => {
         msg.reactions.removeAll();
      });
      
      collector.on('collect', (reaction, user) => {
        if (!lfg.members.includes(user.id) && lfg.members.length <= lfg.membersNeeded) {
          lfg.members.push(user.id);
          lfg.vc = message.member.voice;
          msg.edit({ embed: new LFGEmbed(this.bot, lfg) });
        }
        if (user.id === message.author.id) {
          try {
            reaction.users.remove(message.author.id);
          } catch (e) {
            this.logger.debug(e);
          }
        }
      });
      
      collector.on('remove', (reaction, user) => {
        if (lfg.members.includes(user.id) && user.id !== message.author.id) {
          lfg.members.splice(lfg.members.indexOf(user.id), 1);
          lfg.vc = message.member.voice;
          msg.edit({ embed: new LFGEmbed(this.bot, lfg) });
        }
      });
        
        return this.messageManager.statuses.SUCCESS;
      } catch (e) {
        this.logger.error(e);
        await this.messageManager.reply(message, `something failed in sending. You sent: ${params.join(', ')}`);
        return this.messageManager.statuses.FAILURE;
      }
    }
    await this.messageManager.reply(message, `please ask your admin to designate a setting for  \`${ctx.prefix}set lfg channel\``);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = AddLFG;
