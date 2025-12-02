# Backend — IT Support Ticketing System

A full-featured IT support ticketing system with role-based access control (RBAC), email verification, SLA tracking, and comprehensive testing.

## ✅ Current Status (November 10, 2025)

All major features are **implemented and working**:

### Core Features
- ✅ **JWT Authentication** - Secure token-based auth with role-based access control
- ✅ **Email Verification** - 6-digit verification codes (15-minute expiration)
- ✅ **Role-Based Access Control** - Employee, IT Staff, and Manager roles with proper permissions
- ✅ **Ticket Management** - Create, assign, update, comment, and track tickets
- ✅ **SLA Tracking** - Due dates, categories, and automatic breach detection
- ✅ **Manager Dashboard** - Real-time stats, SLA breaches, resolution times
- ✅ **Comment System** - Threaded comments on tickets with author tracking
- ✅ **Database Migrations** - Umzug-based migrations with tracking (ESM-compatible)

### API Endpoints
- `POST /api/auth/register` - Register new user (generates verification code)
- `POST /api/auth/verify` - Verify email with code
- `POST /api/auth/resend` - Resend verification code (cooldown + hourly cap)
- `POST /api/auth/login` - Login (requires verified email)
- `GET /api/auth/me` - Get current user
- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - Get my tickets (employee) or all tickets (IT/manager)
   - Supports query params: `page`, `limit`, `status`, `priority`, `department`, `q` (search in title/description)
- `GET /api/tickets/:id` - Get ticket with comments
- `PUT /api/tickets/:id/status` - Update status (IT/manager)
- `PUT /api/tickets/:id/priority` - Update priority (IT/manager)
- `PUT /api/tickets/:id/assign` - Assign ticket (IT/manager)
- `POST /api/tickets/:id/comments` - Add comment
- `GET /api/tickets/stats` - Get dashboard stats (manager)
- `GET /api/tickets/sla-breaches` - Get overdue tickets (manager)

### Testing & CI/CD
- ✅ **Newman/Postman Tests** - Automated RBAC testing via CLI
- ✅ **Playwright E2E Tests** - Full flow testing (register → verify → login → tickets)
- ✅ **GitHub Actions** - Automated testing on push/PR with migrations
- ✅ **Database Smoke Tests** - Connection and schema validation

### Documentation
- ✅ `VERIFICATION.md` - Email verification implementation guide
- ✅ `AZURE_AD_PLAN.md` - Complete Azure AD/Microsoft Entra ID integration plan
- ✅ Migration tracking with `npm run list:migrations`

---

## Quick Start

---

## Quick Start

### 1. Install Dependencies

```powershell
cd backend
npm install
```

### 2. Environment Setup

Copy `.env.example` → `.env` and configure:

```env
# Database (MySQL)
DB_NAME=support_system
DB_USER=root
DB_PASS=your_password
DB_HOST=localhost

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Server
PORT=5000
NODE_ENV=development
```

**Note:** `.env` is gitignored. Never commit credentials.

### 3. Run Database Migrations

```powershell
npm run migrate:umzug
```

This applies all pending migrations and tracks them in `SequelizeMeta` table.

### 4. Start the Server

```powershell
# Development (with nodemon auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

### 5. Test the API

```powershell
# Check database connectivity
npm run smoke:db

# List applied migrations
npm run list:migrations

# Run Postman RBAC tests
npm run test:postman

# Run Playwright E2E tests (requires server running)
npm run test:e2e
```

---

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start server |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm run migrate:umzug` | Run database migrations |
| `npm run list:migrations` | Show applied migrations |
| `npm run smoke:db` | Test database connection |
| `npm run test:postman` | Run Newman RBAC tests |
| `npm run test:e2e` | Run Playwright E2E tests |

---

## Using Postman

---

## Using Postman

1. **Import Collection & Environment**
   - Import `backend/postman_collection.json`
   - Import `backend/postman_environment.json`
   - Set `base_url` to `http://localhost:5000/api`

2. **Authentication Flow**
   - Use `Register` request to create an account
   - Copy the `verificationCode` from response (in dev mode)
   - Use `Verify Email` request with email + code
   - Use `Login` request to get JWT token
   - Set environment variable `token` to the JWT (without `Bearer ` prefix)

3. **Token Format**
   - ✅ Correct: `eyJhbGciOiJI...`
   - ❌ Incorrect: `Bearer eyJhbGciOiJI...`

4. **Debug Tips**
   - `No token provided` → Missing Authorization header
   - `Invalid token` → Token expired or malformed (check console for details in dev mode)
   - Use `Get Current User` to verify token validity

---

