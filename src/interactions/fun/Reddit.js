'use strict';

const fetch = require('../../resources/Fetcher');
const Embed = require('../../embeds/BaseEmbed');

module.exports = class Reddit extends require('../../models/Interaction') {
    static enabled = false;
    static subreddit = 'funny'
    static command = {
        name: 'all',
        description: 'Get something from funny',
    };

    static async commandHandler(interaction, ctx) {
        await interaction.deferReply({ ephemeral: ctx.ephemerate });
        const base = `https://reddit.com/r/${this.subreddit}/random/.json`;
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
