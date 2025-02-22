import BaseEmbed from './BaseEmbed.js';

/**
 * Generates build embeds
 */
export default class BuildEmbed extends BaseEmbed {
  /**
   * @param {Build} build - build to represent
   */
  constructor(build) {
    super();
    const sections = build.body.split(';');
    this.setColor(0xf1c40f);
    this.setTitle(build.title);
    this.setFields([]);
    sections.forEach((value, index) => {
      if (index === 0) {
        this.setDescription(value);
      } else {
        this.addFields({
          name: '\u200B',
          value,
        });
      }
    });
    this.setImage({ url: build.url || build.image });
    this.setFooter({
      text: `${build.id}${build.isPublic ? ' • Public' : ''} • Owned by ${
        typeof build.owner === 'object' ? build.owner.tag : build.owner
      }`,
    });
  }
}
