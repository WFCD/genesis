'use strict';

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
];

const generator = new Generator();

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
    member.voice.setChannel(newChannel);
  }
  return newChannel;
};

class DynamicVoiceHandler {
  constructor(client, logger, settings) {
    this.client = client;
    this.logger = logger;
    this.settings = settings;

    client.on('voiceStateUpdate', async (oldMember, newMember) => {
      const applicable = await this.checkManagementApplicable(oldMember, newMember);
      if (applicable) {
        this.checkAllChannels(oldMember.guild, newMember.member);
      }
    });

    client.on('channelDelete', (channel) => {
      this.removeChannel(channel);
    });

    this.logger.debug('Constructed voice handler');
  }

  async checkManagementApplicable(oldMember, newMember) {
    const templates = await this.settings.getTemplates([oldMember.guild]);
    if (templates.length) {
      const instances = [];
      templates.forEach(async (template) => {
        instances.push(...await this.settings.getInstances(template));
      });
      return templates
        .filter(channel => this.checkIfShouldFilter(channel, oldMember, newMember))
        .length > 0;
    }
    return templates.length;
  }

  async checkIfShouldFilter(channel, oldMember, newMember) {
    const templates = await this.settings.getTemplates(this.client.guilds.cache.array());

    const shouldFilter = channel.id === oldMember.voiceChannelId
      || channel.id === newMember.voiceChannelId
      || templates.includes(channel.id);

    return shouldFilter;
  }

  async checkAllChannels(guild, member) {
    const templates = await this.settings.getTemplates([guild]);

    templates.forEach(async (template) => {
      if (this.client.channels.cache.has(template)) {
        const templateChannel = this.client.channels.cache.get(template);
        const { remainingEmpty } = await this.settings.getInstances(templateChannel);
        if (remainingEmpty < 1) {
          this.addChannel(templateChannel, member);
        }
      }
    });
  }

  async removeChannel(channelToRemove) {
    if (await this.settings.isInstance(channelToRemove)) {
      this.settings.deleteInstance(channelToRemove);
    }
  }

  async addChannel(template, member) {
    try {
      const newChannel = await clone(template, this.settings, member);
      this.settings.addInstance(template, newChannel);
      return newChannel;
    } catch (error) {
      this.logger.debug(error.stack);
      this.logger.error(error);
      return undefined;
    }
  }
}

module.exports = DynamicVoiceHandler;
