import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';

const content = '```haskell\nOperator, Cephalons do not g-g-g-give huuuu~~ Screw it. ⊂（♡⌂♡）⊃```';

export default class Hug extends Interaction {
  static enabled = true;

  static command = cmds.hug;

  static async commandHandler(interaction, ctx) {
    return interaction.reply({ content, ephemeral: ctx.ephemerate });
  }
}
