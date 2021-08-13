'use strict';

const fetch = require('../../resources/Fetcher');
const Embed = require('../../embeds/BaseEmbed');

module.exports = class Reddit extends require('../../models/Interaction') {
  static enabled = false;
  static subreddit = 'memeframe'
  static command = {
    name: 'memeframe',
    description: 'Get a Warframe meme',
  };

  static async commandHandler(interaction) {
    await interaction.deferReply();
    const base = `https://reddit.com/r/${Reddit.subreddit}/random/.json`;
    const {
      permalink, url, title, subreddit_name_prefixed: srn, created_utc: ts,
    } = (await fetch(base))[0].data.children[0].data;
    const embed = new Embed();
    embed.setTitle(title);
    embed.setURL(`https://reddit.com${permalink}`);
    embed.setImage(url);
    embed.setFooter(`${srn} • Posted`, 'https://www.redditinc.com/assets/images/site/reddit-logo.png');
    embed.setTimestamp(ts * 1000);

    await interaction.editReply({ embeds: [embed] });
  }
};
