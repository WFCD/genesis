import Discord from 'discord.js';
import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';

const {
  Constants: { ApplicationCommandOptionTypes: Types },
} = Discord;

const jokes = [
  "Joke's on you. Try again next time",
  'Lotus says it is certain',
  'Darvo says is decidedly so',
  'Without a doubt',
  'Yes - definitely',
  'You may rely on it',
  'As I see it, yes',
  'Most likely',
  'Outlook good',
  'Yes',
  'Signs point to yes',
  'Reply hazy, try again',
  'Ask again later',
  'Better not tell you now',
  'Cannot predict now',
  'Concentrate and ask again',
  "Don't count on it",
  'My reply is no',
  'My sources say no',
  'Outlook not so good',
  'Very doubtful',
];

export default class EightBall extends Interaction {
  static enabled = true;

  static command = {
    ...cmds['8ball'],
    options: [
      {
        ...cmds['8ball.question'],
        type: Types.STRING,
        required: true,
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    return interaction.reply({
      content: `:8ball: | ${jokes[Math.floor(Math.random() * jokes.length)]} | ||_${interaction.options.getString(
        'question'
      )}_||`,
      ephemeral: ctx.ephemerate,
    });
  }
}
