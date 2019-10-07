'use strict';

const axios = require('axios');
const moment = require('moment');
const TwitchEmbed = require('./embeds/TwitchEmbed');

/**
 * Manages Twitch API
 */
class TwitchClient {
  /**
   * Constructs TwitchClient
   * @param {Discord.Client} client the discord client
   * @param {Logger} logger the logger
   */
  constructor(client, logger) {
    this.client = client;
    this.logger = logger;
    this.lastStartedAtTime = null;

    this.client.on('ready', () => {
      // find the channel that twitch messages will be posted to
      this.channel = this.client.channels.get(process.env.TWITCH_NOTIFICATION_CHANNEL_ID);

      // save this in closure for setInterval
      const self = this;
      setInterval(async () => { await self.pollTwitch(); },
        process.env.TWITCH_POLL_INTERVAL_MS || 10000);
    });
  }

  /**
   * Retrieves the details of the twitch user that we are following
   * @returns {Object} a twitch api user response object
   */
  async getUserDetails() {
    try {
      const response = await axios.get('https://api.twitch.tv/helix/users', {
        params: {
          login: process.env.TWITCH_USER_LOGIN || 'warframe',
        },
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
        },
      });

      if (response.data.data.length > 0) {
        return response.data.data[0];
      }
    } catch (error) {
      this.logger.error(error);
    }
    return undefined;
  }

  /**
   * Checks the user's stream to see if they are currently live
   */
  async pollTwitch() {
    try {
      const response = await axios.get('https://api.twitch.tv/helix/streams', {
        params: {
          user_login: process.env.TWITCH_USER_LOGIN || 'warframe',
        },
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
        },
      });

      // If the stream query has some results, then the user is live
      if (response.data.data.length > 0) {
        // parse what time the stream started
        const startedAt = moment(response.data.data[0].started_at);

        // if we havent seen the stream start yet
        // OR the stream started after the last time it started, notify
        if (this.lastStartedAtTime == null || startedAt.isAfter(this.lastStartedAtTime)) {
          // get the user details now so we can enhance the embed with profile data
          const userDetails = await this.getUserDetails();

          // if we got user details, notify
          if (userDetails) {
            // create our embed
            const embed = new TwitchEmbed(response.data.data[0], userDetails);

            // send it!
            this.channel.send(`${userDetails.display_name} is streaming on Twitch!`, { embed });

            // save the stream started time so we dont continue to send messages
            // but we will send one the next time a new stream starts
            this.lastStartedAtTime = startedAt;
          }
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}

module.exports = TwitchClient;
