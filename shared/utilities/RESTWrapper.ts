import { Rest } from '@spectacles/rest';

import { assetBase } from '#shared/utilities/CommonFunctions';
import logger from '#shared/utilities/Logger';

const defaults = {
  username: process.env.DEF_USER || 'Genesis',
  avatar: `${assetBase}/avatar.png`,
};

type ChannelLike = { id: string };

type WebhookRecord = {
  id: string;
  token: string;
  type?: number;
};

export default class RESTWrapper {
  client: Rest;

  user?: { username: string };

  constructor() {
    this.client = new Rest(process.env.TOKEN, { retryLimit: 1, ua: 'Genesis Notifier' });
  }

  async init() {
    this.user = { username: 'Genesis' };
  }

  async getWebhook(channel: ChannelLike): Promise<WebhookRecord | undefined> {
    try {
      let webhooks = (await this.client.get(`/channels/${channel.id}/webhooks`)) as WebhookRecord[];
      if (webhooks.length) {
        webhooks = webhooks.filter((hook) => hook && hook.type === 1);
        return webhooks[0];
      }
      return this.client.post(`/channels/${channel.id}/webhooks`, {
        name: defaults.username,
        avatar: defaults.avatar,
      }) as Promise<WebhookRecord>;
    } catch (e) {
      logger.error(e);
      return undefined;
    }
  }

  async controlMessage(body: unknown) {
    if (process.env.CONTROL_WH_ID && process.env.CONTROL_WH_TOKEN) {
      return this.client.post(`/webhooks/${process.env.CONTROL_WH_ID}/${process.env.CONTROL_WH_TOKEN}`, body);
    }
    logger.error(`cannot post control message... ${JSON.stringify(body)}`);
  }
}
