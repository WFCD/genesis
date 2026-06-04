import SQL from 'sql-template-strings';

const getFKName = async (db, table) => {
  const q = SQL`select constraint_name from information_schema.TABLE_CONSTRAINTS
        where information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA = 'genesis'
            and information_schema.TABLE_CONSTRAINTS.TABLE_NAME = ${table}
            and information_schema.TABLE_CONSTRAINTS.CONSTRAINT_TYPE = 'FOREIGN KEY';`;
  const [results] = await db.query(q);
  return results.map((result) => result.constraint_name);
};
const hasPK = async (db, table) => {
  const q = SQL`select constraint_name from information_schema.TABLE_CONSTRAINTS
        where information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA = 'genesis'
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
];
