import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const pickFirstString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return '';
};

// If database env vars are not provided, fallback to an in-memory SQLite DB.
// This makes it convenient to run the app locally for smoke tests without
// requiring a MySQL server.
let sequelize;

// Preferred on PaaS (Render, Railway, etc.)
// Example: mysql://user:pass@host:3306/dbname
// Note: Railway commonly exposes MYSQL_URL.
const databaseUrl = pickFirstString(process.env.DATABASE_URL, process.env.DB_URL, process.env.MYSQL_URL);

const dbHost = pickFirstString(process.env.DB_HOST);
const isLocalHost = dbHost === 'localhost' || dbHost === '127.0.0.1' || dbHost === '::1' || dbHost === '0.0.0.0';

const dbPortRaw = pickFirstString(process.env.DB_PORT);
const dbPort = dbPortRaw ? Number(dbPortRaw) : undefined;

const dbSslRaw = pickFirstString(process.env.DB_SSL);
const dbSsl = dbSslRaw ? dbSslRaw.toLowerCase() : '';
const useDbSsl = dbSsl === 'true' || dbSsl === '1' || dbSsl === 'yes';

const dbName = pickFirstString(process.env.DB_NAME);
const dbUser = pickFirstString(process.env.DB_USER, process.env.DB_USERNAME);
const dbPass = pickFirstString(process.env.DB_PASS, process.env.DB_PASSWORD);

const hasMySqlEnv = Boolean(dbName && dbUser && dbHost && !isLocalHost);
const isProduction = process.env.NODE_ENV === 'production';

const sslDialectOptions = useDbSsl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
  : undefined;

if (databaseUrl) {
  console.info('[db] Using DATABASE_URL/DB_URL/MYSQL_URL connection string');
  sequelize = new Sequelize(databaseUrl, {
    ...(Number.isFinite(dbPort) ? { port: dbPort } : {}),
    dialectOptions: sslDialectOptions,
    logging: false,
  });
} else if (hasMySqlEnv) {
  console.info(`[db] Using DB_* env vars (host='${dbHost}', user='${dbUser}', db='${dbName}')`);
  if (isProduction && dbUser.toLowerCase() === 'root') {
    console.warn(
      "DB_USER is set to 'root' in production. Many managed MySQL providers block remote root access; use a dedicated DB user with privileges instead."
    );
  }

  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    ...(Number.isFinite(dbPort) ? { port: dbPort } : {}),
    dialect: "mysql",
    dialectOptions: sslDialectOptions,
    logging: false,
  });
} else {
  console.info('[db] Using in-memory SQLite (no valid MySQL env found)');
  if (
    process.env.DATABASE_URL ||
    process.env.DB_URL ||
    process.env.MYSQL_URL ||
    process.env.DB_NAME ||
    process.env.DB_USER ||
    process.env.DB_USERNAME ||
    process.env.DB_HOST
  ) {
    console.warn(
      `DB env vars incomplete/invalid for MySQL (need DATABASE_URL OR DB_NAME+DB_USER+DB_HOST not localhost). Using in-memory SQLite. DB_HOST='${dbHost || ''}'`
    );
  } else {
    console.warn("DB env vars not set — using in-memory SQLite for development/smoke tests.");
  }

  sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
}

export default sequelize;
