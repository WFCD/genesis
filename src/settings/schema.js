'use strict';

module.exports = [
  `CREATE TABLE IF NOT EXISTS channels (
    id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    guild_id BIGINT UNSIGNED,
    language VARCHAR(5) NOT NULL DEFAULT 'en-US',
    platform VARCHAR(3) NOT NULL DEFAULT 'PC',
    webhook TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS type_notifications (
    channel_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(20) NOT NULL,
    ping BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (channel_id, type),
    FOREIGN KEY (channel_id) REFERENCES channels(id)
  );`,
  `CREATE TABLE IF NOT EXISTS item_notifications (
    channel_id BIGINT UNSIGNED NOT NULL,
    item VARCHAR(20) NOT NULL,
    ping BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (channel_id, item),
    FOREIGN KEY (channel_id) REFERENCES channels(id)
  );`,
  `CREATE TABLE IF NOT EXISTS channel_permissions (
    channel_id BIGINT UNSIGNED NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    is_user BOOLEAN NOT NULL,
    command_id VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL,
    PRIMARY KEY (channel_id, target_id, command_id),
    FOREIGN KEY (channel_id) REFERENCES channels(id)
  );`,
  `CREATE TABLE IF NOT EXISTS guild_permissions (
    guild_id BIGINT UNSIGNED NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    is_user BOOLEAN NOT NULL,
    command_id VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL,
    PRIMARY KEY (guild_id, target_id, command_id)
  );`,
  `CREATE TABLE IF NOT EXISTS pings (
    guild_id BIGINT UNSIGNED NOT NULL,
    item_or_type VARCHAR(20) NOT NULL,
    text TEXT NOT NULL,
    PRIMARY KEY (guild_id, item_or_type)
  );`,
];
