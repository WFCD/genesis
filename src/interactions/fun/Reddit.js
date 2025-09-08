import { getPost } from 'random-reddit';

import Embed from '../../embeds/BaseEmbed.js';
import Interaction from '../../models/Interaction.js';

export default class Reddit extends Interaction {
  static enabled = false;
  static subreddit = 'funny';
  static command = {
    name: 'all',
    description: 'Get something from funny',
  };

  static async commandHandler(interaction, ctx) {
    await interaction.deferReply({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
    const post = await getPost(this.subreddit);
    const { selftext, permalink, thumbnail: url, title, subreddit_name_prefixed: srn, created_utc: ts } = post;
    const embed = new Embed();
    embed.setDescription(selftext ?? '');
    embed.setTitle(title.replaceAll('&amp;', '&'));
    embed.setURL(`https://reddit.com${permalink}`);
    embed.setImage(url);

    if (post.is_gallery) {
      embed.setImage(post.media_metadata[post.gallery_data.items[0].media_id].s.u.replaceAll('&amp;', '&'));
    } else {
      embed.setImage(post.preview.images[0].source.url.replace('&amp;', '&'));
    }
    embed.setFooter({
      text: `${srn} • Posted`,
    });
    embed.setTimestamp(ts * 1000);

    await interaction.editReply({ embeds: [embed] });
  }
}
