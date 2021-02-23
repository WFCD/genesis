'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates a twitch go-live embed
 */
class TwitchEmbed extends BaseEmbed {
  /**
   * @param {Object} streamData - a stream result from twitch api
   */
  constructor(streamData) {
    super();
    this.title = streamData.title;
    this.url = `https://www.twitch.tv/${streamData.user_login}`;

    this.image = {
      url: streamData.thumbnail_url
        .replace('{width}', '1280')
        .replace('{height}', '720'),
    };

    this.color = 6570405;
    this.footer = {
      text: 'Live @',
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
}

module.exports = TwitchEmbed;
