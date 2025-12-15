import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// If database env vars are not provided, fallback to an in-memory SQLite DB.
// This makes it convenient to run the app locally for smoke tests without
// requiring a MySQL server. In production, provide DB_NAME/DB_USER/DB_PASS/DB_HOST.
let sequelize;
const dbHostRaw = process.env.DB_HOST;
const dbHost = typeof dbHostRaw === 'string' ? dbHostRaw.trim() : '';
const isLocalHost = dbHost === 'localhost' || dbHost === '127.0.0.1' || dbHost === '::1' || dbHost === '0.0.0.0';

const hasMySqlEnv = Boolean(process.env.DB_NAME && process.env.DB_USER && dbHost && !isLocalHost);

if (hasMySqlEnv) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: dbHost,
      dialect: "mysql",
      logging: false,
    }
  );
} else {
  if (process.env.DB_NAME || process.env.DB_USER || process.env.DB_HOST) {
    console.warn(
      `DB env vars incomplete/invalid for MySQL (need DB_NAME, DB_USER, DB_HOST not localhost). Using in-memory SQLite. DB_HOST='${dbHost || ''}'`
    );
  } else {
    console.warn("DB env vars not set — using in-memory SQLite for development/smoke tests.");
  }
  sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
}

export default sequelize;
