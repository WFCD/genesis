import BaseEmbed from './BaseEmbed.js';

export default class TwitchEmbed extends BaseEmbed {
  constructor(streamData, { i18n, locale }) {
    super(locale);
    this.setTitle(streamData.title);
    this.setURL(`https://www.twitch.tv/${streamData.user_login}`);

    this.setImage(`${streamData.thumbnail_url.replace('{width}', '1280').replace('{height}', '720')}?${Date.now()}`);

    this.setColor(6570405);
    this.setFooter({
      text: i18n`Live @`,
      icon_url: 'https://i.imgur.com/urcKWLO.png',
    });

    if (streamData.user) {
      this.setAuthor({
        name: streamData.user.display_name,
        icon_url: streamData.user.profile_image_url,
      });

      this.setDescription(streamData.user.description);
    }

    if (streamData.game) {
      this.setThumbnail(streamData.game.box_art_url.replace('{width}', '288').replace('{height}', '384'));
    }
  }
}
