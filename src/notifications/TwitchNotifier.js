'use strict';

const fetch = require('node-fetch');
const moment = require('moment');
const TwitchEmbed = require('../embeds/TwitchEmbed');
const Broadcaster = require('./Broadcaster');
const { platforms } = require('../CommonFunctions');
const logger = require('../Logger');

/**
 * Watches for Twitch go-lives and broadcasts them
 */
class TwitchNotifier {
  constructor({
    client, settings, messageManager,
  }) {
    this.broadcaster = new Broadcaster({
      client,
      settings,
      messageManager,
    });

    this.lastStartedAtTime = null;
    this.user = process.env.TWITCH_USER_LOGIN || 'warframe';

    // save this in closure for setInterval
    const self = this;
    setInterval(async () => { await self.pollTwitch(); },
      process.env.TWITCH_POLL_INTERVAL_MS || 60000);
  }

  /**
   * Retrieves the details of the twitch user that we are following
   * @returns {Object} a twitch api user response object
   */
  async getUserDetails() {
    try {
      const response = await fetch(`https://api.twitch.tv/helix/users?login=${this.user}`, {
        method: 'GET',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
        },
      })
        .then(data => data.json());

      if (response.data.length > 0) {
        return response.data[0];
      }
    } catch (error) {
      logger.error(error);
    }
    return undefined;
  }

  /**
   * Checks the user's stream to see if they are currently live
   */
  async pollTwitch() {
    try {
      const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${this.user}`, {
        method: 'GET',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
        },
      })
        .then(data => data.json());

      // If the stream query has some results, then the user is live
      if (response.data.length > 0) {
        // parse what time the stream started
        const startedAt = moment(response.data[0].started_at);

        // if we havent seen the stream start yet
        // OR the stream started after the last time it started, notify
        if (this.lastStartedAtTime == null || startedAt.isAfter(this.lastStartedAtTime)) {
          // get the user details now so we can enhance the embed with profile data
          const userDetails = await this.getUserDetails();

          // if we got user details, notify
          if (userDetails) {
            // create our embed
            const twitchEmbed = new TwitchEmbed(response.data[0], userDetails);

            // broadcast it!
            platforms.forEach((platform) => {
              this.broadcaster.broadcast(twitchEmbed, platform, 'twitch');
            });

            // save the stream started time so we dont continue to send messages
            // but we will send one the next time a new stream starts
            this.lastStartedAtTime = startedAt;
          }
        }
      }
    } catch (error) {
      logger.error(error);
    }
  }
}

module.exports = TwitchNotifier;
