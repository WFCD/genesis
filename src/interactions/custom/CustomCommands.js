'use strict';

const {
  // eslint-disable-next-line no-unused-vars
  Constants: { ApplicationCommandOptionTypes: Types },
} = require('discord.js');
const { createGroupedArray } = require('../../CommonFunctions.js');
const { createConfirmationCollector } = require('../../CommonFunctions');

const nameReg = /^[\w-]{1,32}$/u;

module.exports = class CustomCommands extends require('../../models/Interaction') {
  static enabled = true;
  static elevated = true;
  static command = {
    name: 'cc',
    description: 'Manage custom commands',
    options: [{
      type: Types.SUB_COMMAND,
      name: 'add',
      description: 'Add a custom command',
      options: [{
        type: Types.STRING,
        name: 'call',
        description: 'Sets the command call for the new custom command',
        required: true,
      }, {
        type: Types.STRING,
        name: 'response',
        description: 'Set what the call will respond to',
        required: true,
      }],
    }, {
      type: Types.SUB_COMMAND,
      name: 'remove',
      description: 'Remove a custom command by name',
      options: [{
        type: Types.STRING,
        name: 'call',
        description: 'Which call to remove?',
        required: true,
      }],
    }, {
      type: Types.SUB_COMMAND,
      name: 'list',
      description: 'List all subcommands for the guild',
    }],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const ephemeral = ctx.ephemerate;
    const action = options?.getSubcommand(false);
    const call = options.getString('call', false);
    const response = options.getString('response', false);

    switch (action) {
      case 'add':
        if (nameReg.test(call)
          && !(await ctx.settings.getCustomCommandRaw(interaction.guild, call))) {
          await ctx.settings.addCustomCommand(
            interaction.guild, call, response, interaction.user.id,
          );
          await ctx.handler.loadCustomCommands(interaction.guild.id);
          return interaction.reply({ content: 'Added & reloaded guild commands', ephemeral });
        }
        return interaction.reply({ content: 'Not possible, command name is either invalid, or another with the same name exists', ephemeral });
      case 'remove':
        const onConfirm = async () => {
          await ctx.settings.deleteCustomCommand(interaction.guild, call);
          return interaction.editReply('done');
        };
        const onDeny = async () => interaction.editReply('ok');
        return createConfirmationCollector(interaction, onConfirm, onDeny, ctx);
      case 'list':
        const ccs = [];
        const gcc = await ctx.settings.getCustomCommandsForGuild(interaction.guild);
        gcc.forEach((cc) => {
          if (cc.response.length > 1024) {
            ccs.push({ name: cc.call, value: decodeURIComponent(cc.response.substring(0, 1020)) });
            ccs.push({ name: '\u200B', value: decodeURIComponent(cc.response.substring(1021)) });
          } else {
            ccs.push({ name: cc.call, value: decodeURIComponent(cc.response) });
          }
        });
        const metaGroups = createGroupedArray(ccs, 10);
        const embeds = metaGroups.map(metaGroup => ({ color: 0x301934, fields: metaGroup, title: ctx.i18n`Custom Commands` }));
        return interaction.reply({ embeds, ephemeral });
    }
    return null;
  }
};
