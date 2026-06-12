import type WorldStateClient from '#shared/utilities/WorldStateClient';

import type InteractionHandler from '../../bot/eventHandlers/InteractionHandler';

import type { Database } from './database';
import type { Logger } from './logger';

export interface CommandContext {
  platform?: string;
  prefix?: string;
  language?: string;
  allowCustom?: boolean;
  allowInline?: boolean;
  defaultRoomsLocked?: boolean;
  defaultNoText?: boolean;
  createPrivateChannel?: boolean;
  defaultShown?: boolean;
  tempCategory?: unknown;
  tempChannel?: unknown;
  'settings.cc.ping'?: boolean;
  respondToSettings?: boolean;
  deleteCommand?: boolean;
  deleteExpired?: boolean;
  isBlacklisted?: boolean;
  isOwner?: boolean;
  modRole?: unknown;
  channel?: unknown;
  webhook?: {
    id: string;
    token: string;
    name?: string;
    avatar?: string;
  };
  lfg?: Record<string, unknown>;
  /** Full database facade; use {@link Database.channels} for channel settings. */
  settings?: Database;
  ws?: WorldStateClient;
  handler?: InteractionHandler;
  logger?: Logger;
  i18n?: (strings: TemplateStringsArray | string[], ...values: unknown[]) => string;
  ephemerate?: boolean;
  guild?: import('discord.js').Guild;
  user?: import('discord.js').User;
}
