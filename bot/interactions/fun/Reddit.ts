import { getPost } from 'random-reddit';

import Embed from '#shared/embeds/BaseEmbed';
import { withEphemeral } from '#shared/utilities/CommonFunctions';

import Interaction from '../../models/Interaction';

export default class Reddit extends Interaction {
  static enabled = false;
  static subreddit = 'funny';
  static command = {
    name: 'all',
    description: 'Get something from funny',
  };

  static async commandHandler(interaction, ctx) {
    await interaction.deferReply(withEphemeral(ctx.ephemerate));
    const post = await getPost(this.subreddit);
    const { selftext, permalink, thumbnail: url, title, subreddit_name_prefixed: srn, created_utc: ts } = post;
    const embed = new Embed();
    embed.setDescription(selftext ?? '');
    embed.setTitle(title.replaceAll('&amp;', '&'));
    embed.setURL(`https://reddit.com${permalink}`);
    embed.setImage(url);

    if ((post as { is_gallery?: boolean }).is_gallery) {
      const galleryPost = post as unknown as {
        media_metadata: Record<string, { s: { u: string } }>;
        gallery_data: { items: Array<{ media_id: string }> };
      };
      embed.setImage(
        galleryPost.media_metadata[galleryPost.gallery_data.items[0].media_id].s.u.replaceAll('&amp;', '&')
      );
    } else {
      embed.setImage(post.preview.images[0].source.url.replace('&amp;', '&'));
    }
    embed.setFooter({
      text: `${srn} • Posted`,
    });
    embed.setTimestamp(Number(ts) * 1000);

    await interaction.editReply({ embeds: [embed] });
  }
}
