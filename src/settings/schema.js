import SQL from 'sql-template-strings';

export default [
  SQL`CREATE TABLE IF NOT EXISTS channels (
    id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    guild_id BIGINT UNSIGNED,
    language VARCHAR(5) NOT NULL DEFAULT 'en-US',
    platform VARCHAR(10) NOT NULL DEFAULT 'pc',
    webhook TEXT,
    respond_to_settings BOOLEAN NOT NULL DEFAULT TRUE,
    prefix VARCHAR(3) NOT NULL DEFAULT '/'
  );`,
  SQL`CREATE TABLE IF NOT EXISTS type_notifications (
    channel_id BIGINT UNSIGNED NOT NULL,
    thread_id BIGINT UNSIGNED,
    type VARCHAR(255) NOT NULL,
    ping BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (channel_id, type),
    FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE
  );`,
  SQL`CREATE TABLE IF NOT EXISTS item_notifications (
    channel_id BIGINT UNSIGNED NOT NULL,
    thread_id BIGINT UNSIGNED,
    item VARCHAR(20) NOT NULL,
    ping BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (channel_id, item),
    FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE
  );`,
  SQL`CREATE TABLE IF NOT EXISTS channel_permissions (
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
  SQL`CREATE TABLE IF NOT EXISTS guild_permissions (
    guild_id BIGINT UNSIGNED NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    is_user BOOLEAN NOT NULL,
    command_id VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL,
    PRIMARY KEY (guild_id, target_id, command_id)
  );`,
  SQL`CREATE TABLE IF NOT EXISTS pings (
    guild_id BIGINT UNSIGNED NOT NULL,
    item_or_type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    PRIMARY KEY (guild_id, item_or_type)
  );`,
  SQL`CREATE TABLE IF NOT EXISTS settings (
    channel_id BIGINT UNSIGNED NOT NULL,
    setting VARCHAR(20) NOT NULL,
    val VARCHAR(255) NOT NULL,
    PRIMARY KEY (channel_id, setting),
    FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE
  );`,
  SQL`CREATE TABLE IF NOT EXISTS notified_ids (
    shard_id BIGINT UNSIGNED NOT NULL,
    platform VARCHAR(20) NOT NULL DEFAULT 'pc',
    id_list JSON NOT NULL,
    PRIMARY KEY (shard_id, platform)
  );`,
  SQL`CREATE TABLE IF NOT EXISTS guild_joinable_roles (
    guild_id BIGINT UNSIGNED NOT NULL,
    id_list JSON NOT NULL,
    PRIMARY KEY (guild_id)
  );`,
  SQL`CREATE TABLE IF NOT EXISTS private_channels (
    guild_id BIGINT UNSIGNED NOT NULL,
    text_id BIGINT UNSIGNED DEFAULT 0,
    voice_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED DEFAULT 0,
    PRIMARY KEY (guild_id, voice_id)
  );`,
  SQL`CREATE TABLE IF NOT EXISTS custom_commands (
    command_id VARCHAR(255) NOT NULL,
    guild_id BIGINT UNSIGNED NOT NULL,
    command VARCHAR(20) NOT NULL,
    response TEXT NOT NULL,
    creator_id BIGINT UNSIGNED NOT NULL,
    creation_dttm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (command_id)
  );`,
  SQL`CREATE TABLE IF NOT EXISTS welcome_messages (
    guild_id bigint(20) unsigned NOT NULL,
    is_dm varchar(1) NOT NULL,
    channel_id bigint(20) unsigned NOT NULL,
    message text NOT NULL,
    welcome_message_id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (welcome_message_id)
  );`,
  SQL`CREATE TABLE IF NOT EXISTS builds (
    build_id VARCHAR(8) NOT NULL,
    title VARCHAR(255) NOT NULL default 'My Build',
    body TEXT NOT NULL,
    image TEXT NOT NULL,
    owner_id BIGINT UNSIGNED NOT NULL,
    is_public VARCHAR(1) NOT NULL DEFAULT '0',
    PRIMARY KEY (build_id)
  );`,
  SQL`CREATE TABLE IF NOT EXISTS code_pool (
    pool_id VARCHAR(255) NOT NULL PRIMARY KEY,
    pool_name TEXT NOT NULL,
    pool_owner BIGINT(20) UNSIGNED NOT NULL,
    pool_type VARCHAR(10) NOT NULL default 'glyph',
    pool_default_guild BIGINT(20) UNSIGNED NOT NULL,
    pool_public BOOLEAN NOT NULL DEFAULT FALSE,
    pool_restricted BOOLEAN NOT NULL DEFAULT TRUE,
    pool_password VARCHAR(255),
    UNIQUE (pool_id)
  );`,
  SQL`CREATE TABLE IF NOT EXISTS code_pool_member (
    pool_id VARCHAR(255) NOT NULL,
    platform VARCHAR(3) NOT NULL DEFAULT 'pc',
    added_by BIGINT(20) UNSIGNED NOT NULL,
    added_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_to BIGINT(20) UNSIGNED,
    granted_by BIGINT(20) UNSIGNED,
    granted_on TIMESTAMP NULL DEFAULT NULL,
    code CHAR(19) NOT NULL,
    CONSTRAINT UC_Code UNIQUE (pool_id,platform,code),
    FOREIGN KEY (pool_id)
      REFERENCES code_pool(pool_id)
      ON DELETE CASCADE
  );`,
  SQL`CREATE TABLE IF NOT EXISTS code_pool_manager (
    pool_id VARCHAR(255) NOT NULL,
    pool_manager BIGINT(20) UNSIGNED NOT NULL,
    PRIMARY KEY (pool_id, pool_manager),
    FOREIGN KEY (pool_id)
      REFERENCES code_pool(pool_id)
      ON DELETE CASCADE
  );`,
  SQL`CREATE TABLE IF NOT EXISTS guild_ratio (
    shard_id TINYINT NOT NULL,
    guild_id BIGINT(20) UNIQUE NOT NULL,
    owner_id BIGINT(20) NOT NULL
  );`,
  SQL`CREATE TABLE IF NOT EXISTS dynamic_voice_template (
    guild_id BIGINT(20) NOT NULL,
    channel_id BIGINT(20) UNIQUE NOT NULL,
    is_relay varchar(1) NOT NULL,
    template varchar(250) NULL DEFAULT NULL,
    PRIMARY KEY (guild_id, channel_id)
  )`,
  SQL`CREATE TABLE IF NOT EXISTS dynamic_voice_instance (
    template_id BIGINT(20) NOT NULL,
    instance_id BIGINT(20) NOT NULL,
    PRIMARY KEY (template_id, instance_id),
    FOREIGN KEY (template_id)
      REFERENCES dynamic_voice_template(channel_id)
      ON DELETE CASCADE
  )`,
  SQL`CREATE TABLE IF NOT EXISTS user_blacklist (
    user_id BIGINT(20) NOT NULL,
    guild_id BIGINT(20) NOT NULL DEFAULT '0',
    is_global BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (user_id, guild_id, is_global)
  )`,
  SQL`CREATE TABLE IF NOT EXISTS role_stats (
    guild_id VARCHAR(20) NOT NULL,
    channel_id VARCHAR(20) NOT NULL,
    role_id VARCHAR(20) NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT '',
    PRIMARY KEY (guild_id, channel_id, role_id)
  )`,
  SQL`CREATE TABLE IF NOT EXISTS profiles (
    user_id BIGINT(20) NOT NULL,
    ign VARCHAR(255) NOT NULL default '',
    platform VARCHAR(10) NOT NULL DEFAULT 'pc',
    id VARCHAR(5) NOT NULL,
    PRIMARY KEY (id)
  )`,
  SQL`CREATE TABLE IF NOT EXISTS mastered_items (
    profile_id VARCHAR(5) NOT NULL,
    uname VARCHAR(255) NOT NULL,
    FOREIGN KEY (profile_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE
  )`,
  SQL`CREATE TABLE IF NOT EXISTS command_stats (
    guild_id VARCHAR(20) NOT NULL,
    command_id VARCHAR(20) NOT NULL,
    count INT NOT NULL,
    PRIMARY KEY (guild_id, command_id)
  )`,
];
