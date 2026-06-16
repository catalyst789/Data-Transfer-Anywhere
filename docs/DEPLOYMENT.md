# Deployment

## What You Need to Deploy

| Component | Purpose |
|---|---|
| **Signaling server** | Brokers WebRTC connections — must be always-on |
| **Frontend (static files)** | Served by Nginx or a CDN |
| **TURN server** | Relay for ~10–15% of connections blocked by strict firewalls/NATs |

---

## Option A — Docker Compose on a VPS (Recommended)

Best for: full control, lowest cost, self-hosted TURN.

### 1. Provision a VPS

**Minimum spec:** 1 vCPU, 1 GB RAM, 20 GB SSD  
**Recommended providers:**

| Provider | Spec | Price |
|---|---|---|
| Hetzner CX22 | 2 vCPU, 4 GB RAM | ~€4/mo |
| DigitalOcean Droplet | 1 vCPU, 1 GB RAM | ~$6/mo |
| Vultr Cloud Compute | 1 vCPU, 1 GB RAM | ~$6/mo |
| Linode Nanode | 1 vCPU, 1 GB RAM | ~$5/mo |

**OS:** Ubuntu 22.04 LTS or Debian 12

---

### 2. Open Firewall Ports

Open these ports on your VPS firewall (via provider dashboard or `ufw`):

```
22/tcp      SSH
80/tcp      HTTP (Nginx — redirects to HTTPS)
443/tcp     HTTPS (Nginx)
443/udp     HTTPS/QUIC (optional)
3478/tcp    TURN
3478/udp    TURN
5349/tcp    TURN over TLS
5349/udp    TURN over TLS
49152-65535/udp   TURN relay port range
```

**Using `ufw` on Ubuntu/Debian:**
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443
ufw allow 3478
ufw allow 5349
ufw allow 49152:65535/udp
ufw enable
```

---

### 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

Verify:
```bash
docker --version
docker compose version
```

---

### 4. Clone the Repo

```bash
git clone <repo-url>
cd datatransfer
```

---

### 5. Configure coturn

Edit `coturn/turnserver.conf`:

```ini
# Replace with your VPS public IP
external-ip=YOUR_SERVER_PUBLIC_IP

# Replace with your domain
realm=yourdomain.com

# Create a strong credential
user=turnuser:CHANGE_ME_STRONG_PASSWORD
```

> The `denied-peer-ip` rules in the config block SSRF attacks — do not remove them.

---

### 6. Add TURN Credentials to the ICE Config

In both files below, uncomment and fill in the TURN block:

- `client/src/hooks/useSenderRoom.ts`
- `client/src/hooks/useReceiverRoom.ts`

```typescript
const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:yourdomain.com:3478',
      username: 'turnuser',
      credential: 'CHANGE_ME_STRONG_PASSWORD',
    },
  ],
};
```

---

### 7. Build the Frontend

```bash
cd client
VITE_SERVER_URL=https://yourdomain.com npm run build
cd ..
```

The built files land in `client/dist/` — Nginx serves them directly.

---

### 8. Set Up SSL (Let's Encrypt)

```bash
apt install certbot -y
certbot certonly --standalone -d yourdomain.com
```

Certificates are written to `/etc/letsencrypt/live/yourdomain.com/`.

Update `nginx/nginx.conf` to enable HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /socket.io/ {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

Mount the cert directory in `docker-compose.yml`:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./client/dist:/usr/share/nginx/html:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

---

### 9. Configure docker-compose.yml

```yaml
services:
  server:
    environment:
      - PORT=3001
      - CLIENT_URL=https://yourdomain.com
```

---

### 10. Launch

```bash
docker compose up -d
```

Verify:
```bash
docker compose ps
curl https://yourdomain.com/health
```

### Certificate Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
certbot renew --dry-run

# Add to cron (renews at 3am daily if expiring soon)
echo "0 3 * * * certbot renew --quiet && docker compose -f /path/to/datatransfer/docker-compose.yml restart nginx" | crontab -
```

---

## Option B — Manual Setup (No Docker)

Best for: existing servers, environments where Docker is unavailable, more granular control.

### Prerequisites

```bash
# Ubuntu / Debian
apt update && apt install -y nodejs npm nginx coturn certbot

# macOS (Homebrew — for staging/testing only)
brew install node nginx coturn

# Windows
# Install Node.js from https://nodejs.org
# Nginx: download from https://nginx.org/en/download.html
# coturn: use WSL2 (Ubuntu) or a separate Linux VM — coturn does not run natively on Windows
```

---

### Signaling Server — PM2

PM2 is a process manager that keeps Node.js apps alive and restarts them on crash.

**Install PM2 (all platforms):**
```bash
npm install -g pm2
```

**Build and start:**

```bash
cd server
npm install
npm run build

# macOS / Linux
CLIENT_URL=https://yourdomain.com pm2 start dist/server.js --name datadrop-server

# Windows — Command Prompt
set CLIENT_URL=https://yourdomain.com
pm2 start dist/server.js --name datadrop-server

# Windows — PowerShell
$env:CLIENT_URL="https://yourdomain.com"
pm2 start dist/server.js --name datadrop-server
```

**Auto-start on boot:**

```bash
pm2 save
pm2 startup   # follow the printed instruction to register the startup script
```

