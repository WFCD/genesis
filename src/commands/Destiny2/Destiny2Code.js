'use strict';

const Command = require('../../models/Command.js');

const d2codes = [
  'Double Banshee – 7MM-VPD-MHP',
  'Oracle 99 – RXC-9XJ-4MH',
  'Sign of the Finite: 7F9-767-F74',
  'Ab Aeterno: JDT-NLC-JKM',
  'The Visionary: XFV-KHP-N97',
  'Binding Focus: FJ9-LAM-67F',
  'Illusion of Light: JD7-4CM-HJG',
  'Field of Light: JNX-DMH-XLA',
  'Jagged Edge: 7CP-94V-LFP',
  'Insula Thesauraria: 3VF-LGC-RLX',
  'Flames of Forgotten Truth: A7LFYC44X',
  'The Unimagined Plane: X9FGMAH6D',
  'The Reflective Proof: N3LXN6PXF',
  'Note of Conquest: X4C-FGX-MX3',
  'Destiny Collectors Card – Class: Warlock – YKA-RJG-MH9',
  'Destiny Collectors Card – Class: Titan – 3DA-P4X-F6A',
  'Destiny Collectors Card – Class: Hunter – MVD-4N3-NKH',
  'Destiny Collectors Card – Fallen: Riksis, Devil Archon – TCN-HCD-TGY',
  'Destiny Collectors Card – Destination: Cosmodrome – HDX-ALM-V4K',
  'Destiny Collectors Card – Enemy: Hive – 473-MXR-3X9',
  'Destiny Collectors Card – Destination: The Ocean Of Storms - Moon – JMR-LFN-4A3',
];

/**
 * Generates a random Grimore card and code to redeem on Bungie.net
 */
class Destiny2Code extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'Destiny2.d2code', 'd2code', 'Outputs a random D2 Grimore card to the specified user', 'DESTINY2');
  }

  async run(message) {
    this.messageManager.sendMessage(message, `\`\`\`haskell\n${d2codes[Math.floor(Math.random() * d2codes.length)]}\n\`\`\``, true, true);

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Destiny2Code;
