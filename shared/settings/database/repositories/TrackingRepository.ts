import type { TextChannel, ThreadChannel } from 'discord.js';
import SQL from 'sql-template-strings';

import type { DatabaseDeps } from '../DatabaseDeps';

export type TrackingOptions = {
  events?: string[];
  items?: string[];
  thread?: ThreadChannel;
};

type TrackableChannel = Pick<TextChannel, 'id'>;

/**
 * Event/item subscription rows for worldstate notifications.
 * Mirrors the `track` slash command domain.
 */
export default class TrackingRepository {
  constructor(private readonly deps: DatabaseDeps) {}

  async setTrackables(channel: TrackableChannel, { events, items, thread }: TrackingOptions) {
    const deleteItems = SQL`DELETE i FROM item_notifications AS i WHERE i.channel_id = ${channel.id}`;
    const deleteTypes = SQL`DELETE t FROM type_notifications AS t WHERE t.channel_id = ${channel.id}`;
    if (thread) {
      deleteItems.append(SQL` AND i.thread_id = ${thread.id}`);
      deleteTypes.append(SQL` AND t.thread_id = ${thread.id}`);
    } else {
      deleteItems.append(SQL` AND i.thread_id = 0`);
      deleteTypes.append(SQL` AND t.thread_id = 0`);
    }
    await this.deps.query(deleteItems);
    await this.deps.query(deleteTypes);
    if (events?.length) await this.trackEventTypes(channel, events, thread);
    if (items?.length) await this.trackItems(channel, items, thread);
  }

  async trackItems(channel: TrackableChannel, items: string[], thread?: ThreadChannel) {
    let query;
    if (!thread) {
      query = SQL`INSERT IGNORE INTO item_notifications (channel_id, item) VALUES `;
      items.forEach((item, index) => {
        query.append(SQL`(${channel.id}, ${item})`).append(index !== items.length - 1 ? ',' : ';');
      });
    } else {
      query = SQL`INSERT IGNORE INTO item_notifications (channel_id, item, thread_id) VALUES `;
      items.forEach((item, index) => {
        query.append(SQL`(${channel.id}, ${item},${thread.id})`).append(index !== items.length - 1 ? ',' : ';');
      });
    }

    return this.deps.query(query);
  }

  async untrackItems(channel: TrackableChannel, items: string[], thread?: ThreadChannel) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channel.id}`;
    if (thread) {
      query.append(SQL` AND thread_id = ${thread.id}`);
    } else {
      query.append(SQL` AND thread_id = 0`);
    }
    query.append(SQL` AND ( `);
    items.forEach((item, index) => {
      query.append(index > 0 ? '  OR ' : '').append(SQL`item = ${item}`);
    });
    query.append(SQL`);`);
    return this.deps.query(query);
  }

  async trackEventTypes(channel: TrackableChannel, types: string[], thread?: ThreadChannel) {
    let query;
    if (!thread) {
      query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type) VALUES `;
      types.forEach((type, index) => {
        if (channel?.id) {
          query.append(SQL`(${channel.id}, ${type})`).append(index !== types.length - 1 ? ',' : ';');
        }
      });
    } else {
      query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type, thread_id) VALUES `;
      types.forEach((type, index) => {
        if (channel?.id) {
          query.append(SQL`(${channel.id}, ${type}, ${thread.id})`).append(index !== types.length - 1 ? ',' : ';');
        }
      });
    }
    return this.deps.query(query);
  }

  async untrackEventTypes(channel: TrackableChannel, types: string[], thread?: ThreadChannel) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id}`;
    if (thread) {
      query.append(SQL` AND thread_id = ${thread.id}`);
    } else {
      query.append(SQL` AND thread_id = 0`);
    }
    query.append(SQL` AND ( `);
    types.forEach((type, index) => {
      query.append(index > 0 ? '  OR ' : '').append(SQL`type = ${type}`);
    });
    query.append(SQL`);`);
    return this.deps.query(query);
  }

  async getTrackedItems(channel: TrackableChannel, thread?: ThreadChannel): Promise<string[]> {
    const query = SQL`SELECT item FROM item_notifications WHERE channel_id = ${channel.id}`;
    if (thread) {
      query.append(SQL` AND thread_id = ${thread.id}`);
    } else {
      query.append(SQL` AND thread_id = 0`);
    }
    query.append(SQL`;`);
    const res = await this.deps.query(query);
    return (res?.[0] as Array<{ item: string }> | undefined)?.map((r) => r.item) ?? [];
  }

  async getTrackedEventTypes(channel: TrackableChannel, thread?: ThreadChannel): Promise<string[]> {
    const query = SQL`SELECT type FROM type_notifications WHERE channel_id = ${channel.id}`;
    if (thread) {
      query.append(SQL` AND thread_id = ${thread.id}`);
    } else {
      query.append(SQL` AND thread_id = 0`);
    }
    query.append(SQL`;`);

    const [rows] = (await this.deps.query(query)) ?? [[]];
    return (rows as Array<{ type: string }>).map((r) => r.type);
  }

  async removeItemNotifications(channelId: string) {
    const query = SQL`DELETE FROM item_notifications WHERE channel_id = ${channelId}`;
    return this.deps.query(query);
  }

  async removeTypeNotifications(channelId: string) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channelId}`;
    return this.deps.query(query);
  }

  async stopTracking(channel: TrackableChannel) {
    const query = SQL`DELETE FROM type_notifications WHERE channel_id = ${channel.id};`;
    return this.deps.query(query);
  }
}
