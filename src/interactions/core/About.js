import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';
import pkg from '../../../package.json' with { type: 'json' };

export default class About extends Interaction {
  static enabled = true;

  static command = cmds.about;

  static async commandHandler(interaction) {
    return interaction.reply({
      embeds: [
        {
          title: `Cephalon Genesis - v${pkg.version}`,
          fields: [
            {
              name: 'About',
              value:
                'Cephalon Genesis exists to help Discord Tenno find all the information they need about Warframe that you might',
              inline: false,
            },
            {
              name: '\u200B',
              value: `Feel free to check out Genesis' app page [here](https://discord.com/discovery/applications/167095321740967937), 
                As well as on the [help page](https://genesis.warframestat.us)`,
              inline: true,
            },
            {
              name: '\u200B',
              value: `Genesis is an [open-source](https://github.com/wfcd/genesis) and freely provided bot and service, but any help towards subsidizing development and server costs helps out.`,
              inline: true,
            },
            {
              name: 'Support',
              value: `- [the discord store](https://discord.com/discovery/applications/167095321740967937/store)
- [patreon](https://patreon.com/cephalongenesis)
- [kofi](https://ko-fi.com/tobiah)
- [Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2SHK99GUPGRFS)`,
              inline: false,
            },
            {
              name: 'Authors',
              value: '[Tobiah](https://github.com/tobitenno) and [nspace](https://github.com/nspacestd)',
              inline: false,
            },
          ],
          footer: {
            text: 'Cephalon Genesis, now on more than 25k guilds!',
          },
        },
      ],
      ephemeral: true,
    });
  }
}