## RBAC Testing (Postman)

Automated RBAC tests in `backend/postman_rbac_collection.json`:

**What it tests:**
- Employee can create tickets and view their own tickets
- Employee cannot view all tickets, assign, or update status (403 forbidden)
- IT Staff can view all tickets, assign, and update status
- Manager has full access to stats and reporting

**Run via Newman:**
```powershell
npm run test:postman
```

Generates `newman-report.json` with test results.

---

## E2E Testing (Playwright)

Comprehensive end-to-end tests in `backend/e2e/rbac.e2e.spec.js`:

**Test Coverage:**
- Complete flow: Register → Verify → Login → Create Ticket → Assign → Comment → Resolve
- RBAC enforcement: Employees cannot assign tickets
- Verification requirement: Unverified users cannot login

**Run E2E tests:**
```powershell
# Terminal 1: Start server
npm start

# Terminal 2: Run tests
npm run test:e2e
```

**CI/CD:** Tests run automatically in GitHub Actions on push/PR.

---

## Tickets: Pagination & Filtering

Use these query parameters on `GET /api/tickets` (IT/Manager) to paginate and filter results:

- `page` (default 1), `limit` (default 20, max 100)
- `status` (open, assigned, in_progress, resolved, closed)
- `priority` (low, medium, high)
- `department` (string)
- `q` (search in title and description)

Examples:

```text
/api/tickets?page=2&limit=10
/api/tickets?status=open&priority=high
/api/tickets?q=printer&department=IT
```

Response shape:

```json
{
   "page": 1,
   "totalPages": 5,
   "total": 92,
   "pageSize": 20,
   "results": [ /* array of tickets */ ]
}
```

---

## Database Migrations

### Migration Commands

```powershell
# Run all pending migrations
npm run migrate:umzug

# List applied migrations
npm run list:migrations

# Check database connectivity
npm run smoke:db
```

### Migration Files

Located in `backend/migrations/`:
- `20251106-add-ticket-sla-columns.js` - Adds SLA tracking fields
- `20251106-add-user-verification.js` - Adds email verification fields

### Creating New Migrations

1. Create file: `migrations/YYYYMMDD-description.js`
2. Export `up` and `down` functions:

```javascript
import { DataTypes } from 'sequelize';

export const up = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('tableName', 'columnName', {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

export const down = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn('tableName', 'columnName');
};
```

3. Run: `npm run migrate:umzug`

---

## Development Scripts

Helper scripts in `backend/scripts/`:

| Script | Purpose | Warning |
|--------|---------|---------|
| `sync_db.js` | Non-destructive schema sync (`alter: true`) | Use for local dev |
| `sync_db_force.js` | **Drops & recreates tables** | ⚠️ **DELETES DATA** |
| `migrate_add_ticket_columns.js` | Idempotent column addition | Safe to run multiple times |
| `run_migrations.js` | Umzug migration runner | Production-safe |
| `list_migration_meta.js` | Show migration history | Read-only |
| `smoke_db_check.js` | Test DB connectivity | Safe |

**⚠️ NEVER run `sync_db_force.js` in production!**

