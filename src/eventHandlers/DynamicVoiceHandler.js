'use strict';

const Discord = require('discord.js');

const { Events } = Discord.Constants;

const { Generator } = require('warframe-name-generator');

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
  const alreadyUsed = guild.channels.cache.find(channel => channel.name === name);
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
  const { guild } = template;

  const isRelay = await settings.isRelay(template.id);
  const nameTemplate = await settings.getDynTemplate(template.id);
  const generatedName = isRelay
    ? await getRelayName(guild)
    : generator.make({ adjective: true, type: 'places' });
  const name = nameTemplate
    ? nameTemplate.replace('$username', member.displayName)
    : generatedName;

  const newChannel = await template.clone({
    name,
    position: template.rawPosition + 1,
  });

  if (nameTemplate && member.voice.channel) {
    await member.voice.setChannel(newChannel);
  }
  return newChannel;
};

module.exports = class DynamicVoiceHandler {
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

    client.on(Events.VOICE_STATE_UPDATE, async (oldMember, newMember) => {
      const applicable = await this.checkManagementApplicable(oldMember, newMember);
      if (applicable) {
        await this.checkAllChannels(oldMember.guild, newMember.member);
      }
    });

    client.on(Events.CHANNEL_DELETE, async (channel) => {
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
      // const instancePromises = [];
      // templates.forEach((template) => {
      //   instancePromises.push(this.settings.getInstances(template));
      // });
      //
      // const instances = [];
      //
      // (await Promise.all(instancePromises))
      //   .forEach((ip) => {
      //     instances.push(...ip.instances);
      //   });

      const shouldFilterPromises = [];

      templates.forEach(channel => shouldFilterPromises.push(
        this.checkIfShouldFilter(channel, oldMember, newMember),
      ));

      return (await Promise.all(shouldFilterPromises)).filter(p => p).length > 0;
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
    const templates = await this.settings
      .getTemplates(Array.from(this.client.guilds.cache.entries()));

    return channel.id === oldMember?.voice?.channel?.id
      || channel.id === newMember?.voice?.channel?.id
      || templates.includes(channel.id);
  }

  async checkAllChannels(guild, member) {
    const templates = await this.settings.getTemplates([guild]);

    await Promise.all(templates.map(async (template) => {
      if (this.client.channels.cache.has(template)) {
        const templateChannel = this.client.channels.cache.get(template);
        const { remainingEmpty } = await this.settings.getInstances(templateChannel);
        if (remainingEmpty < 1) {
          return this.addChannel(templateChannel, member);
        }
      }
      return false;
    }));
  }

  async removeChannel(channelToRemove) {
    if (await this.settings.isInstance(channelToRemove)) {
      this.settings.deleteInstance(channelToRemove);
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
      return newChannel;
    } catch (error) {
      this.logger.debug(error.stack);
      this.logger.error(error);
      return undefined;
    }
  }
};
