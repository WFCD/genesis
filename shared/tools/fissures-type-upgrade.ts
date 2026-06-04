/**
 * One-off migration: expand legacy `fissures.tN` tracking rows into per-mission-type keys.
 *
 * Run: `npx tsx shared/tools/fissures-type-upgrade.ts`
 */
import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';
import SQL, { type SQLStatement } from 'sql-template-strings';

type ChannelRow = RowDataPacket & { channel_id: string };

const dbOptions = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'genesis',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB || 'genesis',
  supportBigNumbers: true,
  bigNumberStrings: true,
};

const missionTypes = [
  'excavation',
  'sabotage',
  'mobiledefense',
  'assassination',
  'extermination',
  'hive',
  'defense',
  'interception',
  'rathuum',
  'conclave',
  'rescue',
  'spy',
  'survival',
  'capture',
  'darksector',
  'hijack',
  'assault',
  'evacuation',
] as const;

const tierQueries = [
  SQL`select channel_id from type_notifications where type='fissures.t1';`,
  SQL`select channel_id from type_notifications where type='fissures.t2';`,
  SQL`select channel_id from type_notifications where type='fissures.t3';`,
  SQL`select channel_id from type_notifications where type='fissures.t4';`,
] as const;

async function queryChannelIds(pool: Pool, query: SQLStatement): Promise<string[]> {
  const [rows] = await pool.query(query as never);
  return (rows as ChannelRow[]).map((row) => row.channel_id);
}

async function insertTierTypes(pool: Pool, channelId: string, tier: number): Promise<void> {
  const genTypes = missionTypes.map((type) => `fissures.t${tier}.${type}`);
  const query = SQL`INSERT IGNORE INTO type_notifications (channel_id, type)
      VALUES (${channelId}, ${genTypes[0]}), (${channelId}, ${genTypes[1]}), (${channelId}, ${genTypes[2]}),
            (${channelId}, ${genTypes[3]}), (${channelId}, ${genTypes[4]}), (${channelId}, ${genTypes[5]}),
            (${channelId}, ${genTypes[6]}), (${channelId}, ${genTypes[7]}), (${channelId}, ${genTypes[8]}),
            (${channelId}, ${genTypes[9]}), (${channelId}, ${genTypes[10]}), (${channelId}, ${genTypes[11]}),
            (${channelId}, ${genTypes[12]}), (${channelId}, ${genTypes[13]}), (${channelId}, ${genTypes[14]}),
            (${channelId}, ${genTypes[15]}), (${channelId}, ${genTypes[16]}), (${channelId}, ${genTypes[17]});`;

  await pool.query(query as never);
}

async function main() {
  const pool = mysql.createPool(dbOptions);
  const fissures: string[][] = [[], [], [], []];

  try {
    await Promise.all(
      tierQueries.map(async (query, index) => {
        fissures[index] = await queryChannelIds(pool, query);
      })
    );

    process.stdout.write('Starting inserts...');

    for (const [index, fissureGroup] of fissures.entries()) {
      for (const channelId of fissureGroup) {
        process.stdout.write(`Inserting fissures for ${channelId} for tier ${index + 1}...`);
        try {
          await insertTierTypes(pool, channelId, index + 1);
          process.stdout.write('✔️\n');
        } catch (error) {
          console.error(error);
        }
      }
    }
  } finally {
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