---

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/postman-rbac.yml`

**On every push/PR:**
1. Install dependencies
2. Run database migrations
3. Run Newman RBAC tests
4. Upload test reports as artifacts

**Status Badge:**
```markdown
![Postman RBAC tests](https://github.com/Ayobamideleo/backend/actions/workflows/postman-rbac.yml/badge.svg)
```

---

## Email Verification System

See `VERIFICATION.md` for complete documentation.

**Key Features:**
- 6-digit numeric codes (cryptographically secure)
- 15-minute expiration
- Codes cleared after successful verification
- Login blocked until verified
- Dev mode: codes logged and returned in API response

**API Flow:**
1. `POST /auth/register` → Returns verification code (dev mode)
2. `POST /auth/verify` → Validates code and marks user verified
 3. `POST /auth/resend` → Issues a new code (limited to 1/min and 5/hour)
3. `POST /auth/login` → Requires `isVerified = true`

**Production Setup:**
- Configure SMTP credentials in `.env` (see `.env.example`):
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`
   - `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- Install dependencies (already included): `npm install`
- Restart the backend so the Nodemailer transporter picks up the new env vars.
- The app now sends real emails for verification and ticket events; missing config falls back to console logging for local smoke tests.

---

## Azure AD Integration (Future)

See `AZURE_AD_PLAN.md` for complete implementation guide.

**What's included:**
- OAuth 2.0 / OpenID Connect flow
- Azure Portal setup instructions
- Backend code examples (Passport strategy)
- Frontend "Sign in with Microsoft" button
- Role mapping strategies
- Security best practices

**Not implemented yet** - current system uses local email/password + verification codes.

---

## Architecture

### Tech Stack
- **Runtime:** Node.js (ESM modules)
- **Framework:** Express 5
- **Database:** MySQL (with Sequelize ORM)
- **Authentication:** JWT (jsonwebtoken) + bcryptjs
- **Migrations:** Umzug + SequelizeStorage
- **Testing:** Newman (Postman), Playwright (E2E)
- **CI/CD:** GitHub Actions

### Project Structure
```
backend/
├── config/
│   └── db.js                 # Sequelize connection
├── controllers/
│   ├── authController.js     # Register, login, verify
│   ├── ticketController.js   # Ticket CRUD, stats, SLA
│   └── commentController.js  # Comment creation
├── middleware/
│   ├── authMiddleware.js     # JWT verification
│   └── roleMiddleware.js     # RBAC enforcement
├── models/
│   ├── User.js               # User + verification fields
│   ├── Ticket.js             # Ticket + SLA fields
│   └── TicketComment.js      # Comments
├── routes/
│   ├── authRoutes.js
│   └── ticketRoutes.js
├── migrations/               # Umzug migrations
├── scripts/                  # Helper scripts
├── e2e/                      # Playwright tests
├── server.js                 # Entry point
└── package.json
```

### Database Schema

**Users**
- Authentication: `email`, `password`, `role`
- Verification: `isVerified`, `verificationCode`, `verificationExpires`

**Tickets**
- Core: `title`, `description`, `status`, `priority`
- SLA: `slaCategory`, `dueAt`, `closedAt`, `department`, `costEstimate`
- Relations: `userId` (creator), `assignedTo` (IT staff)

**TicketComments**
- Fields: `body`, `userId` (author), `ticketId`
- Relations: Belongs to User and Ticket

---

## Troubleshooting

### "No token provided"
- Ensure Authorization header is set: `Authorization: Bearer {{token}}`
- In Postman, save token to environment variable (without `Bearer ` prefix)

### "Invalid token" / "jwt expired"
- Token expired (7-day TTL) - login again
- Token malformed - check for extra spaces or incorrect format
- In dev mode, check server logs for detailed JWT error

### "Please verify your email"
- User registered but hasn't verified email yet
- Check console logs for verification code (dev mode)
- Or check API response for `verificationCode` field

### Database connection errors
- Verify MySQL is running
- Check `.env` credentials (DB_NAME, DB_USER, DB_PASS, DB_HOST)
- Run `npm run smoke:db` to test connection

### Migration issues
- Check `npm run list:migrations` to see applied migrations
- Ensure `SequelizeMeta` table exists
- Verify migration files are in `backend/migrations/*.js`

### E2E tests failing
- Ensure server is running on port 5000
- Check firewall isn't blocking localhost connections
- Verify database is accessible
- Run migrations before tests: `npm run migrate:umzug`

---

## Security Notes

### Health & Hardening
- `GET /api/health` returns `{ ok: true }` and checks database connectivity.
- Security headers via Helmet are enabled by default.
- Auth routes (`/api/auth/*`) are rate limited to reduce abuse.
- Structured logging via pino/pino-http for better observability.

### JWT Secret
- **Development:** Any string works (set in `.env`)
- **Production:** Use strong random string (32+ characters)
- Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Password Storage
- Hashed with bcrypt (10 rounds)
- Never stored in plain text
- Verified via bcrypt.compare()

### Verification Codes
- Generated with `crypto.randomInt()` (cryptographically secure)
- 6-digit numeric codes
- 15-minute expiration
- Cleared after successful verification

### Token Expiration
- JWTs expire after 7 days
- No refresh token mechanism (re-login required)
- Consider implementing refresh tokens for production

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm run test:postman && npm run test:e2e`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

---

## License

ISC

---

## Support

For issues or questions:
- Check `VERIFICATION.md` for email verification details
- Check `AZURE_AD_PLAN.md` for Azure AD integration
- Review test files in `e2e/` for usage examples
- Run `npm run smoke:db` to diagnose database issues

---

## Recent Updates (November 10, 2025)

✅ **Manager Dashboard** - Full implementation with SLA breach tracking, stats, and recent tickets  
✅ **Ticket Detail Page** - Enhanced UI with status/priority updates, timeline, and comment threading  
✅ **E2E Tests** - Comprehensive Playwright tests for complete user flows  
✅ **Azure AD Plan** - Complete integration guide for future Microsoft SSO  
✅ **Migration System** - ESM-compatible Umzug migrations with Windows support  
✅ **Email Verification** - Production-ready verification code system
