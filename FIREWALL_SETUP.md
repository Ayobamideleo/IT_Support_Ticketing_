# Firewall Setup for LAN Access

To access the app from other devices on your network (phones, tablets, laptops), you need to allow inbound traffic on ports 5000 (backend API) and 5174 (frontend dev server).

## Option 1: Allow Node.js through Windows Firewall (Easiest)

1. Open **Windows Security**
2. Go to **Firewall & network protection**
3. Click **Allow an app through firewall**
4. Click **Change settings** (requires admin)
5. Find **Node.js** or **Node.js: Server-side JavaScript** in the list
6. Check the box for **Private** networks (and optionally Public if needed)
7. Click **OK**

## Option 2: Add Specific Port Rules (More Control)

Open PowerShell or Command Prompt **as Administrator** and run:

```powershell
# Allow backend API (port 5000)
netsh advfirewall firewall add rule name="Node.js Backend Port 5000" dir=in action=allow protocol=TCP localport=5000 profile=private

# Allow frontend dev server (port 5174)
netsh advfirewall firewall add rule name="Vite Dev Server Port 5174" dir=in action=allow protocol=TCP localport=5174 profile=private
```

## Verify Firewall Rules

Check if the rules were added:

```powershell
netsh advfirewall firewall show rule name="Node.js Backend Port 5000"
netsh advfirewall firewall show rule name="Vite Dev Server Port 5174"
```

## Test Connectivity

From another device on the same network, open these URLs in a browser:

- Frontend: `http://192.168.70.170:5174/`
- Backend health: `http://192.168.70.170:5000/api/health`

Replace `192.168.70.170` with your PC's current IP address (shown in Vite's "Network" line when you start the dev server).

## Remove Rules (if needed later)

```powershell
netsh advfirewall firewall delete rule name="Node.js Backend Port 5000"
netsh advfirewall firewall delete rule name="Vite Dev Server Port 5174"
```

## Notes

- These rules only apply to **Private** network profile (home/work networks)
- If your PC is on a **Public** network, change `profile=private` to `profile=public` in the commands above
- Your PC's IP address may change when you reconnect to Wi-Fi or switch networks
- Always check the "Network" URL shown by Vite when you start the dev server for the current IP
