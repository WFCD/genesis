'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates a twitch go-live embed
 */
class TwitchEmbed extends BaseEmbed {
  /**
   * @param {Object} streamData - a stream result from twitch api
   * @param {Object} userData   - a user result from twitch api
   */
  constructor(streamData, userData) {
    super();
    this.title = streamData.title;
    if (userData) {
      this.author = {
        name: userData.display_name,
        icon_url: userData.profile_image_url,
      };
      this.image = {
        url: streamData.thumbnail_url.replace('{width}', '580').replace('{height}', '326'),
      };
      this.url = `https://www.twitch.tv/${userData.login}`;
    }
  }
}

module.exports = TwitchEmbed;