**Useful PM2 commands:**
```bash
pm2 list                    # show all processes
pm2 logs datadrop-server    # tail logs
pm2 restart datadrop-server # restart
pm2 stop datadrop-server    # stop
```

---

### Frontend — Nginx Static Files

**Build:**

```bash
cd client
VITE_SERVER_URL=https://yourdomain.com npm run build
```

**Windows — Command Prompt:**
```cmd
set VITE_SERVER_URL=https://yourdomain.com
npm run build
```

**Windows — PowerShell:**
```powershell
$env:VITE_SERVER_URL="https://yourdomain.com"
npm run build
```

**Copy to web root (Linux/macOS):**
```bash
mkdir -p /var/www/datadrop
cp -r client/dist/* /var/www/datadrop/
```

**Nginx config** (`/etc/nginx/sites-available/datadrop`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/datadrop;
    index index.html;

    # SPA fallback — all routes return index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy Socket.io to the Node.js signaling server
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and reload:
```bash
ln -s /etc/nginx/sites-available/datadrop /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### coturn (TURN Server)

**Linux only.** coturn does not run natively on Windows — use WSL2 or a separate Linux server.

```bash
apt install coturn -y
cp coturn/turnserver.conf /etc/coturn/turnserver.conf
```

Edit `/etc/coturn/turnserver.conf`:
```ini
external-ip=YOUR_SERVER_PUBLIC_IP
realm=yourdomain.com
user=turnuser:CHANGE_ME_STRONG_PASSWORD
```

Start and enable:
```bash
systemctl enable coturn
systemctl start coturn
systemctl status coturn
```

---

## Option C — PaaS (No Server Management)

Best for: fastest time to ship, no infrastructure to maintain.

### Signaling Server

Deploy `server/` to any Node.js PaaS:

| Platform | Steps |
|---|---|
| **Railway** | Connect repo → set root to `server/` → add env var `CLIENT_URL=https://yourfrontend.com` |
| **Render** | New Web Service → root `server/` → build `npm run build` → start `node dist/server.js` |
| **Fly.io** | `cd server && fly launch` → set `CLIENT_URL` secret via `fly secrets set CLIENT_URL=https://yourfrontend.com` |
| **Heroku** | Add `Procfile`: `web: node dist/server.js` → `git push heroku main` |

Set the `CLIENT_URL` environment variable to your frontend's domain.

---

### Frontend

Build locally then deploy `client/dist/`:

```bash
cd client
VITE_SERVER_URL=https://your-signaling-server.railway.app npm run build
```

**Windows — PowerShell:**
```powershell
$env:VITE_SERVER_URL="https://your-signaling-server.railway.app"
npm run build
```

| Platform | Deploy |
|---|---|
| **Vercel** | `npm i -g vercel && vercel --cwd client` |
| **Netlify** | Drag and drop `client/dist/` at app.netlify.com |
| **Cloudflare Pages** | Connect repo → build command `npm run build` → output `dist` → root `client/` |
| **GitHub Pages** | Push `client/dist/` to a `gh-pages` branch |

> All platforms need to be configured for SPA routing — all paths must serve `index.html`. Vercel and Netlify do this automatically for Vite projects.

---

### TURN Server (Managed — No Self-Hosting)

If you don't want to run coturn yourself, use a managed STUN/TURN service:

| Service | Free tier | Notes |
|---|---|---|
| **Metered.ca** | 500 MB/month | Easy setup, good for low-traffic apps |
| **Cloudflare Calls** | Free tier available | Requires Cloudflare account |
| **Twilio Network Traversal** | Pay-per-use | Enterprise-grade, no free tier |
| **Open Relay** | 500 MB/month | Community service, no SLA |

Replace the `ICE_CONFIG` in both `useSenderRoom.ts` and `useReceiverRoom.ts` with credentials from your chosen provider.

---

## Production Checklist

### Security
- [ ] TURN server uses a strong credential (not the example password)
- [ ] `denied-peer-ip` ranges in `turnserver.conf` are intact (prevents SSRF via relay)
- [ ] `CLIENT_URL` on the server is set to your exact frontend domain — not `*`
- [ ] SSL certificate installed; HTTP redirects to HTTPS
- [ ] `VITE_SERVER_URL` points to your production server URL (not localhost)

### Reliability
- [ ] TURN relay port range `49152–65535/udp` open in firewall
- [ ] PM2 or Docker restart policy set (`unless-stopped`)
- [ ] SSL auto-renewal configured (certbot cron or managed cert)
- [ ] Server health check monitored (e.g. UptimeRobot pinging `/health`)

### Hardening (optional but recommended)
- [ ] Rate limiting on the signaling server: add `@fastify/rate-limit` to prevent room-creation abuse
- [ ] Room TTL: add a `setTimeout` + `deleteRoom` in `rooms.ts` to clean up stale rooms (e.g. after 24 hours)
- [ ] Limit max receivers per room in `server.ts` (e.g. cap at 20)
- [ ] Nginx `limit_req_zone` to rate-limit `/socket.io/` polling requests

---

## Environment Variables Reference

### Server

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | HTTP port |
| `CLIENT_URL` | Yes (prod) | `http://localhost:5173` | Comma-separated allowed CORS origins |

### Client (baked in at build time)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_SERVER_URL` | Yes (prod) | `http://localhost:3001` | Signaling server URL |
