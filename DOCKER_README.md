# Docker Setup for WYZE Support System

Run the entire stack (backend + frontend + MySQL) with Docker Compose.

## Prerequisites

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- Git (to clone/pull updates)

## Quick Start

From the project root:

```powershell
docker-compose up --build
```

This starts:
- **Backend API** on http://localhost:5000
- **Frontend** on http://localhost:5173
- **MySQL** on localhost:3306 (internal)

## Access

Open your browser to **http://localhost:5173**

The frontend will automatically connect to the backend API.

## Stop

```powershell
docker-compose down
```

To remove volumes (reset database):
```powershell
docker-compose down -v
```

## Development

### Hot Reload
- Backend: nodemon watches for changes
- Frontend: Vite HMR enabled

Edit code on your host machine and see changes instantly.

### View Logs
```powershell
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Run Migrations
```powershell
docker-compose exec backend npm run migrate:umzug
```

### Database Shell
```powershell
docker-compose exec db mysql -u root -prootpassword ticket_system
```

## Environment Variables

Edit `docker-compose.yml` to customize:
- `DB_PASS` - MySQL root password
- `JWT_SECRET` - Token signing key
- `PORT` - Backend port (default 5000)

## Troubleshooting

**Port conflicts:**
Change ports in `docker-compose.yml` if 5000 or 5173 are in use.

**Containers won't start:**
```powershell
docker-compose down -v
docker-compose up --build
```

**Database connection errors:**
Wait ~10s for MySQL to initialize on first run.
