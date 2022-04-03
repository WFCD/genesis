import Interaction from '../../models/Interaction.js';

export default class About extends Interaction {
  static enabled = true;

  static command = {
    name: 'about',
    description: 'Tell me about the bot!',
  };

  static async commandHandler(interaction, ctx) {
    return interaction.reply({
      embeds: [
        {
          title: 'Cephalon Genesis',
          fields: [
            {
              name: '\u200B',
              value:
                'Feel free to check out [Genesis here](https://discordbots.org/bot/genesis),' +
                '\nAs well as on the [help page](https://genesis.warframestat.us),' +
                "\nand come support Genesis, if you're interested, [on patreon](https://patreon.com/cephalongenesis).",
              inline: true,
            },
            {
              name: '\u200B',
              value: `For help information, type \`${ctx.prefix}help\``,
              inline: false,
            },
            {
              name: 'Authors',
              value: '[Tobiah](https://github.com/tobitenno) and [nspace](https://github.com/nspacestd)',
            },
            {
              name: 'About',
              value:
                'Cephalon Genesis exists to help Discord Tenno find all the information they need about Warframe that you might',
            },
            {
              name: '\u200B',
              value:
                'Genesis is an open-source and freely provided bot and service,' +
                '\nbut any help towards subsidizing development and server costs helps out.' +
                "\nCome support Genesis [on patreon](https://patreon.com/cephalongenesis) if you're interested." +
                '\nWe also love and welcome direct [Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=2SHK99GUPGRFS)' +
                " and [Bitcoin](bitcoin:1HU6BtbsJu3ttbc2qKGFGR2hQpou9JSkjB) support,\nbecause we know one way doesn't fit all.",
              inline: true,
            },
            {
              name: 'Authors',
              value: '[Tobiah](https://github.com/tobitenno) and [nspace](https://github.com/nspacestd)',
            },
          ],
          footer: {
            text: 'Cephalon Genesis, now on more than 26,000 guilds!',
          },
        },
      ],
      ephemeral: true,
    });
  }
}
