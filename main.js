'use strict';

/**
 * Raven client for logging errors and debugging events
 * @type {Raven}
 */
const Raven = require('raven');

/**
 * Bot class for interacting with discord and handling commands
 * @type {Genesis}
 */
const Genesis = require('./src/bot.js');

/**
 * Key for connecting to Raven DSR
 * @type {string}
 */
const key = process.env.RAVEN_KEY;
/**
 * Secret for connecting to Raven DSR
 * @type {string}
 */
const secret = process.env.RAVEN_SECRET;

/**
 * Raven client instance for logging errors and debugging events
 */
const client = new Raven.Client(key && secret && `https://${key}:${secret}@sentry.io/92737`);


client.patchGlobal(client, (error) => {
  // eslint-disable-next-line no-console
  console.error(`${error.message}`);
});
client.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error(`${error.message}`);
  // eslint-disable-next-line no-console
  console.info('Goodbye, Cruel World');
  process.exit(1);
});

const bot = new Genesis(client);

bot.start();
