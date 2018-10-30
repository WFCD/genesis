'use strict';

const fs = require('fs');
const Jimp = require('jimp');
const CycleImageEmbed = require('../../embeds/CycleImageEmbed');

const fsCb = (err) => { if (err) console.error(err); };

class MakeSimpleImage {
  constructor(data, readFile0, readFile1, text, fontCD, sendFileCD, message) {
    this.data = data;
    this.readFile0 = readFile0;
    this.readFile1 = readFile1;
    this.text = text;
    this.fontCD = fontCD;
    this.sendFileCD = sendFileCD.replace('{ts}', Date.now());
    this.message = message;
  }

  async run() {
    const image = await Jimp.read(this.data ? this.readFile0 : this.readFile1);
    const font = await Jimp.loadFont(this.fontCD);
    image.print(font, 1060, 740, this.text);
    await image.write(this.sendFileCD);
    const embed = new CycleImageEmbed(this.data);
    setTimeout(async () => {
      await this.message.channel.send({
        embed,
        files: [{ attachment: this.sendFileCD, name: 'cycle.png' }],
      });
      fs.unlink(this.sendFileCD, fsCb);
    }, 100);
  }
}


module.exports = MakeSimpleImage;
