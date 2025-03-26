import BaseEmbed from './BaseEmbed.js';

/**
 * Generates enemy embeds
 */
export default class PatchnotesEmbed extends BaseEmbed {
  /**
   * @param {Array.<Component>} patchlogs - List of components for an item or weapon
   * @param {I18n} i18n internationalization template
   */
  constructor(patchlogs, { i18n }) {
    super();
    this.setTitle(i18n`Patch Notes`);
    this.setColor(0x819eaa);
    const fields = patchlogs.map((patchlog) => {
      const tokens = [];
      tokens.push(
        i18n`**Published:** ${new Date(patchlog.date).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}\n`
      );
      tokens.push(patchlog.url ? i18n`[Full Notes](${patchlog.url})\n` : '');
      tokens.push(patchlog.imgUrl ? i18n`[Thumbnail](${patchlog.imgUrl})\n` : '');
      tokens.push(patchlog.additions.length ? i18n`**Additions:**\n\t${patchlog.additions}\n` : '');
      tokens.push(patchlog.changes.length ? i18n`**Changes:**\n\t${patchlog.changes}\n` : '');
      tokens.push(patchlog.fixes.length ? i18n`**Fixes:**\n\t${patchlog.fixes}\n` : '');

      tokens.push('\n\u200B\n');
      return {
        name: patchlog.name,
        value: tokens.join(''),
      };
    });

    this.setFields(fields);
    if (patchlogs[0].imgUrl) {
      this.setImage(patchlogs[0].imgUrl);
    }
  }
}
