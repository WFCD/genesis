import { cmds } from '#shared/resources/index';
import { withEphemeral } from '#shared/utilities/CommonFunctions';

import Interaction from '../../models/Interaction';

const content = '```haskell\nOperator, Cephalons do not g-g-g-give huuuu~~ Screw it. ⊂（♡⌂♡）⊃```';

export default class Hug extends Interaction {
  static enabled = true;

  static command = cmds.hug;

  static async commandHandler(interaction, ctx) {
    return interaction.reply(withEphemeral(ctx.ephemerate, { content }));
  }
}
