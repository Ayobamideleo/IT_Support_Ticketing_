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
import Ticket from "./models/Ticket.js";
import User from "./models/User.js";
import TicketComment from "./models/TicketComment.js";
import { sendBulkGeneric, composeEmailHtml } from "./services/emailService.js";
import { Op } from "sequelize";

dotenv.config();

// Enable test routes only when explicitly allowed
const ENABLE_TEST_ROUTES = process.env.ENABLE_TEST_ROUTES === "true";

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

// --- SLA reminder job: notify IT staff & managers if no response after 30 minutes ---
const startSlaReminderJob = () => {
  const remindedIds = new Set();
  const THIRTY_MIN = 30 * 60 * 1000;
  const POLL_MS = 5 * 60 * 1000; // run every 5 minutes

  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - THIRTY_MIN);
      const candidates = await Ticket.findAll({
        where: {
          createdAt: { [Op.lte]: cutoff },
          status: { [Op.in]: ['open', 'assigned', 'in_progress'] },
        },
        include: [
          { model: User, as: 'creator', attributes: ['name', 'email'] },
          { model: User, as: 'assignee', attributes: ['name', 'email'] },
          { model: TicketComment, as: 'comments', attributes: ['id'], required: false },
        ],
        limit: 100,
      });

      const staleTickets = candidates.filter(t => (t.comments?.length || 0) === 0 && !remindedIds.has(t.id));
      if (!staleTickets.length) return;

      const recipients = await User.findAll({
        where: { role: { [Op.in]: ['it_staff', 'manager'] } },
        attributes: ['email', 'name'],
      });
      const emails = recipients.map(r => r.email).filter(Boolean);
      if (!emails.length) return;

      for (const ticket of staleTickets) {
        const subject = `Reminder: Ticket #${ticket.id} pending response`;
        const detailRows = [
          ['Title', ticket.title],
          ['Priority', ticket.priority],
          ['Issue Type', ticket.issueType || 'N/A'],
          ['Department', ticket.department || 'N/A'],
          ['Created At', ticket.createdAt?.toLocaleString() || 'N/A'],
          ['Reporter', ticket.creator?.name || 'Unknown'],
        ];
        const textLines = [
          'Hello team,',
          `Ticket #${ticket.id} has been awaiting an initial response for 30+ minutes.`,
          '',
          ...detailRows.map(([k, v]) => `${k}: ${v}`),
          '',
          'Please review and respond in the WYZE IT Support dashboard.',
        ];
        const html = composeEmailHtml({
          title: subject,
          intro: ['Ticket has been waiting 30+ minutes without a response.'],
          details: detailRows,
          outro: ['Please triage and reply in the WYZE IT Support dashboard.'],
        });

        await sendBulkGeneric(emails, subject, { text: textLines.join('\n'), html });
        remindedIds.add(ticket.id);
      }
    } catch (err) {
      logger.error({ err }, 'SLA reminder job failed');
    }
  }, POLL_MS);
};

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

if (ENABLE_TEST_ROUTES) {
  app.get("/api/test", async (req, res) => {
    try {
      await sequelize.authenticate();
      res.json({
        status: "ok",
        db: "connected",
        env: process.env.NODE_ENV || "development"
      });
    } catch (err) {
      console.error("DB test failed:", err);
      res.status(500).json({
        status: "error",
        message: "Database connection failed"
      });
    }
  });
}

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
      startSlaReminderJob();
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
