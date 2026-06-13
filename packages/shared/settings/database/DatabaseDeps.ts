import type { FieldPacket, RowDataPacket } from 'mysql2';
import type { SQLStatement } from 'sql-template-strings';

import type { Logger } from '#shared/types/logger';

export type QueryResult = [RowDataPacket[], FieldPacket[]];

export interface DefaultSettings {
  prefix: string;
  respond_to_settings: boolean;
  platform: string;
  language: string;
  delete_after_respond: boolean;
  delete_response: boolean;
  createPrivateChannel: boolean;
  deleteExpired: boolean;
  allowCustom: boolean;
  allowInline: boolean;
  defaultRoomsLocked: boolean;
  defaultNoText: boolean;
  defaultShown: boolean;
  tempCategory: boolean;
  'settings.cc.ping': boolean;
  ephemerate: boolean;
  username?: string;
  avatar?: string;
  [key: string]: unknown;
}

/** Shared database capabilities injected into repositories. */
export interface DatabaseDeps {
  query(query: SQLStatement | string): Promise<QueryResult | undefined>;
  defaults: DefaultSettings;
  logger?: Logger;
}

/** Cross-repo hooks still owned by guild lifecycle until GuildRepository exists. */
export interface GuildChannelHost {
  addGuildTextChannel(channel: unknown): Promise<unknown>;
  addDMChannel(channel: unknown): Promise<unknown>;
}
