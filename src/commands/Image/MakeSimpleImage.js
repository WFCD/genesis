'use strict';

const Jimp = require('jimp');
const CycleImageEmbed = require('../../embeds/CycleImageEmbed');

class MakeSimpleImage {
  constructor(data, readFile0, readFile1, text, fontCD, sendFileCD, message) {
    this.data = data;
    this.readFile0 = readFile0;
    this.readFile1 = readFile1;
    this.text = text;
    this.fontCD = fontCD;
    this.sendFileCD = sendFileCD;
    this.message = message;
  }


  async run() {
    const image = await Jimp.read(this.data ? this.readFile0 : this.readFile1);
    const font = await Jimp.loadFont(this.fontCD);
    image.print(font, 1060, 740, this.text);
    await image.write(this.sendFileCD);
    const embed = new CycleImageEmbed(this.data);
    this.message.channel.send({
      embed,
      files: [{ attachment: this.sendFileCD, name: 'cycle.png' }],
    });
  }
}


module.exports = MakeSimpleImage;
