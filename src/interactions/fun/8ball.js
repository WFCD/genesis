'use strict';

const { Constants: { ApplicationCommandOptionTypes: Types } } = require('discord.js');

const jokes = [
  'Joke\'s on you. Try again next time',
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
  'Don\'t count on it',
  'My reply is no',
  'My sources say no',
  'Outlook not so good',
  'Very doubtful',
];

module.exports = class EightBall extends require('../../models/Interaction') {
  static enabled = true;

  static command = {
    name: '8ball',
    description: 'Get your 8Ball question answered!',
    options: [{
      type: Types.STRING,
      name: 'question',
      description: 'What do you want the all-knowing machine to answer?',
      required: true,
    }],
  };

  static async commandHandler(interaction) {
    return interaction.reply({
      content: `:8ball: | ${jokes[Math.floor(Math.random() * jokes.length)]}`,
    });
  }
};
