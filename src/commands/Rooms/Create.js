'use strict';

const Command = require('../../Command.js');

const useable = ['room', 'raid', 'team'];

const vulgar = ['n[i!1]gg[e3]r', 'n[i!1]gg[ua]', 'h[i!1]tl[e3]r', 'n[a@]z[i!1]', '[©ck]un[t7]', 'fu[©c]k', '[©c]umm', 'f[a@4]g', 'd[i!1]ck', 'c[o0]ck', 'boner', 'sperm', 'gay', 'gooch', 'jizz', 'pussy', 'penis', 'r[i!1]mjob', 'schlong', 'slut', 'wank', 'whore', 'sh[i!1]t', 'sex', 'fuk', 'heil', 'porn', 'suck', 'rape', 'scrotum'];

/**
 * Gets the list of users from the mentions in the call
 * @param {Message} message Channel message
 * @returns {Array.<User>} Array of users to send message
 */
function getUsersForCall(message) {
  const users = [];
  if (message.mentions.roles) {
    message.mentions.roles.forEach(role =>
      role.members.forEach(member =>
        users.push(member.user)));
  }
  if (message.mentions.users) {
    message.mentions.users.forEach((user) => {
      if (users.indexOf(user) === -1) {
        users.push(user);
      }
    });
  }
  let authorIncluded = false;
  users.forEach((user) => {
    if (user.id === message.author.id) {
      authorIncluded = true;
    }
  });
  if (!authorIncluded) {
    users.push(message.author);
  }
  return users;
}
/**
 * Create temporary voice/text channels (can be expanded in the future)
 */
