'use strict';

const { Constants: { ApplicationCommandOptionTypes: Types } } = require('discord.js');
const dehumanize = require('parse-duration');
const platformChoices = require('../../resources/platformMap.json');
const LFGEmbed = require('../../embeds/LFGEmbed');

module.exports = class LFG extends require('../../models/Interaction') {
  static enabled = true;

  static command = {
    name: 'lfg',
    description: 'Price check an item',
    options: [{
      type: Types.STRING,
      name: 'platform',
      description: 'Platform to check for data',
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

    const embed = new LFGEmbed(undefined, lfg);
    const chn = interaction.guild.channels
      .resolve((ctx.lfg[lfg.platform] || ctx.lfg[Object.keys(ctx.lfg)[0]]).id);
    const msg = await chn.send({ embeds: [embed] });
    if (!msg) {
      return interaction.reply('Unknown error. Could not create LFG entry.');
    }
    let deleteTimeout = interaction.client.setTimeout(msg.delete, dehumanize(lfg.expiry));
    msg.react('🔰');
    msg.react('❌');

    const collector = msg.createReactionCollector((reaction, user) => (['🔰', '❌'].includes(reaction.emoji.name)) && user.id !== msg.guild.me.id,
      { time: dehumanize(lfg.expiry), dispose: true });

    collector.on('end', () => {
      msg.reactions.removeAll();
      lfg.expiry = 0;
      lfg.edited = true;
      msg.edit({ embed: new LFGEmbed(this.bot, lfg) });
      clearTimeout(deleteTimeout);
      deleteTimeout = setTimeout(msg.delete, 10000);
    });

    collector.on('collect', (reaction, user) => {
      if (!lfg.members.includes(user.id) && lfg.members.length <= lfg.membersNeeded) {
        lfg.members.push(user.id);
        lfg.vc = interaction.member.voice;
        lfg.edited = true;
        msg.edit({ embed: new LFGEmbed(this.bot, lfg) });
      }
      if (user.id === interaction.member.id) {
        if (reaction.emoji.name === '❌') {
          lfg.expiry = 0;
          lfg.edited = true;
          msg.edit({ embed: new LFGEmbed(this.bot, lfg) });
          collector.stop();
        }
        try {
          reaction.users.remove(interaction.member.id);
        } catch (e) {
          this.logger.debug(e);
        }
      }
    });

    collector.on('remove', (reaction, user) => {
      if (lfg.members.includes(user.id) && user.id !== interaction.member.id && reaction.emoji.name === '🔰') {
        lfg.members.splice(lfg.members.indexOf(user.id), 1);
        lfg.vc = interaction.member.voice;
        lfg.edited = true;
        msg.edit({ embed: new LFGEmbed(this.bot, lfg) });
      }
    });
    return interaction.reply({ content: 'gl;hf', ephemeral: true });
  }
};
