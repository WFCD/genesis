import BaseEmbed from './BaseEmbed.js';

/**
 * Generates build embeds
 */
export default class BuildEmbed extends BaseEmbed {
  /**
   * @param {Error} error - Error instance to log
   */
  constructor(error) {
    super();
    this.setColor(0xff0000);
    this.setTitle(`Error - ${process.env.SCOPE}`);
    this.setDescription(error.message || error);
    if (error.stack) {
      const stack = error.stack.replace(
        new RegExp(process.cwd().replace('/src/notifications', '').replace(/\\/g, '\\'), 'ig'),
        ''
      );
      this.addFields({ name: 'Stack Trace', value: `\`\`\`\n${stack}\n\`\`\`` });
    }
    this.setFooter({ text: 'Occurred' });
    this.setTimestamp(new Date().getTime());
  }
}
