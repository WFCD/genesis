import { Client, WebhookClient, GatewayIntentBits, Events } from 'discord.js';

import WorldStateClient from '#shared/utilities/WorldStateClient';
import type { Database as DatabaseFacade } from '#shared/types/database';
import type { Logger } from '#shared/types/logger';
import Database from '#shared/settings/Database';
import logger from '#shared/utilities/Logger';

import type DynamicVoiceHandler from './eventHandlers/DynamicVoiceHandler';
import EventHandler from './eventHandlers/EventHandler';

const unlog = {
  debug: ['WS_CONNECTION_TIMEOUT'],
  error: /^(Unknown Message)/gi,
};

export default class Genesis {
  client: Client;

  token: string;

  logger: Logger;

  prefix: string;

  readyToExecute = false;

  owner: string | undefined;

  settings: DatabaseFacade;

  ws: WorldStateClient;

  eventHandler: EventHandler;

  dynamicVoiceHandler?: DynamicVoiceHandler;

  shards: number[];

  shardTotal: string | number;

  clusterId: string | number;

  controlHook?: WebhookClient;

  bugHook?: WebhookClient;

  constructor(
    discordToken: string,
    {
      prefix = process.env.PREFIX,
      owner = undefined,
      shards = [0],
    }: { prefix?: string; owner?: string; shards?: number[] } = {}
  ) {
    this.client = new Client({
      allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
      shards,
      shardCount: Number(process.env.SHARDS || 1),
      presence: {
        status: 'dnd',
        afk: false,
        activities: [
          {
            name: 'Starting...',
          },
        ],
      },
      intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });

    this.token = discordToken;
    this.logger = logger as Logger;
    this.prefix = prefix;
    this.owner = owner;

    return (async () => {
      this.settings = (await Database.build(this)) as unknown as DatabaseFacade;
      this.ws = new WorldStateClient(this.logger);
      await WorldStateClient.whenReady();
      this.eventHandler = new EventHandler(this);
      this.shards = shards;
      this.shardTotal = process.env.SHARDS || 1;
      this.clusterId = process.env.CLUSTER_ID || 0;

      if (process.env.CONTROL_WH_ID) {
        this.controlHook = new WebhookClient({
          id: process.env.CONTROL_WH_ID,
          token: process.env.CONTROL_WH_TOKEN,
        });
      }
      if (process.env.BUG_WH_ID) {
        this.bugHook = new WebhookClient({
          id: process.env.BUG_WH_ID,
          token: process.env.BUG_WH_TOKEN,
        });
      } else if (process.env.CONTROL_WH_ID) {
        this.bugHook = this.controlHook;
      }
      return this;
    })() as unknown as Genesis;
  }

  async setupHandlers() {
    this.client.on(Events.ClientReady, async () =>
      this.eventHandler.handleEvent({ event: Events.ClientReady, args: [] })
    );

    this.client.on(Events.GuildCreate, async (guild) =>
      this.eventHandler.handleEvent({ event: Events.GuildCreate, args: [guild] })
    );
    this.client.on(Events.GuildDelete, async (guild) =>
      this.eventHandler.handleEvent({ event: Events.GuildDelete, args: [guild] })
    );
    this.client.on(Events.ChannelCreate, async (channel) =>
      this.eventHandler.handleEvent({ event: Events.ChannelCreate, args: [channel] })
    );
    this.client.on(Events.ChannelDelete, async (channel) =>
      this.eventHandler.handleEvent({ event: Events.ChannelDelete, args: [channel] })
    );

    this.client.on(Events.InteractionCreate, async (interaction) =>
      this.eventHandler.handleEvent({ event: Events.InteractionCreate, args: [interaction] })
    );

    this.client.on(Events.ShardDisconnect, (event) => {
      this.logger.error(`Disconnected with close event: ${event.code}`);
    });
    this.client.on(Events.Error, (error) => {
      if (!unlog.error.test(error.message)) this.logger.error(error);
    });
    this.client.on(Events.Warn, this.logger.warn);
    this.client.on(Events.Debug, (message) => {
      if (/(heartbeat|Latency of|voice|HELLO timeout|CONNECT|Spawning)/i.test(message)) {
        this.logger.silly(message);
        return;
      }
      this.logger.debug(message);
    });
  }

  async start() {
    await this.settings.createSchema();
    this.logger.debug('Schema created');
    await this.eventHandler.loadHandles();

    await this.setupHandlers();
    try {
      await this.client.login(this.token);
      this.logger.debug('Logged in with token.');
    } catch (err) {
      const type = ((err && err.toString()) || '').replace(/Error \[(.*)]: .*/gi, '$1');
      if (!unlog.debug.includes(type)) {
        this.logger.error(err);
      }
      this.logger.fatal(err);
      process.exit(1);
    }
  }
}
