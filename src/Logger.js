'use strict';

/**
 * A collection of methods for logging
 * @property {function} debug   - Logs a debug message
 * @property {function} info    - Logs an info message
 * @property {function} warning - Logs a warning message
 * @property {function} error   - Logs an error message
 * @property {function} fatal   - Logs a fatal message. The program should terminate after such
*                                 an error
 */
class Logger {
  /**
   * @param {Raven} ravenClient client for logging errors and fatal errors
   */
  constructor(ravenClient) {
    this.ravenClient = ravenClient;
  }
}
const logLevel = process.env.LOG_LEVEL || 'ERROR';
const levels = [
  'DEBUG',
  'INFO',
  'WARNING',
  'ERROR',
  'FATAL',
];

levels.forEach((level) => {
  Logger.prototype[level.toLowerCase()] = (message) => {
    if ((levels.indexOf(level) >= levels.indexOf(logLevel)) && levels.indexOf(level) < 3) {
      if (level.toLowerCase() === 'debug') {
        const verboseMsg = `[${level}] ${message}`;
        if (`[${level}] "${message}"` !== verboseMsg) {
          // eslint-disable-next-line no-console
          console.log(verboseMsg);
        }
      } else {
        // eslint-disable-next-line no-console
        console.log(`[${level}] ${message}`);
      }
    }

    if (level.toLowerCase() === 'fatal' && this.ravenClient) {
      this.ravenClient.captureMessage(message, {
        level: 'fatal',
      });
      process.exit(4);
    }
    if (level.toLowerCase() === 'error') {
      // eslint-disable-next-line no-console
      console.error(`[${level}] ${message}`);
      if (this && this.ravenClient) {
        this.ravenClient.captureException(message);
      }
    }
  };
});

module.exports = Logger;
