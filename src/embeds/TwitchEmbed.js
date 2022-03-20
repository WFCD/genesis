'use strict';

const BaseEmbed = require('./BaseEmbed.js');

module.exports = class TwitchEmbed extends BaseEmbed {
  constructor(streamData, { i18n, locale }) {
    super(locale);
    this.title = streamData.title;
    this.url = `https://www.twitch.tv/${streamData.user_login}`;

    this.image = {
      url: `${streamData.thumbnail_url
        .replace('{width}', '1280')
        .replace('{height}', '720')}?${Date.now()}`,
    };

    this.color = 6570405;
    this.footer = {
      text: i18n`Live @`,
      icon_url: 'https://i.imgur.com/urcKWLO.png',
    };

    if (streamData.user) {
      this.author = {
        name: streamData.user.display_name,
        icon_url: streamData.user.profile_image_url,
      };

      this.description = streamData.user.description;
    }

    if (streamData.game) {
      this.thumbnail = {
        url: streamData.game.box_art_url
          .replace('{width}', '288')
          .replace('{height}', '384'),
      };
    }
  }
};
