import Discord from 'discord.js';
import DynamicVoiceHandler from './DynamicVoiceHandler.js';
import { fromNow, games, timeDeltaToMinutesString } from '../utilities/CommonFunctions.js';
import Handler from '../models/BaseEventHandler.js';

const {
  Constants: { Events },
} = Discord;

const max = {
  cetus: {
    day: 6000000,
    night: 3000000,
  },
  vallis: {
    warm: 400000,
    cold: 1600000 - 400000,
  },
};

const cycleTimeout = 60000;

const startupTimeout = Number.parseInt(process.env.READY_FORCE || '3600000', 10);

export default class OnReadyHandle extends Handler {
  constructor(bot) {
    super(bot, 'handlers.onReady', Events.CLIENT_READY);
    setTimeout(() => {
      this.logger.info(`[Cluster] Forcing readiness...`);
      this.execute.bind(this)();
    }, startupTimeout);
  }

  async execute() {
    try {
      if (this.bot?.readyToExecute) return;
      this.logger.silly(`Running ${this.id} for ${this.event}`);
      this.logger.info('[Cluster] READY');

      await this.#notifyUp();

      this.settings.init();
      // await this.settings.ensureData(this.client);
      this.bot.readyToExecute = true;

      await this.#updatePresence();
      this.setupAdditionalHandlers();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async #notifyUp() {
    if (this.bot.controlHook && (process.env.LOG_LEVEL || 'ERROR').toLowerCase() === 'debug') {
      try {
        await this.bot.controlHook.edit({
          name: this.bot.client.user.username,
          avatar: this.bot.client.user.displayAvatarURL().replace('.webp', '.png').replace('.webm', '.gif'),
        });
      } catch (e) {
        this.logger.info("couldn't use webhook");
      }
      await this.bot.controlHook.send({
        embeds: [
          {
            description: `Shards **${this.bot.shards[0] + 1} - ${
              this.bot.shards[this.bot.shards.length - 1] + 1
            }** ready\n<t:${Math.floor(Date.now() / 1000)}:R>`,
            color: 0x2b90ec,
          },
        ],
      });
    }
  }

  setupAdditionalHandlers() {
    setInterval(this.#updatePresence.bind(this), cycleTimeout);
    setInterval(this.#checkPrivateRooms.bind(this), cycleTimeout);
    this.bot.dynamicVoiceHandler = new DynamicVoiceHandler(this.client, this.logger, this.settings);
    // this.#repopulateChannels();
  }

  async #getWarframePresence(base) {
    const cetusState = await this.bot.ws.get('cetusCycle');
    const vallisState = await this.bot.ws.get('vallisCycle');
    // const outpost = await this.bot.ws.get('sentientOutposts');

    if (vallisState || cetusState) {
      let vsFromNow = fromNow(new Date(vallisState.expiry));
      let csFromNow = fromNow(new Date(cetusState.expiry));

      if (vsFromNow < 0) {
        vsFromNow = (vallisState.isWarm ? max.vallis.cold : max.vallis.warm) + vsFromNow;
        vallisState.isWarm = !vallisState.isWarm;
      }

      if (csFromNow < 0) {
        csFromNow = (cetusState.isDay ? max.cetus.night : max.cetus.day) + csFromNow;
        cetusState.isDay = !cetusState.isDay;
      }

      const vs = vallisState
        ? `${timeDeltaToMinutesString(vsFromNow) || '0m'}: ${vallisState.isWarm ? '🔥' : '❄️'} • `
        : '';
      const cs = cetusState ? `${timeDeltaToMinutesString(csFromNow) || '0m'}: ${cetusState.isDay ? '☀️' : '🌙'}` : '';
      return `${vs}${cs}`;
    }
    return base;
  }

  /**
   * Set up presence when the bot is ready.
   * Can flex based on various games.
   */
  async #updatePresence() {
    try {
      const baseMsg = process.env.BASE_PRES_MSG || `@${this.client.user.username} help`;
      const activity = process.env.BASE_PRES_ACT || 'PLAYING';

      const wfPresence = games.includes('WARFRAME') ? await this.#getWarframePresence(baseMsg) : undefined;
      const presence = wfPresence || baseMsg;
      this.client.user.setPresence({
        status: 'online',
        afk: false,
        activities: [
          {
            name: presence,
            type: activity,
          },
        ],
      });
    } catch (error) {
      this.logger.silly(error);
    }
  }

  /**
   * Check if private rooms have expired and are empty. If not, do nothing.
   * If so, delete the corresponding channels.
   */
  async #checkPrivateRooms() {
    if (!games.includes('UTIL')) return;
    this.logger.silly('Checking private rooms...');
    const privateRooms = await this.settings.getPrivateRooms();
    this.logger.silly(`Private rooms... ${privateRooms.length}`);
    await Promise.all(
      privateRooms.map(async (room) => {
        if (room && (room.textChannel || room.category || room.voiceChannel)) {
          const now = new Date();
          if (
            now.getTime() + now.getTimezoneOffset() * 60000 - room.createdAt > this.channelTimeout &&
            (!room.voiceChannel || room.voiceChannel.members.size === 0)
          ) {
            if (room.textChannel && room.textChannel.deletable) {
              this.logger.silly(`Deleting text channel... ${room.textChannel.id}`);
              await room.textChannel.delete();
            }
            if (room.voiceChannel && room.voiceChannel.deletable) {
              this.logger.silly(`Deleting voice channel... ${room.voiceChannel.id}`);
              await room.voiceChannel.delete();
            }
            if (room.category && room.category.deletable) {
              this.logger.silly(`Deleting category... ${room.category.id}`);
              await room.category.delete();
            }
            await this.settings.deletePrivateRoom(room);
          }
        } else if (room) {
          await this.settings.deletePrivateRoom({
            textChannel: room.textId ? { id: room.textId } : undefined,
            voiceChannel: { id: room.voiceId },
            category: { id: room.categoryId },
            guild: { id: room.guildId },
          });
        }
      })
    );
  }

  async #repopulateChannels() {
    if (this.client.channels) {
      /** @type {Discord.ChannelManager} */
      let { channels } = this.client;
      channels = channels.cache.filter((channel) => channel.type === 'GUILD_TEXT');
      await Promise.all(
        channels.mapValues((channel) => {
          this.settings.addGuildTextChannel(channel);
        })
      );
    }
  }
}
