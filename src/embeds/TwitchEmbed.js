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
      this.thumbnail = {
        url: userData.profile_image_url,
      };
      this.url = `https://www.twitch.tv/${userData.login}`;
    }
  }
}

module.exports = TwitchEmbed;
