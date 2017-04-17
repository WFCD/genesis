'use strict';

const Command = require('../../Command.js');
const SortieEmbed = require('../../embeds/SortieEmbed.js');
const Wikia = require('node-wikia');

const warframe = new Wikia('warframe');


/**
 * Displays the currently active Invasions
 */
class Sorties extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.sorties', 'sortie', 'Display the currently active sorties');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.worldStates[platform].getData())
      .then((ws) => {
        const sortie = ws.sortie;
        if (sortie.isExpired()) {
          this.messageManager.sendMessage(message, 'There is currently no sortie', true, true);
        }
        const embed = new SortieEmbed(this.bot, sortie);
        return warframe.getSearchList({
          query: sortie.boss,
          limit: 1,
        }).then(articles => warframe.getArticleDetails({
          ids: articles.items.map(i => i.id),
        })).then((details) => {
          const item = Object.values(details.items)[0];
          const thumb = item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : undefined;
          if (thumb) {
            embed.thumbnail.url = thumb;
          }
          this.messageManager.embed(message, embed, true, false);
        })
        .catch(() => this.messageManager.embed(message, embed, true, false));
      })
      .catch(this.logger.error);
  }
}

module.exports = Sorties;
