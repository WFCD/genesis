import Discord from 'discord.js';
import dehumanize from 'parse-duration';

import { cmds, platformMap as platformChoices } from '../../resources/index.js';
import LFGEmbed from '../../embeds/LFGEmbed.js';
import Interaction from '../../models/Interaction.js';

const {
  Constants: { ApplicationCommandOptionTypes: Types, MessageButtonStyles, InteractionTypes, MessageComponentTypes },
  MessageActionRow,
  MessageButton,
  InteractionCollector,
} = Discord;

const places = [
  {
    name: 'Void',
    value: 'Void',
  },
  {
    name: 'Zariman',
    value: 'Zariman',
  },
  {
    name: 'Deimos',
    value: 'Deimos',
  },
  {
    name: 'Orb Vallis',
    value: 'Orb Vallis',
  },
  {
    name: 'Cetus',
    value: 'Cetus',
  },
];
const target = [
  {
    name: 'Rep Items',
    value: 'Rep Items',
  },
  {
    name: 'Area Bosses',
    value: 'Area Bosses',
  },
  {
    name: 'Resources',
    value: 'Resources',
  },
  {
    name: 'Arcanes',
    value: 'Arcanes',
  },
  {
    name: 'Level Grinding',
    value: 'Level Grinding',
  },
  {
    name: 'Endo',
    value: 'Endo',
  },
  {
    name: 'Credits',
    value: 'Credits',
  },
];

/**
 * @param {Discord.CommandInteractionOptionResolver}  options option/arguments
 * @param {I18n} i18n internationalizer
 * @returns {string}
 */
const fmtLoc = (options, i18n) => {
  let val = '';
  if (options?.get('place')?.value) {
    val += options?.get('place')?.value;
    if (options?.get('place_custom')?.value) {
      val += ` (${options?.get('place_custom')?.value})`;
    }
  } else if (options?.get('place_custom')?.value) {
    val += options?.get('place_for')?.value;
  } else {
    val += i18n`Anywhere`;
  }
  return val;
};

/**
 * @param {Discord.CommandInteractionOptionResolver}  options option/arguments
 * @param {I18n} i18n internationalizer
 * @returns {string}
 */
const fmtThing = (options, i18n) => {
  let val = '';
  if (options?.get('for')?.value) {
    val += options?.get('for')?.value;
    if (options?.get('for_custom')?.value) {
      val += ` (${options?.get('for_custom')?.value})`;
    }
  } else if (options?.get('for_custom')?.value) {
    val += options?.get('for_custom')?.value;
  } else {
    val += i18n`Anything`;
  }
  return val;
};

export default class LFG extends Interaction {
  static enabled = true;

  static command = {
    ...cmds.lfg,
    options: [
      {
        ...cmds.platform,
        type: Types.STRING,
        choices: platformChoices,
        required: true,
      },
      {
        ...cmds['lfg.place'],
        type: Types.STRING,
        choices: places,
        required: false,
      },
      {
        ...cmds['lfg.place.custom'],
        type: Types.STRING,
        required: false,
      },
      {
        ...cmds['lfg.time'],
        type: Types.STRING,
        required: false,
      },
      {
        ...cmds['lfg.members'],
        type: Types.INTEGER,
        required: false,
        choices: [
          { name: '1', value: 1 },
          { name: '2', value: 2 },
          { name: '3', value: 3 },
          { name: '4', value: 4 },
        ],
      },
      {
        ...cmds['lfg.for'],
        type: Types.STRING,
        choices: target,
        required: false,
      },
      {
        ...cmds['lfg.for.custom'],
        type: Types.STRING,
        required: false,
      },
      {
        ...cmds['lfg.duration'],
        type: Types.STRING,
        required: false,
      },
      {
        ...cmds['lfg.type'],
        type: Types.STRING,
        choices: [
          {
            name: 'Hosting',
            value: 'Hosting',
          },
          {
            name: 'LFM',
            value: 'LFM',
          },
          {
            name: 'LFG',
            value: 'LFG',
          },
        ],
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const lfg = {
      author: interaction.member.user,
      location: fmtLoc(options, ctx.i18n),
      duration: options?.get('time')?.value || ctx.i18n`Any Time`,
      goal: fmtThing(options, ctx.i18n),
      platform: options?.get('platform')?.value || ctx.platform || 'pc',
      expiry: options?.get('duration')?.value || '30m',
      expiryTs: Date.now() + dehumanize(options?.get('duration')?.value || '30m'),
      membersNeeded: options?.get('members')?.value || 4,
      members: [interaction.member.id],
      vc: interaction.member.voice,
      types: [options?.get('type')?.value || 'LFG'],
      edited: false,
    };

    const embed = new LFGEmbed(lfg, ctx);
    const rawChn = ctx.lfg?.[lfg.platform] || ctx.lfg?.[Object.keys(ctx.lfg)?.[0]];
    if (!rawChn) return interaction.reply({ content: ctx.i18n`Couldn't find channel.`, ephemeral: ctx.ephemerate });
    const chn = interaction.guild.channels.resolve(rawChn.id);
    if (!chn) return interaction.reply({ content: ctx.i18n`Couldn't find channel.`, ephemeral: ctx.ephemerate });

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
      message.edit({ embeds: [new LFGEmbed(lfg, ctx)], components: [] });
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
          return message.edit({ embeds: [new LFGEmbed(lfg, ctx)], components: buttons });
        }
        if (lfg.members.includes(reaction.user.id) && reaction.user.id !== interaction.member.id) {
          lfg.members.splice(lfg.members.indexOf(reaction.user.id), 1);
          lfg.vc = interaction.member.voice;
          lfg.edited = true;
          return message.edit({ embeds: [new LFGEmbed(lfg, ctx)], components: buttons });
        }
      }
      if (reaction.user.id === interaction.member.id && reaction.customId === 'lfg_end') {
        lfg.expiry = 0;
        lfg.edited = true;
        await message.edit({ embeds: [new LFGEmbed(lfg, ctx)], components: [] });
        collector.stop('ended');
        return undefined;
      }
      return undefined;
    };

    collector.on('collect', reactionHandler);
    return interaction.reply({ content: 'gl;hf', ephemeral: ctx.ephemerate });
  }
}
