const Jimp = require('jimp')

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
   
  
    run() {

      let _fontCD = this.fontCD
      let _text = this.text
      let _sendFileCD = this.sendFileCD
      let _data = this.data

      let message = this.message

      Jimp.read(this.data ? this.readFile0 : this.readFile1, function (err, image) {
        Jimp.loadFont(_fontCD).then(function (font) {
            image.print(font, 1060, 740, _text); 
            image.write(_sendFileCD).then(message.channel.send({"embed": {
              color: _data ? 0xB64624 : 0x000066,
              image: {
                  url: `attachment://cycle.png`
              }
          },
          files: [{ attachment: _sendFileCD, name: 'cycle.png' }]
        }))
      })
    })
  }
}


module.exports = MakeSimpleImage;
