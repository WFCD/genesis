import { Client, Events, Guild, GuildMember, PermissionFlagsBits, VoiceBasedChannel, VoiceState } from 'discord.js';
import Generator from 'warframe-name-generator';

import type { Database } from '#shared/types/database';

import type Genesis from '../bot';

const requiredVCPerms = [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers];
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

const getRelayName = async (guild: Guild, retries = 0): Promise<string> => {
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

const clone = async (template: VoiceBasedChannel, settings: Database, member: GuildMember) => {
  const { guild } = template;

  const isRelay = await settings.dynamicVoice.isRelay(template.id);
  const nameTemplate = (await settings.dynamicVoice.getDynTemplate(template.id)) as string | undefined;
  const generatedName = isRelay ? await getRelayName(guild) : generator.make({ adjective: true, type: 'places' });
  const name =
    typeof nameTemplate === 'string' && nameTemplate
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

export default class DynamicVoiceHandler {
  client: Client;

  logger: Genesis['logger'];

  settings: Database;

  constructor(client: Client, logger: Genesis['logger'], settings: Database) {
    this.client = client;
    this.logger = logger;
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

  async checkManagementApplicable(oldMember: VoiceState, newMember: VoiceState) {
    const templates = await this.settings.dynamicVoice.getTemplates([oldMember.guild]);
    if (templates.length) {
      return (
        (
          await Promise.all(templates.map(async (channel) => this.checkIfShouldFilter(channel, oldMember, newMember)))
        ).filter((p) => p).length > 0
      );
    }
    return false;
  }

  async checkIfShouldFilter(channel: string, oldMember: VoiceState, newMember: VoiceState) {
    const templates = await this.settings.dynamicVoice.getTemplates([...this.client.guilds.cache.values()]);

    return channel === oldMember?.channel?.id || channel === newMember?.channel?.id || templates.includes(channel);
  }

  async checkAllChannels(guild: Guild, member: GuildMember) {
    const templates = await this.settings.dynamicVoice.getTemplates([guild]);

    await Promise.all(
      templates.map(async (template) => {
        if (this.client.channels.cache.has(template)) {
          const templateChannel = this.client.channels.cache.get(template);
          if (
            !templateChannel ||
            !('guild' in templateChannel) ||
            !templateChannel.guild?.members.me?.permissions.has(requiredVCPerms)
          ) {
            return false;
          }
          const { remainingEmpty } = await this.settings.dynamicVoice.getInstances(
            templateChannel as VoiceBasedChannel & { guild: Guild }
          );
          if (remainingEmpty < 1) {
            return this.addChannel(templateChannel, member);
          }
        }
        return false;
      })
    );
  }

  async removeChannel(channelToRemove) {
    const isInstance = await this.settings.dynamicVoice.isInstance(channelToRemove);
    if (isInstance) {
      await this.settings.dynamicVoice.deleteInstance(channelToRemove);
    }
    const isPrivate = await this.settings.privateRooms.isPrivateRoom(channelToRemove);
    if (isPrivate) {
      await this.settings.privateRooms.deletePrivateRoom({
        guild: channelToRemove.guild,
        voiceChannel: channelToRemove,
      });
    }
  }

  async addChannel(template, member) {
    try {
      const newChannel = await clone(template, this.settings, member);
      await this.settings.dynamicVoice.addInstance(template, newChannel);
      if (!(await this.settings.privateRooms.userHasRoom(member))) {
        await this.settings.privateRooms.addPrivateRoom(template.guild, undefined, newChannel, { id: 0 }, member);
      }
      return newChannel;
    } catch (error) {
      this.logger.debug(error.stack);
      this.logger.error(error);
      return undefined;
    }
  }
}
