'use strict';

const Command = require('../../Command.js');
const { getUsersForCall } = require('../../CommonFunctions');

/**
 * Array of useable channel values
 * @type {Array.<String>}
 */
const useable = ['room', 'raid', 'team', 'chat'];

/**
 * String array of disallowed words
 * @type {Array.<String>}
 */
const vulgar = ['n[i!1]gg[e3]r', 'n[i!1]gg[ua]', 'h[i!1]tl[e3]r', 'n[a@]z[i!1]', '[©ck]un[t7]', 'fu[©c]k', '[©c]umm',
  'f[a@4]g', 'd[i!1]ck', 'c[o0]ck', 'boner', 'sperm', 'gay', 'gooch', 'jizz', 'pussy', 'penis', 'r[i!1]mjob', 'schlong',
  'slut', 'wank', 'whore', 'sh[i!1]t', 'sex', 'fuk', 'heil', 'porn', 'suck', 'rape', 'scrotum'];

/**
 * Regex describing custom channel names
 * @type {RegExp}
 */
const channelNameRegex = new RegExp('-n\\s+(.+)', 'ig');
/**
 * Regex describing no text being desired
 * @type {RegExp}
 */
const noTextRegex = new RegExp('--no-text', 'ig');
/**
 * Regex describing a public channel
 * @type {RegExp}
 */
const publicRegex = new RegExp('--public', 'ig');

/**
 * Regex describing a locked channel
 * @type {RegExp}
 */
const lockedRegex = new RegExp('--locked', 'ig');

/**
 * Regex describing text being desired
 * @type {RegExp}
 */
const textRegex = new RegExp('--text', 'ig');


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
    this.regex = new RegExp(`^${this.call}\\s?(room|raid|team|chat)?(\\w|-)?(?:-n(.+))?(--no-text)?(--public)?`, 'i');

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
        parameters: ['room | raid | team', 'users and/or role', '-n name', '--no-text', '--public', '--text', '--locked'],
      },
    ];

    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx Command context for calling commands
   * @returns {string} success status
   */
  async run(message, ctx) {
    let isPublic;
    if (lockedRegex.test(message.strippedContent)) {
      isPublic = false;
    } else if (publicRegex.test(message.strippedContent)) {
      isPublic = true;
    } else {
      isPublic = !ctx.defaultRoomsLocked;
    }

    let useText;
    if (textRegex.test(message.strippedContent)) {
      useText = true;
    } else if (noTextRegex.test(message.strippedContent)) {
      useText = false;
    } else {
      useText = !ctx.defaultNoText;
    }

    const type = message.strippedContent.match(this.regex)[1];
    const namingResults = message.strippedContent.match(channelNameRegex);
    const userHasRoom = await this.bot.settings.userHasRoom(message.member);

    let optName = (namingResults ? namingResults[0] : '')
      .replace('-n ', '').replace('--public', '')
      .replace('--locked', '').replace('--no-text', '')
      .replace('--text', '')
      .trim();
    if (vulgar.length) {
      optName = optName.replace(new RegExp(`(${vulgar.join('|')})`, 'ig'), ''); // remove vulgar
    }

    if (ctx.createPrivateChannel) {
      if (userHasRoom) {
        await this.messageManager.reply(message, `you already have a private room registered. If this is in error, please log a bug report with \`${ctx.prefix}bug\`.`, true, true);
        return this.messageManager.statuses.FAILURE;
      } else if (type) {
        const roomType = type.trim();
        if (useable.includes(roomType)) {
          const users = getUsersForCall(message);
          const name = optName || `${type}-${message.member.displayName}`.toLowerCase();
          if (users.length < 11 && !message.guild.channels.find('name', name)) {
            const overwrites = this.createOverwrites(
              users,
              message.guild.defaultRole, message.author, isPublic, useText,
            );
            const category = await message.guild
              .createChannel(name, 'category', overwrites);
            let textChannel;
            if (useText) {
              textChannel = await message.guild.createChannel(name.replace(/[^\w|-]/ig, ''), 'text', overwrites);
              textChannel = await textChannel.setParent(category);
            }

            let voiceChannel = await message.guild.createChannel(name, 'voice', overwrites);
            voiceChannel = await voiceChannel.setParent(category);

            if (!isPublic) {
              // manually add overwrites for "everyone"
              await category.overwritePermissions(message.guild.defaultRole.id, {
                CONNECT: false,
                VIEW_CHANNEL: false,
              });
              if (useText) {
                await textChannel.overwritePermissions(message.guild.defaultRole.id, {
                  CONNECT: false,
                  VIEW_CHANNEL: false,
                });
              }
              await voiceChannel.overwritePermissions(message.guild.defaultRole.id, {
                CONNECT: false,
                VIEW_CHANNEL: false,
              });
            }

            // add channel to listenedChannels
            await this.bot.settings
              .addPrivateRoom(message.guild, textChannel, voiceChannel, category, message.member);
            // send users invite link to new rooms
            this.sendInvites(voiceChannel, users, message.author);
            // set room limits
            this.setLimits(voiceChannel, roomType);
            this.messageManager.embed(message, {
              title: 'Channels created',
              fields: [{
                name: '_ _',
                value: `Voice Channel: ${voiceChannel.name}${
                  textChannel ? `\nText Channel: ${textChannel}` : ''}`,
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
          await this.messageManager.reply(message, msg, true, true);
          return this.messageManager.statuses.FAILURE;
        }
      } else {
        await this.messageManager.reply(
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
   * Create an array of permissions overwrites for the channel
   * @param {Array.<User>} users            Array of users for whom to allow into channels
   * @param {RoleResolvable} everyoneRole   RoleResolvable for the @everyone role
   * @param {User} author                   User object for creator of room
   * @param {boolean} isPublic              Whether or not this channel will be public
   * @returns {Array.<PermissionsOVerwrites>}
   */
  createOverwrites(users, everyoneRole, author, isPublic) {
    // create overwrites
    const overwrites = [];
    // this still doesn't work, need to figure out why
    if (!isPublic) {
      overwrites.push({
        id: everyoneRole,
        deny: ['VIEW_CHANNEL', 'CONNECT'],
      });
      overwrites.push({
        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'MANAGE_ROLES', 'MANAGE_CHANNELS'],
        id: this.bot.client.user.id,
      });
      // set up overwrites per-user
      users.forEach((user) => {
        overwrites.push({
          id: user.id,
          allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT', 'SPEAK', 'USE_VAD'],
        });
      });
      overwrites.push({
        id: author.id,
        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT', 'SPEAK', 'USE_VAD', 'MANAGE_MESSAGES'],
      });
    } else {
      overwrites.push({
        id: everyoneRole,
        allow: ['VIEW_CHANNEL', 'CONNECT'],
      });
    }
    return overwrites;
  }

  async setLimits(voiceChannel, type) {
    let limit;
    switch (type) {
      case 'team':
        limit = 4;
        break;
      case 'raid':
        limit = 8;
        break;
      case 'chat':
      case 'room':
      default:
        break;
    }
    if (limit) {
      await voiceChannel.setUserLimit(limit);
    }
    this.logger.debug(`User limit set to ${limit || 'none'} for ${voiceChannel.name}`);
  }
}

module.exports = Create;
