# WYZE — Internal IT Support Ticketing System

> A full-featured IT support ticketing system with role-based access control, email verification, SLA tracking, and comprehensive testing.

## 🚀 Quick Start (Docker - Recommended)

**Prerequisites:** [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

```powershell
docker-compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health:** http://localhost:5000/api/health

See [DOCKER_README.md](DOCKER_README.md) for full Docker documentation.

---

## 📦 Manual Setup (Without Docker)

### Backend

```powershell
cd backend
npm install
# Create .env file (see backend/README.md for variables)
npm run migrate:umzug
npm run dev
```

### Frontend

```powershell
cd frontend
npm install
# Optional: create .env with VITE_API_BASE=http://localhost:5000/api
npm run dev
```

Visit http://localhost:5173

---

## 🌐 Free Hosting Deployment

Deploying on free tiers keeps the stack accessible for demos while avoiding manual server babysitting. The workflow below uses **Vercel** for the frontend and **Render** (or **Railway**) for the Node.js API.

### Frontend → Vercel
- Push this repo to GitHub (or fork) so Vercel can import it.
- In Vercel, create a new project → import the `frontend` folder; set the build command to `npm run build` and output directory to `dist`.
- Add an environment variable: `VITE_API_BASE` → `https://<your-backend-host>/api`.
- Trigger the first deploy. Vercel auto-builds on every push to the selected branch.

### Backend → Render / Railway
- Provision a MySQL instance (Render, Railway, Neon + Prisma adapter, or PlanetScale). Capture `DB_HOST`, `DB_USER`, `DB_PASS`, and `DB_NAME`.
- **Render YAML:** The repo includes `render.yaml` with `rootDir: backend`, `buildCommand: npm install`, `startCommand: npm run start`, and `NODE_VERSION=20`. Make sure the service uses the blueprint (or set Root Directory to `backend` in the dashboard and clear the build cache before redeploying).
- Create a new Node.js web service and point it at the `backend` folder. Use `npm install` for install and `npm run start` (or `node server.js`) for the start command. Render/Railway set `PORT` automatically—do **not** hardcode it.
- Configure environment variables:
  - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` (if `DB_HOST` is not set, the backend will fallback to in-memory SQLite)
  - `JWT_SECRET` (generate a strong value)
  - Optional: `NODE_ENV=production`
- Run the migrations once (`npm run migrate:umzug`) by triggering a shell/one-off job in the hosting dashboard.
- Enable health checks against `/api/health` to auto-restart on failures.

### Connect the Frontend
- Update `VITE_API_BASE` in Vercel whenever the backend URL changes.
- Redeploy the frontend to pick up the new environment variable (Vercel exposes it at build time).
- Verify the public site: login/registration should hit the hosted API without CORS errors.

---

## 📚 Documentation

- [Backend README](backend/README.md) - API endpoints, testing, migrations, architecture
- [Frontend README](frontend/README.md) - Setup, env vars, pages
- [Email Verification Guide](backend/VERIFICATION.md) - Implementation details
- [Azure AD Integration Plan](backend/AZURE_AD_PLAN.md) - Future SSO setup
- [Docker Setup](DOCKER_README.md) - Running with Docker Compose
- [Dashboard Enhancements](DASHBOARD_ENHANCEMENTS.md) - IT Staff and Manager dashboard features
- **[User Management Module](USER_MANAGEMENT_README.md) - Account & Role Management system**

## ✨ Features

- ✅ JWT authentication with email verification
- ✅ Role-based access control (Employee, IT Staff, Manager)
- ✅ **User & Role Management (Managers can create/edit/delete accounts)**
- ✅ Ticket management with SLA tracking
- ✅ Comment system with threading
- ✅ **Enhanced IT Staff dashboard with filters, SLA indicators, and "My Assigned" tab**
- ✅ **Manager dashboard with analytics charts, SLA compliance, and export**
- ✅ Resend verification codes with rate limiting
- ✅ Request validation (Zod)
- ✅ Security headers (Helmet) and rate limiting
- ✅ Structured logging (Pino)
- ✅ Health check endpoint
- ✅ Postman/Newman tests with CI
- ✅ Playwright E2E tests
- ✅ Database migrations (Umzug)

## 🛠️ Tech Stack

**Backend:** Node.js (ESM), Express 5, MySQL, Sequelize, JWT, Zod, Helmet, Pino, express-rate-limit  
**Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Axios  
**Testing:** Newman (Postman), Playwright, GitHub Actions CI/CD  
**Infrastructure:** Docker, Docker Compose, MySQL 8.0

## 🔒 Development Notes

- Verification codes are logged to console and returned in API responses (dev mode only)
- Frontend shows codes on the verification page for easy testing
- JWT tokens expire after 7 days (configurable in authController)
- Resend verification has 60s cooldown + 5 requests/hour limit
- All auth routes are rate-limited (30 requests per 15 min)

---

## API Endpoints (Summary)

**Auth:**
- `POST /api/auth/register` - Register new user (generates verification code)
- `POST /api/auth/verify` - Verify email with code
- `POST /api/auth/resend` - Resend verification code (rate limited)
- `POST /api/auth/login` - Login (requires verified email)
- `GET /api/auth/me` - Get current user

**Users:** (Manager/IT Staff)
- `GET /api/users` - List all users with pagination & filters
- `GET /api/users/stats` - Get user statistics (manager only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id/role` - Update user role (manager only)
- `PUT /api/users/:id/status` - Activate/deactivate user
- `DELETE /api/users/:id` - Delete user (manager only)
- `POST /api/users/:id/resend` - Resend verification email

**Tickets:**
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/my` - Get my tickets (employee)
- `GET /api/tickets` - Get all tickets (IT/manager) with pagination & filters
  - Query params: `page`, `limit`, `status`, `priority`, `department`, `q` (search)
- `GET /api/tickets/:id` - Get ticket with comments
- `PUT /api/tickets/:id/status` - Update status (IT/manager)
- `PUT /api/tickets/:id/priority` - Update priority (IT/manager)
- `PUT /api/tickets/:id/assign` - Assign ticket (IT/manager)
- `POST /api/tickets/:id/comments` - Add comment
- `GET /api/tickets/stats` - Get dashboard stats (manager)
- `GET /api/tickets/sla/breaches` - Get overdue tickets (manager)

**System:**
- `GET /api/health` - Health check with DB connectivity test

See `backend/README.md` for full API documentation.

---

## Running Tests

**Postman/Newman (RBAC):**
```powershell
cd backend
npm run test:postman
```

**Playwright E2E:**
```powershell
cd backend
npm run test:e2e
```

**Database Smoke Test:**
```powershell
cd backend
npm run smoke:db
```

**Migrations:**
```powershell
cd backend
npm run migrate:umzug
npm run list:migrations
```

---

## CI/CD

GitHub Actions workflow (`.github/workflows/postman-rbac.yml`) runs on every push/PR:
1. Installs dependencies
2. Runs database migrations
3. Executes Newman RBAC tests
4. Uploads test reports as artifacts

---

## Troubleshooting

### Windows Localhost Issues
If you experience "connection refused" errors when accessing http://localhost:5000 on Windows:
- **Solution 1:** Use Docker (recommended) - `docker-compose up --build`
- **Solution 2:** Change backend HOST to `0.0.0.0` in `.env`
- **Solution 3:** Access via your machine's actual IP instead of localhost

### Registration Fails
- Ensure backend is running: check http://localhost:5000/api/health
- Check backend console for errors
- Verify JWT_SECRET is set in backend `.env`
- Check database connection with `npm run smoke:db`

### Frontend Can't Connect
- Verify VITE_API_BASE points to the correct backend URL
- Check browser console for CORS errors
- Ensure backend is listening on 0.0.0.0 (not just 127.0.0.1)

---
- Frontend: `AuthContext` handles login/logout and role-based redirects (employee → `/employee`, it_staff → `/it`, manager → `/manager`).

## Next steps / roadmap

Planned features and improvements:

- Manager dashboard: SLA compliance, avg resolution time, open ticket metrics (progress: TODO)
- Ticket detail view: comments, history/audit log, attachments
- SLA modeling: dueAt, escalation rules, scheduled checks/notifications
- Authentication: integrate with Azure Active Directory (company email SSO)
- Persistence: swap dev SQLite fallback for MySQL / managed RDS in production
- E2E tests: Playwright or Cypress for core workflows

## Architecture (high-level)

- Presentation: React + Vite (SPA) with role-based routing and AuthContext
- API: Express routes for auth and tickets, role middleware for RBAC
- Data: Sequelize models (User, Ticket) with relationships and migration-friendly design

## Contributing

1. Fork the repo and create a feature branch.
2. Add tests for new API behavior where applicable.
3. Open a PR — CI will run Newman RBAC tests and show results.

## License

This project is provided as a prototype. Add your license or copyright info as needed.

---

If you'd like, I can also add a separate architecture/design doc (diagram + ERD + API contract) and a `DEPLOY.md` with Azure deployment steps.
