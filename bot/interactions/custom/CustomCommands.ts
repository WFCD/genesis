import { ApplicationCommandOptionType as Types, PermissionFlagsBits } from 'discord.js';

import { createGroupedArray, withEphemeral } from '#shared/utilities/CommonFunctions';
import Collectors from '#shared/utilities/Collectors';
import { cmds } from '#shared/resources/index';

import Interaction from '../../models/Interaction';

const nameReg = /^[\w-]{1,32}$/u;

export default class CustomCommands extends Interaction {
  static enabled = true;

  static command = {
    ...cmds.cc,
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
    options: [
      {
        ...cmds['cc.add'],
        type: Types.Subcommand,
        options: [
          {
            ...cmds['cc.add.call'],
            type: Types.String,
            required: true,
          },
          {
            ...cmds['cc.add.response'],
            type: Types.String,
            required: true,
          },
          {
            ...cmds['cc.add.ephemeral'],
            type: Types.Boolean,
            description: 'Only visible to the user who ran the command',
          },
        ],
      },
      {
        ...cmds['cc.remove'],
        type: Types.Subcommand,
        options: [
          {
            ...cmds['cc.remove.call'],
            type: Types.String,
            required: true,
          },
        ],
      },
      {
        ...cmds['cc.update'],
        type: Types.Subcommand,
        options: [
          {
            ...cmds['cc.update.call'],
            type: Types.String,
            required: true,
          },
          {
            ...cmds['cc.update.response'],
            type: Types.String,
          },
          {
            ...cmds['cc.update.ephemeral'],
            type: Types.Boolean,
          },
        ],
      },
      {
        ...cmds['cc.list'],
        type: Types.Subcommand,
      },
      {
        ...cmds['cc.reload'],
        type: Types.Subcommand,
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    const { options } = interaction;
    const ephemeral = ctx.ephemerate;
    const action = options?.getSubcommand(false);
    const call = options.getString('call', false);
    const response = options.getString('response');
    const commandEphemeral = options.getBoolean('ephemeral');

    switch (action) {
      case 'add':
        if (
          nameReg.test(call) &&
          response &&
          !(await ctx.settings.customCommands.getCustomCommandRaw(interaction.guild, call))
        ) {
          await ctx.settings.customCommands.addCustomCommand(
            interaction.guild,
            call,
            response,
            interaction.user.id,
            commandEphemeral ?? false
          );
          await ctx.handler.loadCustomCommands(interaction.guild.id);
          return interaction.reply(withEphemeral(ephemeral, { content: 'Added & reloaded guild commands' }));
        }
        return interaction.reply(
          withEphemeral(ephemeral, {
            content: 'Not possible, command name is either invalid, or another with the same name exists',
          })
        );
      case 'remove': {
        const onConfirm = async () => {
          await ctx.settings.customCommands.deleteCustomCommand(interaction.guild, call);
          await ctx.handler.loadCustomCommands(interaction.guild.id);
          return interaction.editReply(withEphemeral(ephemeral, { content: 'done', components: [] }));
        };
        const onDeny = async () => interaction.editReply(withEphemeral(ephemeral, { content: 'ok', components: [] }));
        return Collectors.confirmation(interaction, onConfirm, onDeny, ctx);
      }
      case 'update': {
        if (response === null && commandEphemeral === null) {
          return interaction.reply(
            withEphemeral(ephemeral, { content: 'Provide response and/or ephemeral to update' })
          );
        }
        const patch: { response?: string; ephemeral?: boolean } = {};
        if (response !== null) patch.response = response;
        if (commandEphemeral !== null) patch.ephemeral = commandEphemeral;
        const updated = await ctx.settings.customCommands.updateCustomCommand(interaction.guild, call, patch);
        if (!updated) {
          return interaction.reply(withEphemeral(ephemeral, { content: 'Command not found' }));
        }
        await ctx.handler.loadCustomCommands(interaction.guild.id);
        return interaction.reply(withEphemeral(ephemeral, { content: 'Updated & reloaded guild commands' }));
      }
      case 'list': {
        const gcc = await ctx.settings.customCommands.getCustomCommandsForGuild(interaction.guild);
        if (!gcc.length) {
          return interaction.reply(
            withEphemeral(ephemeral, {
              embeds: [
                {
                  color: 0x301934,
                  title: ctx.i18n`Custom Commands`,
                  description: ctx.i18n`No custom commands configured.`,
                },
              ],
            })
          );
        }

        const ccs = [];
        gcc.forEach((cc) => {
          const label = cc.ephemeral ? `${cc.call} (ephemeral)` : cc.call;
          if (cc.response.length > 1024) {
            ccs.push({ name: label, value: decodeURIComponent(cc.response.substring(0, 1020)) });
            ccs.push({ name: '\u200B', value: decodeURIComponent(cc.response.substring(1021)) });
          } else {
            ccs.push({ name: label, value: decodeURIComponent(cc.response) });
          }
        });
        const metaGroups = createGroupedArray(ccs, 10);
        const embeds = metaGroups.map((metaGroup) => ({
          color: 0x301934,
          fields: metaGroup,
          title: ctx.i18n`Custom Commands`,
        }));
        return interaction.reply(withEphemeral(ephemeral, { embeds }));
      }
      case 'reload': {
        if (interaction.user.id !== interaction.guild.ownerId) {
          return interaction.reply(
            withEphemeral(true, { content: 'Only the server owner can reload custom commands.' })
          );
        }
        await ctx.handler.loadCustomCommands(interaction.guild.id);
        const count = (await ctx.settings.customCommands.getCustomCommandsForGuild(interaction.guild)).length;
        return interaction.reply(
          withEphemeral(ephemeral, { content: `Reloaded ${count} custom command${count === 1 ? '' : 's'}` })
        );
      }
    }
    return undefined;
  }
}
