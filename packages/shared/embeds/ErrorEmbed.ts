import { findMonorepoRoot } from '#shared/utilities/loadParentEnvFiles';

import BaseEmbed from './BaseEmbed';

/**
 * Generates build embeds
 */
export default class ErrorEmbed extends BaseEmbed {
  /**
   * @param {Error} error - Error instance to log
   */
  constructor(error) {
    super();
    this.color = 0xff0000;
    this.title = `Error - ${process.env.SCOPE}`;
    this.description = error.message || error;
    if (error.stack) {
      const stack = error.stack.replace(new RegExp(findMonorepoRoot().replace(/\\/g, '\\'), 'ig'), '');
      this.addFields({ name: 'Stack Trace', value: `\`\`\`\n${stack}\n\`\`\`` });
    }
    this.footer.text = 'Occurred';
    this.timestamp = new Date().getTime();
  }
}
