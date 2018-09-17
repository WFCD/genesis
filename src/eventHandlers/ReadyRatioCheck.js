'use strict';

const Handler = require('../models/BaseEventHandler');

let guildCheck = null; // I don't know where to put this

/**
 * Sends a DM to the owners of all guilds over the ratio
 * @param {Bot} self the bot
 */
async function guildLeave(self) {
  const [results] = await self.settings.getGuildRatios(self.client.shard);
  const guilds = results.slice(0, 5);
  const owners = {};
  try {
    guilds.forEach((row) => {
      if (owners[row.owner_id]) {
        owners[row.owner_id].message += `, **${self.client.guilds.get(row.guild_id).name}**`;
        owners[row.owner_id].guilds.push(row.guild_id);
      } else {
        owners[row.owner_id] = {
          message: `**${self.client.guilds.get(row.guild_id).name}**`,
          guilds: [row.guild_id],
        };
      }
    });
    Object.keys(owners).forEach(async (id) => {
      // const user = await self.client.fetchUser(id, true);
      // const DM = await user.createDM();
      // await DM.send(`Your guild${owners[id].guilds.length > 1 ? 's' : ''} ${owners[id].message} are over the bot-to-user ratio. ${self.client.user.username} will now leave. If you want to keep using Genesis please invite more people or kick some bots.`);
      owners[id].guilds.forEach(guild => self.client.guilds.get(guild).leave());
    });
    if ((results.length - 5) <= 0) {
      self.logger.debug('No more guilds in "guild_ratio" clearing interval.');
      clearInterval(guildCheck);
    }
  } catch (e) {
    this.bot.logger.error(e);
  }
}

/**
 * Checks the ratio of all guilds on the shard
 * @param {Bot} self the bot
 */
function guildRatioCheck(self) {
  const guilds = self.client.guilds.filter((guild) => {
    self.logger.debug(`Checking Guild: ${guild.name} (${guild.id}) Owner: ${guild.ownerID}`);
    const bots = guild.members.filter(user => user.user.bot);
    return ((bots.size / guild.memberCount) * 100) >= 80;
  });

  guilds.forEach((guild) => {
    self.settings.addGuildRatio(self.client.shard, guild);
  });

  guildCheck = setInterval(guildLeave, 10000, self);
}

/**
 * Describes a handler
 */
class OnReadyHandle extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.ready.ratio', 'onReady');
  }

  /**
   * Run the ready handle
   */
  async execute() {
    this.logger.debug(`Running ${this.id} for ${this.event}`);
    setTimeout(guildRatioCheck, 4000, this);
  }
}

module.exports = OnReadyHandle;
