# Local Development Setup

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| npm | 10+ | Bundled with Node.js |
| Git | Any | https://git-scm.com |

---

## 1. Clone and Install

```bash
git clone <repo-url>
cd datatransfer
```

Install dependencies for both packages:

```bash
npm install --prefix server
npm install --prefix client
```

---

## 2. Start the Signaling Server

Open a terminal in `datatransfer/server/`:

```bash
cd server
npm run dev
```

You should see:
```
Signaling server running on port 3001
```

The server watches for file changes and restarts automatically (`ts-node-dev`).

---

## 3. Start the Frontend

Open a **second terminal** in `datatransfer/client/`:

```bash
cd client
npm run dev
```

You should see:
```
VITE v5.x  ready in Xms
➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser.

---

## 4. Test on Another Device (Same Network)

To test a real transfer between two devices on the same WiFi, you need to:
- Expose the Vite dev server on your network interface (`--host`)
- Point the client at the server's network IP (not `localhost`)

### Find your local IP

**macOS**
```bash
ipconfig getifaddr en0
# e.g. 192.168.1.7
```

**Linux**
```bash
hostname -I | awk '{print $1}'
# or
ip route get 1 | awk '{print $7; exit}'
```

**Windows (Command Prompt or PowerShell)**
```cmd
ipconfig
```
Look for `IPv4 Address` under your active network adapter (usually `Wi-Fi`).  
Example: `192.168.1.7`

---

### Restart the server with network origin allowed

Stop the running server (`Ctrl+C`), then:

**macOS / Linux**
```bash
cd server
CLIENT_URL="http://localhost:5173,http://192.168.1.7:5173" npm run dev
```

**Windows — Command Prompt**
```cmd
cd server
set CLIENT_URL=http://localhost:5173,http://192.168.1.7:5173
npm run dev
```

**Windows — PowerShell**
```powershell
cd server
$env:CLIENT_URL="http://localhost:5173,http://192.168.1.7:5173"
npm run dev
```

---

### Restart the client with `--host` and network server URL

Stop the running client (`Ctrl+C`), then:

**macOS / Linux**
```bash
cd client
VITE_SERVER_URL=http://192.168.1.7:3001 npm run dev -- --host
```

**Windows — Command Prompt**
```cmd
cd client
set VITE_SERVER_URL=http://192.168.1.7:3001
npm run dev -- --host
```

**Windows — PowerShell**
```powershell
cd client
$env:VITE_SERVER_URL="http://192.168.1.7:3001"
npm run dev -- --host
```

You will see:
```
➜  Local:    http://localhost:5173/
➜  Network:  http://192.168.1.7:5173/
```

On the other device (phone, tablet, another laptop) open:
```
http://192.168.1.7:5173
```

---

## Environment Variables

### Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the HTTP server listens on |
| `CLIENT_URL` | `http://localhost:5173` | Comma-separated allowed CORS origins |

### Client

| Variable | Default | Description |
|---|---|---|
| `VITE_SERVER_URL` | `http://localhost:3001` | Signaling server URL baked into the build |

---

## Troubleshooting

### "Connecting…" never becomes "Connected to server"

1. Make sure the signaling server is running (`curl http://localhost:3001/health` should return `{"status":"ok"}`).
2. If testing across devices, confirm `CLIENT_URL` on the server includes the network origin (`http://192.168.1.x:5173`).
3. Check your firewall allows inbound connections on ports `3001` and `5173`.

### Port already in use

**macOS / Linux**
```bash
# Find and kill the process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Windows — Command Prompt**
```cmd
netstat -ano | findstr :3001
taskkill /PID <PID_from_above> /F
```

**Windows — PowerShell**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```

### TypeScript errors

```bash
cd client
npx tsc --noEmit
```

### Vite fails to start on Windows

If you see `postcss.config.js` module type warnings, add `"type": "module"` to `client/package.json`. This is a cosmetic warning and does not affect functionality.
