import Embed from '#shared/embeds/BaseEmbed';
import { withEphemeral } from '#shared/utilities/CommonFunctions';
import { fetchRandomSubredditPost, resolvePostImageUrl } from '#shared/utilities/RedditClient';

import Interaction from '../../models/Interaction';

export default class Reddit extends Interaction {
  static enabled = false;

  static subreddit = 'funny';

  /** Prefer posts with embeddable images (fashion / memes). */
  static imageOnly = true;

  static command = {
    name: 'all',
    description: 'Get something from funny',
  };

  static async commandHandler(interaction, ctx) {
    await interaction.deferReply(withEphemeral(ctx.ephemerate));

    try {
      const post = await fetchRandomSubredditPost(this.subreddit, {
        imageOnly: this.imageOnly,
        logger: ctx.logger,
      });

      const { selftext, permalink, title, subreddit_name_prefixed: srn, created_utc: ts } = post;
      const imageUrl = resolvePostImageUrl(post);

      const embed = new Embed();
      embed.setDescription(selftext ?? '');
      embed.setTitle(title.replaceAll('&amp;', '&'));
      embed.setURL(`https://www.reddit.com${permalink}`);
      if (imageUrl) embed.setImage(imageUrl);
      embed.setFooter({ text: `${srn ?? `r/${this.subreddit}`} • Posted` });
      if (ts) embed.setTimestamp(Number(ts) * 1000);

      return interaction.editReply({ embeds: [embed] });
    } catch (e) {
      ctx.logger?.error(e, 'Reddit');
      return interaction.editReply(
        withEphemeral(ctx.ephemerate, {
          content: `Could not load a post from **r/${this.subreddit}** right now. Reddit may be blocking the request — try again later.`,
        })
      );
    }
  }
}
