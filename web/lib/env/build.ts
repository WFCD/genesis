export type WebEnv = {
  nodeEnv: string;
  port: number;
  scope: string;
  webBaseUrl: string;
  controlGuildId: string | undefined;
  owner: string | undefined;
  appName: string;
  auth: {
    secret: string | undefined;
    url: string;
    discordClientId: string | undefined;
    discordClientSecret: string | undefined;
  };
  bot: {
    token: string | undefined;
  };
  mysql: {
    host: string;
    port: number;
    user: string;
    password: string | undefined;
    database: string;
  };
};

export type EnvReader = (key: string, fallback?: string) => string | undefined;

function isPlausibleDiscordToken(value?: string) {
  if (!value) return false;
  return /^\d+\.[\w-]{4,}\.[\w-]{4,}$/.test(value);
}

function readBotToken(read: EnvReader) {
  const normalize = (value?: string) => value?.replace(/\s+/g, '').replace(/^["']+|["']+$/g, '') || undefined;
  const botToken = normalize(read('BOT_TOKEN'));
  const legacyToken = normalize(read('TOKEN'));
  if (isPlausibleDiscordToken(botToken)) return botToken;
  if (isPlausibleDiscordToken(legacyToken)) return legacyToken;
  return botToken ?? legacyToken;
}

export function buildEnv(read: EnvReader): WebEnv {
  const port = Number(read('PORT', '3131'));
  const webBaseUrl = read('WEB_BASE_URL', read('AUTH_URL', read('NEXTAUTH_URL', `http://localhost:${port}`)));

  return {
    nodeEnv: read('NODE_ENV', 'development')!,
    port,
    scope: read('SCOPE', 'web')!,
    webBaseUrl: webBaseUrl!,
    controlGuildId: read('CONTROL_GUILD_ID'),
    owner: read('OWNER'),
    appName: read('APP_NAME') ?? read('DEF_USER', 'Genesis')!,
    auth: {
      secret: read('AUTH_SECRET'),
      url: read('AUTH_URL') ?? read('NEXTAUTH_URL') ?? webBaseUrl!,
      discordClientId: read('DISCORD_CLIENT_ID') ?? read('CLIENT_ID'),
      discordClientSecret: read('DISCORD_CLIENT_SECRET'),
    },
    bot: {
      token: readBotToken(read),
    },
    mysql: {
      host: read('MYSQL_HOST', 'localhost')!,
      port: Number(read('MYSQL_PORT', '3306')),
      user: read('MYSQL_USER', 'genesis')!,
      password: read('MYSQL_PASSWORD'),
      database: read('MYSQL_DB', 'genesis')!,
    },
  };
}

/** Sync normalized values into process.env for Auth.js and #shared Database. */
export function applyEnvToProcess(env: WebEnv) {
  process.env.SCOPE = env.scope;
  process.env.PORT = String(env.port);
  process.env.WEB_BASE_URL = env.webBaseUrl;

  if (env.auth.url) {
    process.env.AUTH_URL = env.auth.url;
    process.env.NEXTAUTH_URL = env.auth.url;
  }
  if (env.nodeEnv === 'development') {
    process.env.AUTH_TRUST_HOST = 'true';
  }
  if (env.auth.secret) process.env.AUTH_SECRET = env.auth.secret;
  if (env.auth.discordClientId) process.env.DISCORD_CLIENT_ID = env.auth.discordClientId;
  if (env.auth.discordClientSecret) process.env.DISCORD_CLIENT_SECRET = env.auth.discordClientSecret;
  if (env.bot.token) {
    process.env.BOT_TOKEN = env.bot.token;
    process.env.TOKEN = env.bot.token;
  }
  if (env.owner) process.env.OWNER = env.owner;

  process.env.MYSQL_HOST = env.mysql.host;
  process.env.MYSQL_PORT = String(env.mysql.port);
  process.env.MYSQL_USER = env.mysql.user;
  if (env.mysql.password) process.env.MYSQL_PASSWORD = env.mysql.password;
  process.env.MYSQL_DB = env.mysql.database;
}
