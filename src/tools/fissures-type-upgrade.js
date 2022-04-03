import mysql from 'mysql2/promise';
import SQL from 'sql-template-strings';
import Promise from 'bluebird';

const dbOptions = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'genesis',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB || 'genesis',
};

const opts = {
  supportBigNumbers: true,
  bigNumberStrings: true,
  Promise,
};
Object.assign(opts, dbOptions);

const db = mysql.createPool(opts);

const fissures = [[], [], [], []];
const types = [
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
];

const queries = [
  SQL`select channel_id from type_notifications where type='fissures.t1';`,
  SQL`select channel_id from type_notifications where type='fissures.t2';`,
  SQL`select channel_id from type_notifications where type='fissures.t3';`,
  SQL`select channel_id from type_notifications where type='fissures.t4';`,
];

Promise.each(queries, (query, index) =>
  db.query(query).then((results) => {
    results[0].forEach((result) => fissures[index].push(result.channel_id));
  })
)
  .then(() => {
    process.stdout.write('Starting inserts...');
    return Promise.each(fissures, (fissureGroup, index) =>
      Promise.each(fissureGroup, (channel) => {
        process.stdout.write(`Inserting fissures for ${channel} for tier ${index + 1}...`);
        const genTypes = types.map((type) => `fissures.t${index + 1}.${type}`);

        const q = SQL`INSERT IGNORE INTO type_notifications (channel_id, type)
      VALUES (${channel}, ${genTypes[0]}), (${channel}, ${genTypes[1]}), (${channel}, ${genTypes[2]}),
            (${channel}, ${genTypes[3]}), (${channel}, ${genTypes[4]}), (${channel}, ${genTypes[5]}),
            (${channel}, ${genTypes[6]}), (${channel}, ${genTypes[7]}), (${channel}, ${genTypes[8]}),
            (${channel}, ${genTypes[9]}), (${channel}, ${genTypes[10]}), (${channel}, ${genTypes[11]}),
            (${channel}, ${genTypes[12]}), (${channel}, ${genTypes[13]}), (${channel}, ${genTypes[14]}),
            (${channel}, ${genTypes[15]}), (${channel}, ${genTypes[16]}), (${channel}, ${genTypes[17]});`;
        return db
          .query(q)
          .then(() => process.stdout.write('✔️\n'))
        .catch(console.error);// eslint-disable-line
      })
    );
  })
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);// eslint-disable-line
    process.exit(1);
  });
