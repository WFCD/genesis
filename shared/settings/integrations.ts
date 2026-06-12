import SQL from 'sql-template-strings';

const getFKName = async (db, table) => {
  const q = SQL`select constraint_name from information_schema.TABLE_CONSTRAINTS
        where information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA = DATABASE()
            and information_schema.TABLE_CONSTRAINTS.TABLE_NAME = ${table}
            and information_schema.TABLE_CONSTRAINTS.CONSTRAINT_TYPE = 'FOREIGN KEY';`;
  const [results] = await db.query(q);
  return results.map((result) => result.constraint_name);
};
const hasPK = async (db, table) => {
  const q = SQL`select constraint_name from information_schema.TABLE_CONSTRAINTS
        where information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA = DATABASE()
            and information_schema.TABLE_CONSTRAINTS.TABLE_NAME = ${table}
            and information_schema.TABLE_CONSTRAINTS.CONSTRAINT_TYPE = 'PRIMARY KEY';`;
  const [results] = await db.query(q);
  const types = results.map((result) => result.constraint_name);
  return types?.[0] === 'PRIMARY';
};
const getIndices = async (db, table) => {
  const [results] = await db.query(`show index from ${table}`);
  return results.map((result) => result.Column_name);
};

export default [
  /**
   * Add advanced builds
   * @param {Database} db database to add to
   * @returns {Promise<void>}
   */
  async (db) => {
    const currentColumns = SQL`SHOW COLUMNS from builds;`;
    const [results] = await db.query(currentColumns);
    const columns = results.map((result) => result.Field);
    if (!columns.includes('warframe')) {
      await db.query(SQL`ALTER TABLE builds
        ADD COLUMN (
          warframe TEXT DEFAULT NULL,
          primus TEXT DEFAULT NULL,
          secondary TEXT DEFAULT NULL,
          melee TEXT DEFAULT NULL,
          archwing TEXT DEFAULT NULL,
          archgun TEXT DEFAULT NULL,
          archmelee TEXT DEFAULT NULL,
          focus TEXT DEFAULT NULL,
          prism TEXT DEFAULT NULL,
          necramech TEXT DEFAULT NULL,
          necramelee TEXT DEFAULT NULL,
          necragun TEXT DEFAULT NULL,
          mods  TEXT DEFAULT NULL,
          heavy TEXT DEFAULT NULL
        );`);
    }
  },
  async (db) => {
    return db.query(`UPDATE type_notifications SET thread_id = 0 WHERE thread_id IS NULL`);
  },
  async (db) => {
    return db.query(`UPDATE item_notifications SET thread_id = 0 WHERE thread_id IS NULL`);
  },
  async (db) => {
    const currentColumns = SQL`SHOW COLUMNS from type_notifications;`;
    const [results] = await db.query(currentColumns);
    const columns = results.map((result) => result.Field);
    if (columns.includes('thread_id')) {
      await db.query(SQL`ALTER TABLE type_notifications MODIFY thread_id BIGINT UNSIGNED DEFAULT 0;`);
    }
  },
  async (db) => {
    const currentColumns = SQL`SHOW COLUMNS from item_notifications;`;
    const [results] = await db.query(currentColumns);
    const columns = results.map((result) => result.Field);
    if (columns.includes('thread_id')) {
      await db.query(SQL`ALTER TABLE item_notifications MODIFY thread_id BIGINT UNSIGNED DEFAULT 0;`);
    }
  },

  /**
   * Item notifications with threads
   * @param {Database} db to update
   * @returns {Promise<void>}
   */
  async (db) => {
    const currentColumns = SQL`SHOW COLUMNS from item_notifications;`;
    const [results] = await db.query(currentColumns);
    const columns = results.map((result) => result.Field);
    if (!columns.includes('thread_id')) {
      await db.query(SQL`ALTER TABLE item_notifications ADD COLUMN (thread_id BIGINT UNSIGNED DEFAULT 0);`);
    }
    const indices = await getIndices(db, 'item_notifications');
    if (indices.length < 3) {
      const fk = await getFKName(db, 'item_notifications');
      if (fk && fk[0] !== 'NULL') {
        await db.query(`ALTER TABLE item_notifications DROP FOREIGN KEY ${fk};`);
      }
      const hasPrimary = await hasPK(db, 'item_notifications');
      if (hasPrimary) {
        await db.query(SQL`ALTER TABLE item_notifications DROP PRIMARY KEY;`);
      }
      await db.query(SQL`ALTER TABLE item_notifications ADD PRIMARY KEY (channel_id, item, thread_id);`);
      await db.query(SQL`ALTER TABLE item_notifications ADD FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE `);
    }
  },
  /**
   * Type notifications with threads
   * @param {Database} db to update
   * @returns {Promise<void>}
   */
  async (db) => {
    const currentColumns = SQL`SHOW COLUMNS from type_notifications;`;
    const [results] = await db.query(currentColumns);
    const columns = results.map((result) => result.Field);
    if (!columns.includes('thread_id')) {
      await db.query(SQL`ALTER TABLE type_notifications ADD COLUMN (thread_id BIGINT UNSIGNED DEFAULT 0);`);
    }
    const indices = await getIndices(db, 'type_notifications');
    if (indices.length < 3) {
      const fk = await getFKName(db, 'type_notifications');
      if (fk && fk[0] !== 'NULL') {
        await db.query(`ALTER TABLE type_notifications DROP FOREIGN KEY ${fk};`);
      }
      const hasPrimary = await hasPK(db, 'type_notifications');
      if (hasPrimary) {
        await db.query(SQL`ALTER TABLE type_notifications DROP PRIMARY KEY;`);
      }

      await db.query(SQL`ALTER TABLE type_notifications ADD PRIMARY KEY (channel_id, type, thread_id);`);
      await db.query(SQL`ALTER TABLE type_notifications ADD FOREIGN KEY (channel_id)
        REFERENCES channels(id)
        ON DELETE CASCADE `);
    }
  },
  async (db) => {
    return db.query(SQL`ALTER TABLE notified_ids MODIFY platform VARCHAR(20) NOT NULL DEFAULT 'pc'`);
  },
  async (db) => {
    const [results] = await db.query(SQL`SHOW COLUMNS FROM command_stats LIKE 'command_id'`);
    const type = results?.[0]?.Type as string | undefined;
    if (type?.startsWith('varchar(20)')) {
      await db.query(SQL`ALTER TABLE command_stats MODIFY command_id VARCHAR(255) NOT NULL`);
    }
  },
  async (db) => {
    const [results] = await db.query(SQL`SHOW COLUMNS FROM custom_commands LIKE 'ephemeral'`);
    if (!results?.length) {
      await db.query(SQL`ALTER TABLE custom_commands ADD COLUMN ephemeral TINYINT(1) NOT NULL DEFAULT 0`);
    }
  },
  async (db) => {
    const [tables] = await db.query(
      SQL`SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'worker_cache_jobs'`
    );
    if (!tables?.length) return;

    const [scopeCol] = await db.query(SQL`SHOW COLUMNS FROM worker_cache_jobs LIKE 'scope'`);
    const scopeType = scopeCol?.[0]?.Type as string | undefined;
    if (scopeType && !scopeType.includes('pings')) {
      await db.query(
        SQL`ALTER TABLE worker_cache_jobs
          MODIFY locale VARCHAR(8) NOT NULL DEFAULT '',
          MODIFY scope ENUM('trackables', 'pings', 'guild') NOT NULL DEFAULT 'trackables'`
      );
    }

    const [ackTables] = await db.query(
      SQL`SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'worker_cache_job_acks'`
    );
    if (!ackTables?.length) {
      await db.query(SQL`CREATE TABLE worker_cache_job_acks (
        job_id BIGINT UNSIGNED NOT NULL,
        worker_id VARCHAR(32) NOT NULL,
        acked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (job_id, worker_id),
        FOREIGN KEY (job_id)
          REFERENCES worker_cache_jobs(id)
          ON DELETE CASCADE
      )`);
    }

    const [stampTables] = await db.query(
      SQL`SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'worker_cache_refresh_stamps'`
    );
    if (!stampTables?.length) {
      await db.query(SQL`CREATE TABLE worker_cache_refresh_stamps (
        scope ENUM('pings', 'trackables', 'guild') NOT NULL PRIMARY KEY,
        requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
    }

    const [notificationTables] = await db.query(
      SQL`SELECT TABLE_NAME FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_messages'`
    );
    if (!notificationTables?.length) {
      await db.query(SQL`CREATE TABLE notification_messages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        channel_id BIGINT UNSIGNED NOT NULL,
        thread_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        message_id BIGINT UNSIGNED NOT NULL,
        webhook_id BIGINT UNSIGNED NOT NULL,
        webhook_token VARCHAR(255) NOT NULL,
        trackable_type VARCHAR(255) NOT NULL,
        event_id VARCHAR(255) NULL,
        expires_at TIMESTAMP NOT NULL,
        status ENUM('pending', 'failed') NOT NULL DEFAULT 'pending',
        attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
        last_error VARCHAR(255) NULL,
        sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_pending_expiry (status, expires_at),
        KEY idx_channel (channel_id)
      )`);
    }
  },
];
