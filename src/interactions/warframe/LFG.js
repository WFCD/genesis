'use strict';

const Discord = require('discord.js');

const {
  Constants: {
    ApplicationCommandOptionTypes: Types, MessageButtonStyles,
    InteractionTypes, MessageComponentTypes,
  },
  MessageActionRow, MessageButton, InteractionCollector,
} = Discord;
const dehumanize = require('parse-duration');
const platformChoices = require('../../resources/platformMap.json');
const LFGEmbed = require('../../embeds/LFGEmbed');

module.exports = class LFG extends require('../../models/Interaction') {
  static enabled = true;

  static command = {
    name: 'lfg',
    description: 'Make an LFG post',
    options: [{
      type: Types.STRING,
      name: 'platform',
      description: 'Platform to recruit for',
      choices: platformChoices,
      required: true,
    }, {
      type: Types.STRING,
      name: 'place',
      description: 'Where do you want to group up?',
      required: false,
    }, {
      type: Types.STRING,
      name: 'time',
      description: 'How long do you want to farm for?',
      required: false,
    }, {
      type: Types.INTEGER,
      name: 'members',
      description: 'How many people do you need?',
      required: false,
      choices: [
        { name: '1', value: 1 },
        { name: '2', value: 2 },
        { name: '3', value: 3 },
        { name: '4', value: 4 },
      ],
    }, {
      type: Types.STRING,
      name: 'for',
      description: 'What are you farming for?',
      required: false,
    }, {
      type: Types.STRING,
      name: 'duration',
      description: 'How long are you willing to wait?',
      required: false,
    }, {
      type: Types.STRING,
      name: 'type',
      description: 'What kind of post?',
      choices: [{
        name: 'Hosting',
        value: 'Hosting',
      }, {
        name: 'LFM',
        value: 'LFM',
      }, {
        name: 'LFG',
        value: 'LFG',
      }],
    }],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const lfg = {
      author: interaction.member.user,
      location: options?.get('place')?.value || ctx.i18n`Anywhere`,
      duration: options?.get('time')?.value || ctx.i18n`Any Time`,
      goal: options?.get('for')?.value || ctx.i18n`Anything`,
      platform: options?.get('platform')?.value || ctx.platform || 'pc',
      expiry: options?.get('duration')?.value || '30m',
      expiryTs: Date.now() + dehumanize(options?.get('duration')?.value || '30m'),
      membersNeeded: options?.get('members')?.value || 4,
      members: [interaction.member.id],
      vc: interaction.member.voice,
      types: [options?.get('type')?.value || 'LFG'],
      edited: false,
    };

    const embed = new LFGEmbed(null, lfg);
    const chn = interaction.guild.channels
      .resolve((ctx.lfg?.[lfg.platform] || ctx.lfg?.[Object.keys(ctx.lfg)?.[0]]).id);

    const buttons = [
      new MessageActionRow({
        components: [
          new MessageButton({
            style: MessageButtonStyles.PRIMARY,
            customId: 'lfg_add',
            emoji: '🔰',
            label: 'Join',
          }),
          new MessageButton({
            style: MessageButtonStyles.DANGER,
            customId: 'lfg_end',
            emoji: '❌',
            label: 'End',
          }),
        ],
      }),
    ];

    const message = await chn.send({
      embeds: [embed],
      components: buttons,
    });
    if (!message) {
      return interaction.reply({ content: 'Unknown error. Could not create LFG entry.', ephemeral: true });
    }
    let deleteTimeout = setTimeout(message.delete, dehumanize(lfg.expiry));

    const collector = new InteractionCollector(interaction.client, {
      interactionType: InteractionTypes.MESSAGE_COMPONENT,
      componentType: MessageComponentTypes.BUTTON,
      message,
      guild: interaction.guild,
      channel: interaction.channel,
    });

    collector.on('end', () => {
      message.reactions.removeAll();
      lfg.expiry = 0;
      lfg.edited = true;
      message.edit({ embeds: [new LFGEmbed(null, lfg)], components: [] });
      clearTimeout(deleteTimeout);
      deleteTimeout = setTimeout(message.delete, 10000);
    });

    /**
     * Button interaction handler
     * @param {Discord.ButtonInteraction} reaction button to handle
     * @returns {Promise<void>}
     */
    const reactionHandler = async (reaction) => {
      await reaction.deferUpdate();
      if (reaction.customId === 'lfg_add') {
        if (!lfg.members.includes(reaction.user.id) && lfg.members.length <= lfg.membersNeeded) {
          lfg.members.push(reaction.user.id);
          lfg.vc = interaction.member.voice;
          lfg.edited = true;
          return message.edit({ embeds: [new LFGEmbed(null, lfg)], components: buttons });
        }
        if (lfg.members.includes(reaction.user.id) && reaction.user.id !== interaction.member.id) {
          lfg.members.splice(lfg.members.indexOf(reaction.user.id), 1);
          lfg.vc = interaction.member.voice;
          lfg.edited = true;
          return message.edit({ embeds: [new LFGEmbed(null, lfg)], components: buttons });
        }
      }
      if (reaction.user.id === interaction.member.id && reaction.customId === 'lfg_end') {
        lfg.expiry = 0;
        lfg.edited = true;
        await message.edit({ embeds: [new LFGEmbed(null, lfg)], components: [] });
        collector.stop('ended');
        return null;
      }
      return null;
    };

    collector.on('collect', reactionHandler);
    return interaction.reply({ content: 'gl;hf', ephemeral: ctx.ephemerate });
  }
};
