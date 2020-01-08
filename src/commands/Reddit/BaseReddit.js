'use strict';

const Command = require('../../models/Command');
const fetch = require('../../resources/Fetcher');
const Embed = require('../../embeds/BaseEmbed');

/**
 * Displays a random post from a subreddit
 */
class BaseReddit extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   * @param {string} [id='reddit.base']          command id
   * @param {string} [call='reddit']             command call
   * @param {string} [desc='Generates a random meme from r/warframememes'] Command description
   * @param {string} [flag='REDDIT']             feature flag
   * @param {string} [subreddit='warframememes'] subreddit to fetch
   */
  constructor(bot, id = 'reddit.base', call = 'reddit', desc = 'Generates a random meme from r/warframememes', flag = 'REDDIT', subreddit = 'warframememes') {
    super(bot, id, call, desc, flag);

    this.subreddit = subreddit || 'warframememes';
    this.enabled = false;
  }

  async run(message) {
    const { permalink, url, title } = (await fetch(`https://www.reddit.com/r/${this.subreddit}/random/.json`))[0].data.children[0].data;
    const embed = new Embed();
    embed.setTitle(title);
    embed.setURL(`https://reddit.com${permalink}`);
    embed.setImage(url);

    await message.channel.send(embed);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = BaseReddit;
