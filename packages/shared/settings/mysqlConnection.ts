/** Shared MariaDB connection defaults for compose/local dev (host-side uses TCP to published port). */
export const mysqlConnectionOptions = () => ({
  supportBigNumbers: true,
  bigNumberStrings: true,
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'genesis',
  password: process.env.MYSQL_PASSWORD ?? 'genesis',
  database: process.env.MYSQL_DB || 'genesis',
});
