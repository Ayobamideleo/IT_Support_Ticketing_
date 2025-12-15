import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// If database env vars are not provided, fallback to an in-memory SQLite DB.
// This makes it convenient to run the app locally for smoke tests without
// requiring a MySQL server. In production, provide DB_NAME/DB_USER/DB_PASS/DB_HOST.
let sequelize;
const hasMySqlEnv = Boolean(process.env.DB_NAME && process.env.DB_USER && process.env.DB_HOST);

if (hasMySqlEnv) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: "mysql",
      logging: false,
    }
  );
} else {
  console.warn(
    "DB env vars not set (need DB_NAME, DB_USER, DB_HOST) — using in-memory SQLite for development/smoke tests."
  );
  sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
}

export default sequelize;
