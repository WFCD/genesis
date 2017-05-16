'use strict';

module.exports = [
  `CREATE TABLE IF NOT EXISTS channels (
    id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    guild_id BIGINT UNSIGNED,
    language VARCHAR(5) NOT NULL DEFAULT 'en-US',
    platform VARCHAR(3) NOT NULL DEFAULT 'pc',
    webhook TEXT,
    respond_to_settings BOOLEAN NOT NULL DEFAULT TRUE,
    prefix VARCHAR(3) NOT NULL DEFAULT '/'
  );`,
  `CREATE TABLE IF NOT EXISTS type_notifications (
    channel_id BIGINT UNSIGNED NOT NULL,
    type VARCHAR(20) NOT NULL,
    ping BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (channel_id, type),
    FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS item_notifications (
    channel_id BIGINT UNSIGNED NOT NULL,
    item VARCHAR(20) NOT NULL,
    ping BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (channel_id, item),
    FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS channel_permissions (
    channel_id BIGINT UNSIGNED NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    is_user BOOLEAN NOT NULL,
    command_id VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL,
    PRIMARY KEY (channel_id, target_id, command_id),
    FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE
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
  `CREATE TABLE IF NOT EXISTS settings (
    channel_id BIGINT UNSIGNED NOT NULL,
    setting VARCHAR(20) NOT NULL,
    val VARCHAR(255) NOT NULL,
    PRIMARY KEY (channel_id, setting),
    FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS notified_ids (
    shard_id BIGINT UNSIGNED NOT NULL,
    platform VARCHAR(3) NOT NULL DEFAULT 'pc',
    id_list JSON NOT NULL,
    PRIMARY KEY (shard_id, platform)
  );`,
  `CREATE TABLE IF NOT EXISTS guild_joinable_roles (
    guild_id BIGINT UNSIGNED NOT NULL,
    id_list JSON NOT NULL,
    PRIMARY KEY (guild_id)
  );`,
  `CREATE TABLE IF NOT EXISTS private_channels (
    guild_id BIGINT UNSIGNED NOT NULL,
    text_id BIGINT UNSIGNED NOT NULL,
    voice_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (guild_id, text_id, voice_id)
  );`,
];
