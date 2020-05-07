'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates a twitch go-live embed
 */
class TwitchEmbed extends BaseEmbed {
  /**
   * @param {HelixStream} streamData - a stream result from twitch api
   * @param {HelixUser} userData   - a user result from twitch api
   */
  constructor(streamData, userData) {
    super();
    this.title = streamData.title;
    if (userData) {
      this.author = {
        name: streamData.userDisplayName,
        icon_url: userData.profilePictureUrl,
      };
      this.image = {
        url: streamData.thumbnailUrl.replace('{width}', '580').replace('{height}', '326'),
      };
      this.url = `https://www.twitch.tv/${userData.name}`;
    }
  }
}

module.exports = TwitchEmbed;