class Create extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.create', 'create', 'Create a temporary room.');
    this.regex = new RegExp(`^${this.call}\\s?(room|raid|team)?(\\w|-)?(?:-n(.+))?`, 'i');

    this.usages = [
      { description: 'Display instructions for creating temporary rooms', parameters: [] },
      {
        description: 'Create temporary text and voice channels for the calling user.',
        parameters: ['room | raid | team'],
      },
      {
        description: 'Create temporary text and voice channels for the calling user and any mentioned users/roles.',
        parameters: ['room | raid | team', 'users and/or role'],
      },
      {
        description: 'Create temporary text and voice channels for the calling user and any mentioned users/roles, with a custom name',
        parameters: ['room | raid | team', 'users and/or role', '-n name'],
      },
    ];

    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const channelNameRegex = new RegExp('-n\\s+(.+)', 'ig');
    const type = message.strippedContent.match(this.regex)[1];
    const namingResults = message.strippedContent.match(channelNameRegex);
    let optName = (namingResults ? namingResults[0] : '')
      .replace('-n ', '');
    if (vulgar.length) {
      optName = optName.replace(new RegExp(`(${vulgar.join('|')})`, 'ig'), ''); // remove vulgar
    }
    const createPrivateChannelAllowed = parseInt(await this.bot.settings.getChannelSetting(message.channel, 'createPrivateChannel'), 10);
    if (createPrivateChannelAllowed) {
      if (type) {
        const roomType = type.trim();
        if (roomType === 'room' || roomType === 'raid' || roomType === 'team') {
          const users = getUsersForCall(message);
          const name = optName || `${type}-${message.member.displayName}`.toLowerCase();
          if (users.length < 11 && !message.guild.channels.find('name', name)) {
            const textChannel = await message.guild.createChannel(name.replace(/[^\w|-]/ig, ''), 'text');
            const voiceChannel = await message.guild.createChannel(name, 'voice');
            // set up listener to delete channels if inactive for more than 5 minutes
            // set up overwrites
            this.setOverwrites(textChannel, voiceChannel, users, message.guild.id, message.author);
            // add channel to listenedChannels
            await this.bot.settings.addPrivateRoom(message.guild, textChannel, voiceChannel);
            // send users invite link to new rooms
            this.sendInvites(voiceChannel, users, message.author);
            // set room limits
            this.setLimits(voiceChannel, roomType);
            this.messageManager.embed(message, {
              title: 'Channels created',
              fields: [{
                name: '_ _',
                value: `Voice Channel: ${voiceChannel.name}\n` +
                  `Text Channel: ${textChannel}`,
              }],
            }, false, false);
            return this.messageManager.statuses.SUCCESS;
          }
          let msg = '';
          if (users.length > 10) {
            // notify caller that there's too many users if role is more than 10 people.
            msg = 'you are trying to send an invite to too many people, please keep the total number under 10';
          } else {
            msg = 'that room already exists.';
          }
          this.messageManager.reply(message, msg, true, true);
          return this.messageManager.statuses.FAILURE;
        }
      } else {
        this.messageManager.reply(
          message, '```haskell\n' +
          'Sorry, you need to specify what you want to create. Right now these are available to create:' +
          `\n* ${useable.join('\n* ')}\n\`\`\``
          , true, false,
        );
        return this.messageManager.statuses.FAILURE;
      }
    }
    return this.messageManager.statuses.FAILURE;
  }

  /**
   * Send channel invites to users who were tagged in message
   * @param {VoiceChannel} voiceChannel Voice channel to create invites for
   * @param {Array.<User>} users Array of users to send invites to
   * @param {User} author Calling user who sends message
   */
  async sendInvites(voiceChannel, users, author) {
    if (voiceChannel.permissionsFor(this.bot.client.user).has('CREATE_INSTANT_INVITE')) {
      const invite = await voiceChannel.createInvite({ maxUses: users.length });
      for (const user of users) {
        this.messageManager.sendDirectMessageToUser(user, `Invite for ${voiceChannel.name} from ${author}: ${invite}`, false);
      }
    }
  }

  /**
   * Set up overwrites for the text channel and voice channel
   * for the list of users as the team, barring everyone else from joining
   * @param {TextChannel} textChannel   Text channel to set permissions for
   * @param {VoiceChannel} voiceChannel Voice channel to set permissions for
   * @param {Array.<User>} users        Array of users for whom to allow into channels
   * @param {string} everyoneId         Snowflake id for the everyone role
   */
  setOverwrites(textChannel, voiceChannel, users, everyoneId, author) {
    // create overwrites
    const overwritePromises = [];
    // create text channel perms
    overwritePromises.push(textChannel.overwritePermissions(everyoneId, {
      VIEW_CHANNEL: false,
    }));
    // create voice channel perms
    overwritePromises.push(voiceChannel.overwritePermissions(everyoneId, {
      CONNECT: false,
      VIEW_CHANNEL: false,
    }));

    // allow bot to manage channels
    overwritePromises.push(textChannel.overwritePermissions(this.bot.client.user.id, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
    }));
    overwritePromises.push(voiceChannel.overwritePermissions(this.bot.client.user.id, {
      VIEW_CHANNEL: true,
      CREATE_INSTANT_INVITE: true,
      CONNECT: true,
      SPEAK: true,
      MUTE_MEMBERS: true,
      DEAFEN_MEMBERS: true,
      MOVE_MEMBERS: true,
      USE_VAD: true,
      MANAGE_ROLES: true,
      MANAGE_CHANNELS: true,
    }));

    // set up overwrites per-user
    users.forEach((user) => {
      overwritePromises.push(textChannel.overwritePermissions(user.id, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
      }));
      overwritePromises.push(voiceChannel.overwritePermissions(user.id, {
        VIEW_CHANNEL: true,
        CONNECT: true,
        SPEAK: true,
        USE_VAD: true,
      }));
    });

    overwritePromises.push(textChannel.overwritePermissions(author.id, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
      MANAGE_CHANNELS: true,
    }));
    overwritePromises.push(voiceChannel.overwritePermissions(author.id, {
      VIEW_CHANNEL: true,
      CONNECT: true,
      SPEAK: true,
      USE_VAD: true,
      MANAGE_CHANNELS: true,
    }));

    overwritePromises.forEach(promise => promise.catch(this.logger.error));
  }

  async setLimits(voiceChannel, type) {
    let limit = 99;
    switch (type) {
      case 'team':
        limit = 4;
        break;
      case 'raid':
        limit = 8;
        break;
      case 'room':
      default:
        break;
    }
    const vc = await voiceChannel.setUserLimit(limit);
    this.logger.debug(`User limit set to ${limit} for ${vc.name}`);
  }
}

module.exports = Create;
