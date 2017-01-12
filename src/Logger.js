'use strict';

/**
 * A collection of methods for logging
 * @typedef {Object.<function>} Logger
 * @property {function} debug   - Logs a debug message
 * @property {function} info    - Logs an info message
 * @property {function} warning - Logs a warning message
 * @property {function} error   - Logs an error message
 * @property {function} fatal   - Logs a fatal message. The program should terminate after such
                                  an error
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
  // eslint-disable-next-line func-names
  Logger.prototype[level.toLowerCase()] = function (message) {
    if (levels.indexOf(level) >= levels.indexOf(logLevel)) {
      // eslint-disable-next-line no-console
      console.log(`[${level}] ${message}`);
    }

    if (level === 'fatal') {
      this.ravenClient.captureMessage(message, {
        level: 'fatal',
      });
    }
    if (level === 'error') {
      this.ravenClient.captureException(message);
    }
  };
});

module.exports = Logger;
