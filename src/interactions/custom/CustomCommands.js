import { ApplicationCommandOptionType, PermissionsBitField } from 'discord.js';

import { createGroupedArray } from '../../utilities/CommonFunctions.js';
import Collectors from '../../utilities/Collectors.js';
import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';

const nameReg = /^[\w-]{1,32}$/u;

export default class CustomCommands extends Interaction {
  static enabled = true;

  static command = {
    ...cmds.cc,
    defaultMemberPermissions: PermissionsBitField.Flags.ManageGuild,
    options: [
      {
        ...cmds['cc.add'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            ...cmds['cc.add.call'],
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            ...cmds['cc.add.response'],
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        ...cmds['cc.remove'],
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            ...cmds['cc.remove.call'],
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        ...cmds['cc.list'],
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const ephemeral = ctx.ephemerate;
    const action = options?.getSubcommand(false);
    const call = options.getString('call', false);
    const response = options.getString('response', false);

    switch (action) {
      case 'add':
        if (nameReg.test(call) && !(await ctx.settings.getCustomCommandRaw(interaction.guild, call))) {
          await ctx.settings.addCustomCommand(interaction.guild, call, response, interaction.user.id);
          await ctx.handler.loadCustomCommands(interaction.guild.id);
          return interaction.reply({ content: 'Added & reloaded guild commands', ephemeral });
        }
        return interaction.reply({
          content: 'Not possible, command name is either invalid, or another with the same name exists',
          ephemeral,
        });
      case 'remove':
        const onConfirm = async () => {
          await ctx.settings.deleteCustomCommand(interaction.guild, call);
          return interaction.editReply('done');
        };
        const onDeny = async () => interaction.editReply('ok');
        return Collectors.confirmation(interaction, onConfirm, onDeny, ctx);
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
        const embeds = metaGroups.map((metaGroup) => ({
          color: 0x301934,
          fields: metaGroup,
          title: ctx.i18n`Custom Commands`,
        }));
        return interaction.reply({ embeds, ephemeral });
    }
    return undefined;
  }
}
