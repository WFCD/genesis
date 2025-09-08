import { PermissionsBitField, Events } from 'discord.js';
import Generator from 'warframe-name-generator';

const requiredVCPerms = [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers];
const relays = [
  'Larunda Relay',
  'Vesper Relay',
  'Strata Relay',
  'Kronia Relay',
  'Leonov Relay',
  'Kuiper Relay',
  'Orcus Relay',
  'Cetus',
  'Iron Wake',
  'Solaris',
  'Orb Vallis',
  'Necralisk',
  'Cetus 69',
];
const generator = new Generator();

/**
 * Get a relay name that isn't currently used.
 * @param {Discord.Guild} guild to check
 * @param {number} retries allowed number of retries before using last used
 * @returns {Promise<string|*>}
 */
const getRelayName = async (guild, retries = 0) => {
  const name = relays[Math.floor(Math.random() * relays.length)];
  const alreadyUsed = guild.channels.cache.find((channel) => channel.name === name);
  if (retries > relays.length - 1 && alreadyUsed) {
    return name;
  }
  if (retries < relays.length - 1 && alreadyUsed) {
    return getRelayName(guild, retries + 1);
  }
  return name;
};

/**
 * Clone a voice channel
 * @param {Discord.VoiceChannel} template to clone
 * @param {Database} settings proxy for database settings
 * @param {Discord.GuildMember} member server user kicking off this event
 * @returns {Promise<*>}
 */
const clone = async (template, settings, member) => {
  /** @type {Discord.Guild} */
  const { guild } = template;

  const isRelay = await settings.isRelay(template.id);
  const nameTemplate = await settings.getDynTemplate(template.id);
  const generatedName = isRelay ? await getRelayName(guild) : generator.make({ adjective: true, type: 'places' });
  const name = nameTemplate ? nameTemplate.replace('$username', member.displayName) : generatedName;

  // check for perms now?
  const newChannel = await template.clone({
    name,
    position: template.rawPosition + 1,
  });

  if (nameTemplate && member.voice.channel) {
    await member.voice.setChannel(newChannel);
  }
  return newChannel;
};

export default class DynamicVoiceHandler {
  /**
   * Make the handler
   * @param {Discord.Client} client for interacting with discord
   * @param {Logger} logger for logging
   * @param {Database} settings to access bot settings
   */
  constructor(client, logger, settings) {
    this.client = client;
    this.logger = logger;
    /** @type Database  */
    this.settings = settings;

    client.on(Events.VoiceStateUpdate, async (oldMember, newMember) => {
      const applicable = await this.checkManagementApplicable(oldMember, newMember);
      if (applicable) {
        await this.checkAllChannels(oldMember.guild, newMember.member);
      }
    });

    client.on(Events.ChannelDelete, async (channel) => {
      await this.removeChannel(channel);
    });

    this.logger.debug('Constructed voice handler');
  }

  /**
   * Check if management should occur
   * @param {Discord.GuildMember} oldMember pre-change member
   * @param {Discord.GuildMember} newMember post-change member
   * @returns {Promise<boolean>}
   */
  async checkManagementApplicable(oldMember, newMember) {
    const templates = await this.settings.getTemplates([oldMember.guild]);
    if (templates.length) {
      return (
        (
          await Promise.all(templates.map(async (channel) => this.checkIfShouldFilter(channel, oldMember, newMember)))
        ).filter((p) => p).length > 0
      );
    }
    return false;
  }

  /**
   * Check if a channel should be filtered
   * @param {Discord.VoiceChannel} channel channel to check
   * @param {Discord.GuildMember} oldMember member data before moving
   * @param {Discord.GuildMember} newMember member data after moving
   * @returns {Promise<boolean|boolean>}
   */
  async checkIfShouldFilter(channel, oldMember, newMember) {
    const templates = await this.settings.getTemplates(Array.from(this.client.guilds.cache.entries()));

    return (
      channel.id === oldMember?.voice?.channel?.id ||
      channel.id === newMember?.voice?.channel?.id ||
      templates.includes(channel.id)
    );
  }

  async checkAllChannels(guild, member) {
    const templates = await this.settings.getTemplates([guild]);

    await Promise.all(
      templates.map(async (template) => {
        if (this.client.channels.cache.has(template)) {
          const templateChannel = this.client.channels.cache.get(template);
          if (!templateChannel?.guild?.me.permissions.has(requiredVCPerms)) {
            return false;
          }
          const { remainingEmpty } = await this.settings.getInstances(templateChannel);
          if (remainingEmpty < 1) {
            return this.addChannel(templateChannel, member);
          }
        }
        return false;
      })
    );
  }

  async removeChannel(channelToRemove) {
    const isInstance = await this.settings.isInstance(channelToRemove);
    if (isInstance) {
      await this.settings.deleteInstance(channelToRemove);
    }
    const isPrivate = await this.settings.isPrivateRoom(channelToRemove);
    if (isPrivate) {
      await this.settings.deletePrivateRoom({
        guild: channelToRemove.guild,
        voiceChannel: channelToRemove,
      });
    }
  }

  /**
   * Add a channel
   * @param {Discord.VoiceChannel} template template to clone
   * @param {Discord.GuildMember} member triggering the change
   * @returns {Promise<undefined|*>}
   */
  async addChannel(template, member) {
    try {
      const newChannel = await clone(template, this.settings, member);
      await this.settings.addInstance(template, newChannel);
      if (!(await this.settings.userHasRoom(member))) {
        await this.settings.addPrivateRoom(template.guild, undefined, newChannel, { id: 0 }, member);
      }
      return newChannel;
    } catch (error) {
      this.logger.debug(error.stack);
      this.logger.error(error);
      return undefined;
    }
  }
}
