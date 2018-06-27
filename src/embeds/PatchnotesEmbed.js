'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class PatchnotesEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesisad
   * @param {Array.<Component>} patchlogs - List of components for an item or weapon
   */
  constructor(bot, patchlogs) {
    super();
    this.title = 'Patch Notes';
    this.color = 0x819EAA;
    this.fields = patchlogs.map((patchlog) => {
      const tokens = [];
      tokens.push(`**Published:** ${new Date(patchlog.date).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}\n`);
      tokens.push(patchlog.url ? `[Full Notes](${patchlog.url})\n` : '');
      tokens.push(patchlog.imgUrl ? `[Thumbnail](${patchlog.imgUrl})\n` : '');
      tokens.push(patchlog.additions.length ? `**Additions:**\n\t${patchlog.additions}\n` : '');
      tokens.push(patchlog.changes.length ? `**Changes:**\n\t${patchlog.changes}\n` : '');
      tokens.push(patchlog.fixes.length ? `**Fixes:**\n\t${patchlog.fixes}\n` : '');

      tokens.push('\n\u200B\n');
      return {
        name: patchlog.name,
        value: tokens.join(''),
      };
    });
  }
}

module.exports = PatchnotesEmbed;
