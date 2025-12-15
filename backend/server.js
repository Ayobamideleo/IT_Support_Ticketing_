import express from "express";
import cors from "cors";
import helmet from 'helmet';
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import pino from 'pino';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// Basic rate limiting (adjust windowMs & max for production)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' }
});

// Body parser / JSON syntax error handler -> return JSON instead of HTML stack
app.use((err, req, res, next) => {
  // body-parser throws a SyntaxError for invalid JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Invalid JSON payload:", err.message);
    return res.status(400).json({ message: "Invalid JSON payload", error: err.message });
  }
  next(err);
});

// Health endpoint (before auth middleware for lightweight probing)
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, 'Health check failed');
    return res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// route registration
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("IT Support Ticketing System API is running 🚀");
});

const FORCE_SYNC = process.env.FORCE_SYNC === "true";
if (FORCE_SYNC) {
  console.warn("WARNING: Sequelize is configured to force sync (DROP TABLES). This is intended for development only.");
}

sequelize
  .sync({ force: FORCE_SYNC })
  .then(() => {
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || "0.0.0.0"; // bind to all interfaces so PaaS routers can reach us

    if (!process.env.JWT_SECRET) {
      console.warn("WARNING: JWT_SECRET is not set. Tokens will not be secure. Set a strong JWT_SECRET in production.");
    } else if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
      console.warn("WARNING: JWT_SECRET appears to be weak (less than 32 characters). Consider using a stronger secret in production.");
    }

    const server = app.listen(PORT, HOST, () => {
      logger.info({ host: HOST, port: PORT }, 'Server started');
      console.log(`✅ Server listening on http://localhost:${PORT}`);
    });
    server.on('error', (err) => {
      logger.error({ err }, 'Server listen error');
      console.error('Server listen error:', err);
      process.exit(1);
    });
  })
  .catch((err) => {
    logger.error({ err }, 'Failed to sync database');
    console.error('Failed to sync database:', err);
    process.exit(1);
  });
