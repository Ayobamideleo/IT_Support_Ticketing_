# Frontend — WYZE Support Portal

A Vite + React app for the IT Support system.

## Setup

```powershell
cd frontend
npm install
```

Create a `.env` file (optional) to point the app to your backend API:

```
VITE_API_BASE=http://localhost:5000/api
```

If omitted, the default is `http://localhost:5000/api`.

## Run

```powershell
npm run dev
```

Open the shown local URL (typically http://localhost:5173).

## Pages
- /welcome
- /register → /verify-email
- /login
- /employee (employee role)
- /it (it_staff role)
- /manager (manager role)
- /tickets/:id (detail view)

## Notes
- Ensure the backend is running and accessible.
- In development, verification codes are shown in the API response and on the Verify Email page.
- Update `VITE_API_BASE` if your backend runs on a different host/port.
