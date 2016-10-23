'use strict';

const Raven = require('raven');
const Genesis = require('./src/bot.js');

const key = process.env.RAVEN_KEY;
const secret = process.env.RAVEN_SECRET;
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
