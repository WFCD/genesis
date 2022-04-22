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
    this.color = 0xff0000;
    this.title = `Error - ${process.env.SCOPE}`;
    this.description = error.message || error;
    if (error.stack) {
      const stack = error.stack.replace(
        new RegExp(process.cwd().replace('/src/notifications', '').replace(/\\/g, '\\'), 'ig'),
        ''
      );
      this.addField('Stack Trace', `\`\`\`\n${stack}\n\`\`\``);
    }
    this.footer.text = 'Occurred';
    this.timestamp = new Date();
  }
}
